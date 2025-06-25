// Shared configuration for the Conference Management System

const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
    timeout: 10000,
  },

  // User Roles
  roles: {
    ADMIN: 'admin',
    AUTHOR: 'author',
    REVIEWER: 'reviewer',
  },

  // Paper Status
  paperStatus: {
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    REVISION_REQUESTED: 'revision_requested',
  },

  // Review Status
  reviewStatus: {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    LATE: 'late',
  },

  // File Upload
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/zip'],
    path: './uploads',
  },

  // Pagination
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
};

module.exports = config; 