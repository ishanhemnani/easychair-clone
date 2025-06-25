const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get overall statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total papers
    const { count: totalPapers } = await supabase
      .from('papers')
      .select('*', { count: 'exact', head: true });

    // Get papers by status
    const { data: papersByStatus } = await supabase
      .from('papers')
      .select('status');

    const statusCounts = papersByStatus?.reduce((acc, paper) => {
      acc[paper.status] = (acc[paper.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get total users by role
    const { data: usersByRole } = await supabase
      .from('users')
      .select('role');

    const roleCounts = usersByRole?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get total reviews
    const { count: totalReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    // Get total conferences
    const { count: totalConferences } = await supabase
      .from('conferences')
      .select('*', { count: 'exact', head: true });

    // Calculate acceptance rate
    const acceptedPapers = statusCounts.accepted || 0;
    const totalSubmitted = totalPapers || 0;
    const acceptanceRate = totalSubmitted > 0 ? (acceptedPapers / totalSubmitted * 100).toFixed(1) : 0;

    res.json({
      stats: {
        totalPapers,
        totalReviews,
        totalConferences,
        totalUsers: usersByRole?.length || 0,
        acceptanceRate: parseFloat(acceptanceRate),
        papersByStatus: statusCounts,
        usersByRole: roleCounts
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent activity
router.get('/recent-activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get recent papers
    const { data: recentPapers } = await supabase
      .from('papers')
      .select(`
        id,
        title,
        status,
        created_at,
        users!papers_author_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent reviews
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select(`
        id,
        score,
        submitted_at,
        papers!inner(title),
        users!reviews_reviewer_id_fkey(name)
      `)
      .order('submitted_at', { ascending: false })
      .limit(5);

    // Get recent conferences
    const { data: recentConferences } = await supabase
      .from('conferences')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      recentActivity: {
        papers: recentPapers || [],
        reviews: recentReviews || [],
        conferences: recentConferences || []
      }
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get papers by conference
router.get('/papers-by-conference', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: papersByConference } = await supabase
      .from('papers')
      .select(`
        conferences!inner(title),
        status
      `);

    const conferenceStats = papersByConference?.reduce((acc, paper) => {
      const conferenceTitle = paper.conferences.title;
      if (!acc[conferenceTitle]) {
        acc[conferenceTitle] = { total: 0, accepted: 0, rejected: 0, under_review: 0 };
      }
      acc[conferenceTitle].total += 1;
      if (paper.status === 'accepted') acc[conferenceTitle].accepted += 1;
      else if (paper.status === 'rejected') acc[conferenceTitle].rejected += 1;
      else if (paper.status === 'under_review') acc[conferenceTitle].under_review += 1;
      return acc;
    }, {}) || {};

    res.json({ conferenceStats });

  } catch (error) {
    console.error('Get papers by conference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reviewer activity
router.get('/reviewer-activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: reviewerActivity } = await supabase
      .from('reviews')
      .select(`
        users!reviews_reviewer_id_fkey(name),
        submitted_at
      `)
      .not('submitted_at', 'is', null);

    const reviewerStats = reviewerActivity?.reduce((acc, review) => {
      const reviewerName = review.users.name;
      if (!acc[reviewerName]) {
        acc[reviewerName] = { totalReviews: 0, lastReview: null };
      }
      acc[reviewerName].totalReviews += 1;
      
      const reviewDate = new Date(review.submitted_at);
      if (!acc[reviewerName].lastReview || reviewDate > new Date(acc[reviewerName].lastReview)) {
        acc[reviewerName].lastReview = review.submitted_at;
      }
      return acc;
    }, {}) || {};

    res.json({ reviewerStats });

  } catch (error) {
    console.error('Get reviewer activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 