/**
 * Campus Admin Backend Server (Supabase Version)
 * Handles all API routes for admin dashboard with Supabase backend
 * 
 * Port: 8088 (separate from the mock version on 8087)
 * Routes: /api/admin/*
 * Database: Supabase PostgreSQL
 */

require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const storageRoutes = require('./routes/storage');

const app = express();
const PORT = process.env.ADMIN_PORT || 8088;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8082',
    'http://localhost:3001'
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('[ADMIN SERVER] Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Campus Admin API (Supabase) is running',
    timestamp: new Date().toISOString(),
  });
});

// Admin API routes
app.use('/api/admin', adminRoutes);

// Storage routes (S3 presigned URLs)
app.use('/api/storage', storageRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.name || 'Internal server error',
    message: err.message || 'An unexpected error occurred',
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Campus Admin API (Supabase)                                 ║
║  Port: ${PORT}                                                  ║
║  Database: Supabase PostgreSQL                               ║
║  Status: Running                                             ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
