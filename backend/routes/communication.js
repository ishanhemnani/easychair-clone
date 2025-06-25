const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Send email (mock functionality)
router.post('/send-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { recipient_id, subject, content } = req.body;
    const sent_by = req.user.id;

    // Validate input
    if (!recipient_id || !subject || !content) {
      return res.status(400).json({ error: 'Recipient, subject, and content are required' });
    }

    // Check if recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', recipient_id)
      .single();

    if (recipientError || !recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Log the email (mock sending)
    const { data: emailLog, error } = await supabase
      .from('email_logs')
      .insert([
        {
          recipient_id,
          subject,
          content,
          sent_by,
          status: 'sent'
        }
      ])
      .select('id, subject, sent_at')
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Mock email sending - in real implementation, this would use a service like SendGrid
    console.log('📧 Mock Email Sent:');
    console.log(`To: ${recipient.name} (${recipient.email})`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${content}`);
    console.log('---');

    res.status(201).json({
      message: 'Email sent successfully (mock)',
      email: {
        id: emailLog.id,
        recipient: recipient.name,
        subject: emailLog.subject,
        sent_at: emailLog.sent_at
      }
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get email logs (admin only)
router.get('/email-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: emailLogs, error } = await supabase
      .from('email_logs')
      .select(`
        id,
        subject,
        content,
        sent_at,
        status,
        users!email_logs_recipient_id_fkey(name, email),
        sender:users!email_logs_sent_by_fkey(name)
      `)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch email logs' });
    }

    res.json({ emailLogs });

  } catch (error) {
    console.error('Get email logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send bulk email to role (admin only)
router.post('/send-bulk-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, subject, content } = req.body;
    const sent_by = req.user.id;

    // Validate input
    if (!role || !subject || !content) {
      return res.status(400).json({ error: 'Role, subject, and content are required' });
    }

    // Get all users with the specified role
    const { data: recipients, error: recipientsError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', role);

    if (recipientsError) {
      console.error('Database error:', recipientsError);
      return res.status(500).json({ error: 'Failed to fetch recipients' });
    }

    if (!recipients || recipients.length === 0) {
      return res.status(404).json({ error: 'No users found with the specified role' });
    }

    // Create email logs for all recipients
    const emailLogs = recipients.map(recipient => ({
      recipient_id: recipient.id,
      subject,
      content,
      sent_by,
      status: 'sent'
    }));

    const { data: createdLogs, error } = await supabase
      .from('email_logs')
      .insert(emailLogs)
      .select('id, recipient_id');

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to send bulk emails' });
    }

    // Mock bulk email sending
    console.log(`📧 Mock Bulk Email Sent to ${recipients.length} ${role}s:`);
    console.log(`Subject: ${subject}`);
    recipients.forEach(recipient => {
      console.log(`- ${recipient.name} (${recipient.email})`);
    });
    console.log('---');

    res.status(201).json({
      message: `Bulk email sent successfully to ${recipients.length} ${role}s (mock)`,
      sentCount: recipients.length,
      recipients: recipients.map(r => ({ name: r.name, email: r.email }))
    });

  } catch (error) {
    console.error('Send bulk email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get email statistics
router.get('/email-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total emails sent
    const { count: totalEmails } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true });

    // Get emails by status
    const { data: emailsByStatus } = await supabase
      .from('email_logs')
      .select('status');

    const statusCounts = emailsByStatus?.reduce((acc, email) => {
      acc[email.status] = (acc[email.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get emails sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: emailsToday } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', today.toISOString());

    res.json({
      stats: {
        totalEmails,
        emailsToday,
        emailsByStatus: statusCounts
      }
    });

  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 