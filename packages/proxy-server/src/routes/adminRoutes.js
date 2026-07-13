/**
 * Admin Routes
 * RESTful endpoints for all admin resources
 */

const express = require('express');
const {
  campusController,
  facultyController,
  departmentController,
  courseController,
  moduleController,
  roleController,
  staffController,
  residenceController,
  extracurricularController,
  studentController,
} = require('../controllers/adminController');

const router = express.Router();

/**
 * Auth Middleware - validates Cognito JWT token
 * Attaches user info to req.user
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(`[authMiddleware] ${req.method} ${req.path}`);
  console.log(`[authMiddleware] Authorization header present:`, !!authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[authMiddleware] Missing or invalid Authorization header');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log(`[authMiddleware] Token (first 20 chars): ${token.substring(0, 20)}...`);

  // In production, validate Cognito JWT token here
  // For now, use 'system' for testing (will be converted to NULL in db)
  req.user = {
    id: 'system',
    email: 'admin@university.edu',
    role: 'admin',
  };
  
  console.log('[authMiddleware] Auth passed, user set to:', req.user);

  next();
}

// Apply auth middleware to all admin routes
router.use(authMiddleware);

// ============================================================================
// CAMPUSES ROUTES
// ============================================================================
router.get('/campuses', campusController.getAll);
router.post('/campuses', campusController.create);
router.get('/campuses/:id', campusController.getById);
router.put('/campuses/:id', campusController.update);
router.delete('/campuses/:id', campusController.delete);
router.delete('/campuses', campusController.deleteMany);

// ============================================================================
// FACULTIES ROUTES
// ============================================================================
router.get('/faculties', facultyController.getAll);
router.post('/faculties', facultyController.create);
router.get('/faculties/:id', facultyController.getById);
router.put('/faculties/:id', facultyController.update);
router.delete('/faculties/:id', facultyController.delete);
router.delete('/faculties', facultyController.deleteMany);

// ============================================================================
// DEPARTMENTS ROUTES
// ============================================================================
router.get('/departments', departmentController.getAll);
router.post('/departments', departmentController.create);
router.get('/departments/:id', departmentController.getById);
router.put('/departments/:id', departmentController.update);
router.delete('/departments/:id', departmentController.delete);
router.delete('/departments', departmentController.deleteMany);

// ============================================================================
// COURSES ROUTES
// ============================================================================
router.get('/courses', courseController.getAll);
router.post('/courses', courseController.create);
router.get('/courses/:id', courseController.getById);
router.put('/courses/:id', courseController.update);
router.delete('/courses/:id', courseController.delete);
router.delete('/courses', courseController.deleteMany);

// ============================================================================
// MODULES ROUTES
// ============================================================================
router.get('/modules', moduleController.getAll);
router.post('/modules', moduleController.create);
router.get('/modules/:id', moduleController.getById);
router.put('/modules/:id', moduleController.update);
router.delete('/modules/:id', moduleController.delete);
router.delete('/modules', moduleController.deleteMany);

// ============================================================================
// ROLES ROUTES
// ============================================================================
router.get('/roles', roleController.getAll);
router.post('/roles', roleController.create);
router.get('/roles/:id', roleController.getById);
router.put('/roles/:id', roleController.update);
router.delete('/roles/:id', roleController.delete);
router.delete('/roles', roleController.deleteMany);

// ============================================================================
// STAFF ROUTES
// ============================================================================
router.get('/staff', staffController.getAll);
router.post('/staff', staffController.create);
router.get('/staff/:id', staffController.getById);
router.put('/staff/:id', staffController.update);
router.delete('/staff/:id', staffController.delete);
router.delete('/staff', staffController.deleteMany);

// ============================================================================
// RESIDENCES ROUTES
// ============================================================================
router.get('/residences', residenceController.getAll);
router.post('/residences', residenceController.create);
router.get('/residences/:id', residenceController.getById);
router.put('/residences/:id', residenceController.update);
router.delete('/residences/:id', residenceController.delete);
router.delete('/residences', residenceController.deleteMany);

// ============================================================================
// EXTRACURRICULARS ROUTES
// ============================================================================
router.get('/extracurriculars', extracurricularController.getAll);
router.post('/extracurriculars', extracurricularController.create);
router.get('/extracurriculars/:id', extracurricularController.getById);
router.put('/extracurriculars/:id', extracurricularController.update);
router.delete('/extracurriculars/:id', extracurricularController.delete);
router.delete('/extracurriculars', extracurricularController.deleteMany);

// ============================================================================
// STUDENTS ROUTES
// ============================================================================
console.log('[adminRoutes] Registering student routes...');
router.get('/students', (req, res) => {
  console.log('[adminRoutes] GET /students hit');
  return studentController.getAll(req, res);
});
router.post('/students', studentController.create);
router.get('/students/:id', studentController.getById);
router.put('/students/:id', studentController.update);
router.delete('/students/:id', studentController.delete);
router.delete('/students', studentController.deleteMany);
console.log('[adminRoutes] Student routes registered');

module.exports = router;
