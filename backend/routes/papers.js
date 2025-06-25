const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAuthor, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/zip'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and ZIP files are allowed.'), false);
    }
  }
});

// Submit a new paper
router.post('/submit', authenticateToken, requireAuthor, upload.single('paper'), async (req, res) => {
  try {
    const { title, abstract, conference_id } = req.body;
    const author_id = req.user.id;

    // Validate input
    if (!title || !abstract || !conference_id) {
      return res.status(400).json({ error: 'Title, abstract, and conference are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Paper file is required' });
    }

    // Check if conference exists and is active
    const { data: conference, error: confError } = await supabase
      .from('conferences')
      .select('id, status, submission_deadline')
      .eq('id', conference_id)
      .single();

    if (confError || !conference) {
      return res.status(404).json({ error: 'Conference not found' });
    }

    if (conference.status !== 'active') {
      return res.status(400).json({ error: 'Conference is not accepting submissions' });
    }

    // Check submission deadline
    if (conference.submission_deadline && new Date() > new Date(conference.submission_deadline)) {
      return res.status(400).json({ error: 'Submission deadline has passed' });
    }

    // Create paper record
    const { data: paper, error } = await supabase
      .from('papers')
      .insert([
        {
          title,
          abstract,
          file_path: req.file.path,
          file_name: req.file.originalname,
          conference_id,
          author_id,
          status: 'submitted'
        }
      ])
      .select('id, title, abstract, file_name, status, created_at')
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to submit paper' });
    }

    res.status(201).json({
      message: 'Paper submitted successfully',
      paper
    });

  } catch (error) {
    console.error('Paper submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get papers by author
router.get('/my-papers', authenticateToken, requireAuthor, async (req, res) => {
  try {
    const author_id = req.user.id;

    const { data: papers, error } = await supabase
      .from('papers')
      .select(`
        id,
        title,
        abstract,
        file_name,
        status,
        created_at,
        conferences!inner(title)
      `)
      .eq('author_id', author_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch papers' });
    }

    res.json({ papers });

  } catch (error) {
    console.error('Get papers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all papers (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: papers, error } = await supabase
      .from('papers')
      .select(`
        id,
        title,
        abstract,
        file_name,
        status,
        created_at,
        users!papers_author_id_fkey(name, email),
        conferences!inner(title)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch papers' });
    }

    res.json({ papers });

  } catch (error) {
    console.error('Get all papers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get paper by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const paper_id = req.params.id;
    const user = req.user;

    // Build query based on user role
    let query = supabase
      .from('papers')
      .select(`
        id,
        title,
        abstract,
        file_name,
        status,
        created_at,
        users!papers_author_id_fkey(name, email),
        conferences!inner(title)
      `)
      .eq('id', paper_id)
      .single();

    // Authors can only see their own papers
    if (user.role === 'author') {
      query = query.eq('author_id', user.id);
    }

    const { data: paper, error } = await query;

    if (error || !paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json({ paper });

  } catch (error) {
    console.error('Get paper error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update paper status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paper_id = req.params.id;
    const { status } = req.body;

    const validStatuses = ['submitted', 'under_review', 'accepted', 'rejected', 'revision_requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: paper, error } = await supabase
      .from('papers')
      .update({ status })
      .eq('id', paper_id)
      .select('id, title, status')
      .single();

    if (error || !paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json({
      message: 'Paper status updated successfully',
      paper
    });

  } catch (error) {
    console.error('Update paper status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download paper file
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const paper_id = req.params.id;
    const user = req.user;

    // Get paper details
    let query = supabase
      .from('papers')
      .select('id, file_path, file_name, author_id')
      .eq('id', paper_id)
      .single();

    // Authors can only download their own papers
    if (user.role === 'author') {
      query = query.eq('author_id', user.id);
    }

    const { data: paper, error } = await query;

    if (error || !paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // Check if file exists
    if (!fs.existsSync(paper.file_path)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Send file
    res.download(paper.file_path, paper.file_name);

  } catch (error) {
    console.error('Download paper error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 