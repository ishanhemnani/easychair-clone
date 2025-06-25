const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all conferences (public)
router.get('/', async (req, res) => {
  try {
    const { data: conferences, error } = await supabase
      .from('conferences')
      .select('id, title, description, start_date, end_date, submission_deadline, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch conferences' });
    }

    res.json({ conferences });

  } catch (error) {
    console.error('Get conferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conference by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const conference_id = req.params.id;

    const { data: conference, error } = await supabase
      .from('conferences')
      .select('id, title, description, start_date, end_date, submission_deadline, status')
      .eq('id', conference_id)
      .single();

    if (error || !conference) {
      return res.status(404).json({ error: 'Conference not found' });
    }

    res.json({ conference });

  } catch (error) {
    console.error('Get conference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create conference (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, start_date, end_date, submission_deadline } = req.body;
    const created_by = req.user.id;

    // Validate input
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data: conference, error } = await supabase
      .from('conferences')
      .insert([
        {
          title,
          description,
          start_date,
          end_date,
          submission_deadline,
          created_by,
          status: 'draft'
        }
      ])
      .select('id, title, description, start_date, end_date, submission_deadline, status, created_at')
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create conference' });
    }

    res.status(201).json({
      message: 'Conference created successfully',
      conference
    });

  } catch (error) {
    console.error('Create conference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update conference (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const conference_id = req.params.id;
    const { title, description, start_date, end_date, submission_deadline, status } = req.body;

    const { data: conference, error } = await supabase
      .from('conferences')
      .update({
        title,
        description,
        start_date,
        end_date,
        submission_deadline,
        status
      })
      .eq('id', conference_id)
      .select('id, title, description, start_date, end_date, submission_deadline, status')
      .single();

    if (error || !conference) {
      return res.status(404).json({ error: 'Conference not found' });
    }

    res.json({
      message: 'Conference updated successfully',
      conference
    });

  } catch (error) {
    console.error('Update conference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete conference (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const conference_id = req.params.id;

    const { error } = await supabase
      .from('conferences')
      .delete()
      .eq('id', conference_id);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to delete conference' });
    }

    res.json({ message: 'Conference deleted successfully' });

  } catch (error) {
    console.error('Delete conference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 