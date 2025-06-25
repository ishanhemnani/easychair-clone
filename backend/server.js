const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Import routes
const authRoutes = require('./routes/auth');
const paperRoutes = require('./routes/papers');
const conferenceRoutes = require('./routes/conferences');
const reviewRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const communicationRoutes = require('./routes/communication');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/conferences', conferenceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/communication', communicationRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Conference Management System API is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`Paper endpoints: http://localhost:${PORT}/api/papers`);
  console.log(`Conference endpoints: http://localhost:${PORT}/api/conferences`);
  console.log(`Review endpoints: http://localhost:${PORT}/api/reviews`);
  console.log(`Analytics endpoints: http://localhost:${PORT}/api/analytics`);
  console.log(`Communication endpoints: http://localhost:${PORT}/api/communication`);
}); 