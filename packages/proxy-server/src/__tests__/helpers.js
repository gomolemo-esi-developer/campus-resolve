/**
 * Test helpers for integration tests
 */

const request = require('supertest');

/**
 * Create a test Express app with routes mounted
 * Loads all routes from backend-server.js and backend-resolve.js
 */
function createTestApp() {
  const express = require('express');
  const app = express();
  
  // Add middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Mock auth middleware for tests
  app.use((req, res, next) => {
    // Check for test auth header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      if (token.startsWith('test_')) {
        // Parse test token: test_role_sub
        const parts = token.split('_');
        if (parts.length >= 3) {
          req.user = {
            role: parts[1],
            sub: parts[2],
            email: `test-${parts[1]}@example.com`,
          };
        }
      }
    }
    next();
  });
  
  return app;
}

/**
 * Get an authorization header for testing
 * @param {string} role - 'student', 'staff', or 'admin'
 * @param {string} sub - Cognito subject ID
 * @returns {string} Authorization header value
 */
function getAuthHeader(role = 'student', sub = 'test-user-123') {
  return `Bearer test_${role}_${sub}`;
}

/**
 * Create a mock user object
 * @param {object} options - User options
 * @returns {object} Mock user object
 */
function createMockUser(options = {}) {
  const defaults = {
    role: 'student',
    sub: 'test-user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    name: 'Test User',
  };
  
  return { ...defaults, ...options };
}

/**
 * Clean up test data - placeholder for actual cleanup
 * In real tests, this would delete created records from Supabase
 * @param {object} supabaseClient - Supabase client
 * @param {Array} testIds - Array of IDs to clean up
 */
async function cleanupTestData(supabaseClient, testIds) {
  if (!testIds || testIds.length === 0) return;
  
  // In a real implementation, this would delete test records
  console.log(`[Test] Cleanup: Would delete ${testIds.length} records`);
}

/**
 * Wait for a condition with timeout
 * @param {function} condition - Function that returns true when condition is met
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<boolean>} True if condition met, false if timeout
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return true;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
}

module.exports = {
  createTestApp,
  getAuthHeader,
  createMockUser,
  cleanupTestData,
  waitFor,
};