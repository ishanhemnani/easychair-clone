const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireReviewer, requireAdmin, requireAdminOrReviewer } = require('../middleware/auth');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get assigned papers for reviewer
router.get('/assigned', authenticateToken, requireReviewer, async (req, res) => {
  try {
    const reviewer_id = req.user.id;

    const { data: assignments, error } = await supabase
      .from('reviewer_assignments')
      .select(`
        id,
        status,
        assigned_at,
        papers!inner(
          id,
          title,
          abstract,
          file_name,
          status,
          created_at,
          conferences!inner(title),
          users!papers_author_id_fkey(name)
        )
      `)
      .eq('reviewer_id', reviewer_id)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch assigned papers' });
    }

    res.json({ assignments });

  } catch (error) {
    console.error('Get assigned papers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a review
router.post('/submit', authenticateToken, requireReviewer, async (req, res) => {
  try {
    const { paper_id, score, comments } = req.body;
    const reviewer_id = req.user.id;

    // Validate input
    if (!paper_id || !score || !comments) {
      return res.status(400).json({ error: 'Paper ID, score, and comments are required' });
    }

    if (score < 1 || score > 10) {
      return res.status(400).json({ error: 'Score must be between 1 and 10' });
    }

    // Check if reviewer is assigned to this paper
    const { data: assignment, error: assignError } = await supabase
      .from('reviewer_assignments')
      .select('id')
      .eq('paper_id', paper_id)
      .eq('reviewer_id', reviewer_id)
      .single();

    if (assignError || !assignment) {
      return res.status(403).json({ error: 'You are not assigned to review this paper' });
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('paper_id', paper_id)
      .eq('reviewer_id', reviewer_id)
      .single();

    if (existingReview) {
      return res.status(400).json({ error: 'Review already submitted for this paper' });
    }

    // Create review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert([
        {
          paper_id,
          reviewer_id,
          score,
          comments,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }
      ])
      .select('id, score, comments, submitted_at')
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to submit review' });
    }

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });

  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reviews for a paper
router.get('/paper/:paperId', authenticateToken, requireAdminOrReviewer, async (req, res) => {
  try {
    const paper_id = req.params.paperId;
    const user = req.user;

    // Check if user has access to this paper
    if (user.role === 'reviewer') {
      const { data: assignment } = await supabase
        .from('reviewer_assignments')
        .select('id')
        .eq('paper_id', paper_id)
        .eq('reviewer_id', user.id)
        .single();

      if (!assignment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        score,
        comments,
        status,
        submitted_at,
        users!reviews_reviewer_id_fkey(name)
      `)
      .eq('paper_id', paper_id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    res.json({ reviews });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign reviewer to paper (admin only)
router.post('/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { paper_id, reviewer_id } = req.body;
    const assigned_by = req.user.id;

    // Validate input
    if (!paper_id || !reviewer_id) {
      return res.status(400).json({ error: 'Paper ID and reviewer ID are required' });
    }

    // Check if reviewer exists and is a reviewer
    const { data: reviewer, error: reviewerError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', reviewer_id)
      .eq('role', 'reviewer')
      .single();

    if (reviewerError || !reviewer) {
      return res.status(400).json({ error: 'Invalid reviewer' });
    }

    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('reviewer_assignments')
      .select('id')
      .eq('paper_id', paper_id)
      .eq('reviewer_id', reviewer_id)
      .single();

    if (existingAssignment) {
      return res.status(400).json({ error: 'Reviewer already assigned to this paper' });
    }

    // Create assignment
    const { data: assignment, error } = await supabase
      .from('reviewer_assignments')
      .insert([
        {
          paper_id,
          reviewer_id,
          assigned_by,
          status: 'assigned'
        }
      ])
      .select('id, assigned_at')
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to assign reviewer' });
    }

    res.status(201).json({
      message: 'Reviewer assigned successfully',
      assignment
    });

  } catch (error) {
    console.error('Assign reviewer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all reviews (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        score,
        comments,
        status,
        submitted_at,
        papers!inner(title),
        users!reviews_reviewer_id_fkey(name)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    res.json({ reviews });

  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 