/**
 * Campus Admin Backend Server
 * Handles all API routes for admin dashboard, complaints management, and system settings
 * 
 * Port: 8087
 * Routes: /api/admin/*
 */

require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const app = express();

const PORT = 8087;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8082', 'http://localhost:8083', 'http://localhost:8084', 'http://localhost:5173'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  }

  // Extract and validate token with real backend
  const token = authHeader.replace('Bearer ', '');
  
  // TODO: Validate token with Cognito/Supabase
  // For now, extract user ID from token claims
  req.user = {
    id: token.substring(0, 8),
    email: null, // Will be populated by backend
    role: null,  // Will be populated by backend
  };

  next();
}

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const cognitoAuthRoutes = require('./routes/cognitoAuth');
app.use('/api/auth/cognito', cognitoAuthRoutes);

// ============================================================================
// ADMIN API ROUTES - Using Supabase
// ============================================================================
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// ============================================================================
// DATA STORAGE - Using Supabase (legacy in-memory fallback, not used)
// ============================================================================

const campuses = [];
const departments = [];
const faculties = [];
const modules = [];
const roles = [];
const extracurriculars = [];
const staff = [];
const residences = [];
const courses = [];
const complaints = [];
const users = [
  {
    id: 'user-002',
    email: 'sarah.johnson@university.edu',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'student',
    status: 'active',
    createdAt: new Date('2025-02-01'),
    lastLogin: new Date('2025-03-04T10:15:00'),
  },
  {
    id: 'admin-002',
    email: 'antonie.smith@university.edu',
    firstName: 'Antonie',
    lastName: 'Smith',
    role: 'admin-resolve',
    status: 'active',
    createdAt: new Date('2025-01-10'),
    lastLogin: new Date('2025-03-05T13:45:00'),
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Generate unique ID (simple incrementing)
let campusIdCounter = parseInt(campuses[campuses.length - 1]?.id.replace('CAMP', '') || '0') + 1;
let courseIdCounter = parseInt(courses[courses.length - 1]?.id.replace('COURSE', '') || '0') + 1;
let departmentIdCounter = parseInt(departments[departments.length - 1]?.id.replace('DEPT', '') || '0') + 1;
let facultyIdCounter = parseInt(faculties[faculties.length - 1]?.id.replace('FAC', '') || '0') + 1;
let moduleIdCounter = parseInt(modules[modules.length - 1]?.id.replace('MOD', '') || '0') + 1;
let roleIdCounter = parseInt(roles[roles.length - 1]?.id.replace('ROLE', '') || '0') + 1;
let extracurricularIdCounter = parseInt(extracurriculars[extracurriculars.length - 1]?.id.replace('EXT', '') || '0') + 1;
let staffIdCounter = parseInt(staff[staff.length - 1]?.id.replace('STAFF', '') || '0') + 1;
let residenceIdCounter = parseInt(residences[residences.length - 1]?.id.replace('RES', '') || '0') + 1;

function generateCampusId() {
  return 'CAMP' + (campusIdCounter++);
}

function generateCourseId() {
  return 'COURSE' + (courseIdCounter++);
}

function generateDepartmentId() {
  return 'DEPT' + (departmentIdCounter++);
}

function generateFacultyId() {
  return 'FAC' + (facultyIdCounter++);
}

function generateModuleId() {
  return 'MOD' + (moduleIdCounter++);
}

function generateRoleId() {
  return 'ROLE' + (roleIdCounter++);
}

function generateExtracurricularId() {
  return 'EXT' + (extracurricularIdCounter++);
}

function generateStaffId() {
  return 'STAFF' + (staffIdCounter++);
}

function generateResidenceId() {
  return 'RES' + (residenceIdCounter++);
}

// Create lookup maps for department and faculty information
const departmentMap = {};
const facultyMap = {};

departments.forEach(dept => {
  departmentMap[dept.id] = dept;
});

faculties.forEach(fac => {
  facultyMap[fac.id] = fac.name;
});

// ============================================================================
// CAMPUS ENDPOINTS
// ============================================================================

// POST /api/admin/campuses - Create new campus
app.post('/api/admin/campuses', authMiddleware, (req, res) => {
  try {
    const { name, abbreviation, location } = req.body;

    const errors = [];
    if (!name || name.trim().length === 0) {
      errors.push('Campus name is required');
    }
    if (!abbreviation || abbreviation.trim().length === 0) {
      errors.push('Abbreviation is required');
    } else if (abbreviation.length < 2 || abbreviation.length > 4) {
      errors.push('Abbreviation must be 2-4 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const newCampus = {
      id: generateCampusId(),
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      location: location ? location.trim() : '',
    };

    campuses.push(newCampus);

    res.status(201).json({
      success: true,
      data: newCampus,
      message: 'Campus created successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Create campus error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/campuses - Get all campuses with pagination and search
app.get('/api/admin/campuses', authMiddleware, (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    let filteredCampuses = [...campuses];

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCampuses = filteredCampuses.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.abbreviation.toLowerCase().includes(searchLower) ||
        c.location.toLowerCase().includes(searchLower) ||
        c.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = filteredCampuses.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      total: filteredCampuses.length,
      page: pageNum,
      limit: limitNum,
      message: 'Campuses retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get campuses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/campuses/:id - Get single campus
app.get('/api/admin/campuses/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const campus = campuses.find(c => c.id === id);

    if (!campus) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Campus not found',
      });
    }

    res.json({
      success: true,
      data: campus,
      message: 'Campus retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get campus error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/campuses/:id - Update campus
app.put('/api/admin/campuses/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { name, abbreviation, location } = req.body;

    const campusIndex = campuses.findIndex(c => c.id === id);
    if (campusIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Campus not found',
      });
    }

    const errors = [];
    if (name !== undefined && name.trim().length === 0) {
      errors.push('Campus name cannot be empty');
    }
    if (abbreviation !== undefined) {
      if (abbreviation.trim().length === 0) {
        errors.push('Abbreviation cannot be empty');
      } else if (abbreviation.length < 2 || abbreviation.length > 4) {
        errors.push('Abbreviation must be 2-4 characters');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const campus = campuses[campusIndex];
    if (name !== undefined) campus.name = name.trim();
    if (abbreviation !== undefined) campus.abbreviation = abbreviation.trim().toUpperCase();
    if (location !== undefined) campus.location = location.trim();

    res.json({
      success: true,
      data: campus,
      message: 'Campus updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update campus error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/campuses/:id - Delete single campus
app.delete('/api/admin/campuses/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const campusIndex = campuses.findIndex(c => c.id === id);

    if (campusIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Campus not found',
      });
    }

    const deletedCampus = campuses.splice(campusIndex, 1)[0];

    res.json({
      success: true,
      data: { id: deletedCampus.id, message: 'Campus deleted successfully' },
      message: 'Campus deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Delete campus error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/campuses - Batch delete campuses
app.delete('/api/admin/campuses', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['ids must be a non-empty array'],
      });
    }

    const idsToDelete = new Set(ids);
    const beforeCount = campuses.length;
    const filtered = campuses.filter(c => !idsToDelete.has(c.id));
    const deletedCount = beforeCount - filtered.length;

    campuses.length = 0;
    campuses.push(...filtered);

    res.json({
      success: true,
      data: { deleted: deletedCount, message: `${deletedCount} campus(es) deleted successfully` },
      message: 'Campuses deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Batch delete campuses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// COURSE ENDPOINTS
// ============================================================================

// POST /api/admin/courses - Create new course
app.post('/api/admin/courses', authMiddleware, (req, res) => {
  try {
    const { code, name, departmentId, qualificationType } = req.body;

    const errors = [];
    if (!code || code.trim().length === 0) {
      errors.push('Course code is required');
    }
    if (!name || name.trim().length === 0) {
      errors.push('Course name is required');
    }
    if (!departmentId) {
      errors.push('Department is required');
    } else if (!departmentMap[departmentId]) {
      errors.push('Invalid department ID');
    }
    if (!qualificationType) {
      errors.push('Qualification type is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const departmentInfo = departmentMap[departmentId];
    const newCourse = {
      id: generateCourseId(),
      code: code.trim(),
      name: name.trim(),
      departmentId,
      departmentName: departmentInfo.name,
      facultyId: departmentInfo.facultyId,
      facultyName: facultyMap[departmentInfo.facultyId],
      qualificationType,
    };

    courses.push(newCourse);

    res.status(201).json({
      success: true,
      data: newCourse,
      message: 'Course created successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Create course error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/courses - Get all courses with filtering and pagination
app.get('/api/admin/courses', authMiddleware, (req, res) => {
  try {
    const { qualificationType, departmentId, search, page = 1, limit = 20 } = req.query;

    let filteredCourses = [...courses];

    // Filter by qualification type
    if (qualificationType) {
      filteredCourses = filteredCourses.filter(c => c.qualificationType === qualificationType);
    }

    // Filter by department
    if (departmentId) {
      filteredCourses = filteredCourses.filter(c => c.departmentId === departmentId);
    }

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCourses = filteredCourses.filter(c =>
        c.code.toLowerCase().includes(searchLower) ||
        c.name.toLowerCase().includes(searchLower) ||
        c.departmentName.toLowerCase().includes(searchLower) ||
        c.facultyName.toLowerCase().includes(searchLower) ||
        c.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = filteredCourses.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      total: filteredCourses.length,
      page: pageNum,
      limit: limitNum,
      message: 'Courses retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/courses/:id - Get single course
app.get('/api/admin/courses/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const course = courses.find(c => c.id === id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Course not found',
      });
    }

    res.json({
      success: true,
      data: course,
      message: 'Course retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get course error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/courses/:id - Update course
app.put('/api/admin/courses/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, departmentId, qualificationType } = req.body;

    const courseIndex = courses.findIndex(c => c.id === id);
    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Course not found',
      });
    }

    const errors = [];
    if (code !== undefined && code.trim().length === 0) {
      errors.push('Course code cannot be empty');
    }
    if (name !== undefined && name.trim().length === 0) {
      errors.push('Course name cannot be empty');
    }
    if (departmentId !== undefined) {
      if (!departmentMap[departmentId]) {
        errors.push('Invalid department ID');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const course = courses[courseIndex];
    if (code !== undefined) course.code = code.trim();
    if (name !== undefined) course.name = name.trim();
    if (departmentId !== undefined) {
      const deptInfo = departmentMap[departmentId];
      course.departmentId = departmentId;
      course.departmentName = deptInfo.name;
      course.facultyId = deptInfo.facultyId;
      course.facultyName = facultyMap[deptInfo.facultyId];
    }
    if (qualificationType !== undefined) course.qualificationType = qualificationType;

    res.json({
      success: true,
      data: course,
      message: 'Course updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update course error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/courses/:id - Delete single course
app.delete('/api/admin/courses/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const courseIndex = courses.findIndex(c => c.id === id);

    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Course not found',
      });
    }

    const deletedCourse = courses.splice(courseIndex, 1)[0];

    res.json({
      success: true,
      data: { id: deletedCourse.id, message: 'Course deleted successfully' },
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Delete course error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/courses - Batch delete courses
app.delete('/api/admin/courses', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['ids must be a non-empty array'],
      });
    }

    const idsToDelete = new Set(ids);
    const beforeCount = courses.length;
    const filtered = courses.filter(c => !idsToDelete.has(c.id));
    const deletedCount = beforeCount - filtered.length;

    courses.length = 0;
    courses.push(...filtered);

    res.json({
      success: true,
      data: { deleted: deletedCount, message: `${deletedCount} course(s) deleted successfully` },
      message: 'Courses deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Batch delete courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// DEPARTMENT ENDPOINTS
// ============================================================================

// POST /api/admin/departments - Create new department
app.post('/api/admin/departments', authMiddleware, (req, res) => {
  try {
    const { name, abbreviation, facultyId } = req.body;

    const errors = [];
    if (!name || name.trim().length === 0) {
      errors.push('Department name is required');
    }
    if (!abbreviation || abbreviation.trim().length === 0) {
      errors.push('Abbreviation is required');
    } else if (abbreviation.length < 2 || abbreviation.length > 4) {
      errors.push('Abbreviation must be 2-4 characters');
    }
    if (!facultyId) {
      errors.push('Faculty ID is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const faculty = faculties.find(f => f.id === facultyId);
    if (!faculty) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Invalid faculty ID'],
      });
    }

    const newDepartment = {
      id: generateDepartmentId(),
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      facultyId,
      facultyName: faculty.name,
    };

    departments.push(newDepartment);

    res.status(201).json({
      success: true,
      data: newDepartment,
      message: 'Department created successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Create department error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/departments - Get all departments with pagination and search
app.get('/api/admin/departments', authMiddleware, (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    let filteredDepartments = [...departments];

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDepartments = filteredDepartments.filter(d =>
        d.name.toLowerCase().includes(searchLower) ||
        d.abbreviation.toLowerCase().includes(searchLower) ||
        d.facultyName.toLowerCase().includes(searchLower) ||
        d.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = filteredDepartments.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      total: filteredDepartments.length,
      page: pageNum,
      limit: limitNum,
      message: 'Departments retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get departments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/departments/:id - Get single department
app.get('/api/admin/departments/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const department = departments.find(d => d.id === id);

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      data: department,
      message: 'Department retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get department error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/departments/:id - Update department
app.put('/api/admin/departments/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { name, abbreviation, facultyId } = req.body;

    const departmentIndex = departments.findIndex(d => d.id === id);
    if (departmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Department not found',
      });
    }

    const errors = [];
    if (name !== undefined && name.trim().length === 0) {
      errors.push('Department name cannot be empty');
    }
    if (abbreviation !== undefined) {
      if (abbreviation.trim().length === 0) {
        errors.push('Abbreviation cannot be empty');
      } else if (abbreviation.length < 2 || abbreviation.length > 4) {
        errors.push('Abbreviation must be 2-4 characters');
      }
    }
    if (facultyId !== undefined) {
      const faculty = faculties.find(f => f.id === facultyId);
      if (!faculty) {
        errors.push('Invalid faculty ID');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const department = departments[departmentIndex];
    if (name !== undefined) department.name = name.trim();
    if (abbreviation !== undefined) department.abbreviation = abbreviation.trim().toUpperCase();
    if (facultyId !== undefined) {
      const faculty = faculties.find(f => f.id === facultyId);
      department.facultyId = facultyId;
      department.facultyName = faculty.name;
    }

    res.json({
      success: true,
      data: department,
      message: 'Department updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update department error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/departments/:id - Delete single department
app.delete('/api/admin/departments/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const departmentIndex = departments.findIndex(d => d.id === id);

    if (departmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Department not found',
      });
    }

    const deleted = departments.splice(departmentIndex, 1);

    res.json({
      success: true,
      data: deleted[0],
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Delete department error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/departments - Batch delete departments
app.delete('/api/admin/departments', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['ids must be a non-empty array'],
      });
    }

    const idsToDelete = new Set(ids);
    const beforeCount = departments.length;
    const filtered = departments.filter(d => !idsToDelete.has(d.id));
    const deletedCount = beforeCount - filtered.length;

    departments.length = 0;
    departments.push(...filtered);

    res.json({
      success: true,
      data: { deleted: deletedCount, message: `${deletedCount} department(s) deleted successfully` },
      message: 'Departments deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Batch delete departments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// FACULTY ENDPOINTS
// ============================================================================

// POST /api/admin/faculties - Create new faculty
app.post('/api/admin/faculties', authMiddleware, (req, res) => {
  try {
    const { name, abbreviation } = req.body;

    const errors = [];
    if (!name || name.trim().length === 0) {
      errors.push('Faculty name is required');
    }
    if (!abbreviation || abbreviation.trim().length === 0) {
      errors.push('Abbreviation is required');
    } else if (abbreviation.length < 2 || abbreviation.length > 4) {
      errors.push('Abbreviation must be 2-4 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const newFaculty = {
      id: generateFacultyId(),
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
    };

    faculties.push(newFaculty);

    res.status(201).json({
      success: true,
      data: newFaculty,
      message: 'Faculty created successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Create faculty error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/faculties - Get all faculties with pagination and search
app.get('/api/admin/faculties', authMiddleware, (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    let filteredFaculties = [...faculties];

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredFaculties = filteredFaculties.filter(f =>
        f.name.toLowerCase().includes(searchLower) ||
        f.abbreviation.toLowerCase().includes(searchLower) ||
        f.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = filteredFaculties.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      total: filteredFaculties.length,
      page: pageNum,
      limit: limitNum,
      message: 'Faculties retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get faculties error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/faculties/:id - Get single faculty
app.get('/api/admin/faculties/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const faculty = faculties.find(f => f.id === id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Faculty not found',
      });
    }

    res.json({
      success: true,
      data: faculty,
      message: 'Faculty retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get faculty error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/faculties/:id - Update faculty
app.put('/api/admin/faculties/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { name, abbreviation } = req.body;

    const facultyIndex = faculties.findIndex(f => f.id === id);
    if (facultyIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Faculty not found',
      });
    }

    const errors = [];
    if (name !== undefined && name.trim().length === 0) {
      errors.push('Faculty name cannot be empty');
    }
    if (abbreviation !== undefined) {
      if (abbreviation.trim().length === 0) {
        errors.push('Abbreviation cannot be empty');
      } else if (abbreviation.length < 2 || abbreviation.length > 4) {
        errors.push('Abbreviation must be 2-4 characters');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const faculty = faculties[facultyIndex];
    if (name !== undefined) faculty.name = name.trim();
    if (abbreviation !== undefined) faculty.abbreviation = abbreviation.trim().toUpperCase();

    res.json({
      success: true,
      data: faculty,
      message: 'Faculty updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update faculty error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/faculties/:id - Delete single faculty
app.delete('/api/admin/faculties/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const facultyIndex = faculties.findIndex(f => f.id === id);

    if (facultyIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Faculty not found',
      });
    }

    const deleted = faculties.splice(facultyIndex, 1);

    res.json({
      success: true,
      data: deleted[0],
      message: 'Faculty deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Delete faculty error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/faculties - Batch delete faculties
app.delete('/api/admin/faculties', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['ids must be a non-empty array'],
      });
    }

    const idsToDelete = new Set(ids);
    const beforeCount = faculties.length;
    const filtered = faculties.filter(f => !idsToDelete.has(f.id));
    const deletedCount = beforeCount - filtered.length;

    faculties.length = 0;
    faculties.push(...filtered);

    res.json({
      success: true,
      data: { deleted: deletedCount, message: `${deletedCount} faculty(ies) deleted successfully` },
      message: 'Faculties deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Batch delete faculties error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// MODULE ENDPOINTS
// ============================================================================

// POST /api/admin/modules - Create new module
app.post('/api/admin/modules', authMiddleware, (req, res) => {
  try {
    const { code, name, courseId, departmentId } = req.body;

    const errors = [];
    if (!code || code.trim().length === 0) {
      errors.push('Module code is required');
    }
    if (!name || name.trim().length === 0) {
      errors.push('Module name is required');
    }
    if (!courseId) {
      errors.push('Course ID is required');
    }
    if (!departmentId) {
      errors.push('Department ID is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const course = courses.find(c => c.id === courseId);
    const department = departments.find(d => d.id === departmentId);

    if (!course) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Invalid course ID'],
      });
    }

    if (!department) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Invalid department ID'],
      });
    }

    const newModule = {
      id: generateModuleId(),
      code: code.trim(),
      name: name.trim(),
      courseId,
      courseName: course.name,
      departmentId,
      departmentName: department.name,
      facultyId: department.facultyId,
      facultyName: department.facultyName,
    };

    modules.push(newModule);

    res.status(201).json({
      success: true,
      data: newModule,
      message: 'Module created successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Create module error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/modules - Get all modules with pagination and search
app.get('/api/admin/modules', authMiddleware, (req, res) => {
  try {
    const { search, page = 1, limit = 20, departmentId = '', courseId = '' } = req.query;

    let filteredModules = [...modules];

    // Filter by department
    if (departmentId) {
      filteredModules = filteredModules.filter(m => m.departmentId === departmentId);
    }

    // Filter by course
    if (courseId) {
      filteredModules = filteredModules.filter(m => m.courseId === courseId);
    }

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredModules = filteredModules.filter(m =>
        m.code.toLowerCase().includes(searchLower) ||
        m.name.toLowerCase().includes(searchLower) ||
        m.courseName.toLowerCase().includes(searchLower) ||
        m.departmentName.toLowerCase().includes(searchLower) ||
        m.facultyName.toLowerCase().includes(searchLower) ||
        m.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = filteredModules.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      total: filteredModules.length,
      page: pageNum,
      limit: limitNum,
      message: 'Modules retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get modules error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/modules/:id - Get single module
app.get('/api/admin/modules/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const module = modules.find(m => m.id === id);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Module not found',
      });
    }

    res.json({
      success: true,
      data: module,
      message: 'Module retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get module error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/modules/:id - Update module
app.put('/api/admin/modules/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, courseId, departmentId } = req.body;

    const moduleIndex = modules.findIndex(m => m.id === id);
    if (moduleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Module not found',
      });
    }

    const errors = [];
    if (code !== undefined && code.trim().length === 0) {
      errors.push('Module code cannot be empty');
    }
    if (name !== undefined && name.trim().length === 0) {
      errors.push('Module name cannot be empty');
    }
    if (courseId !== undefined && !courses.find(c => c.id === courseId)) {
      errors.push('Invalid course ID');
    }
    if (departmentId !== undefined && !departments.find(d => d.id === departmentId)) {
      errors.push('Invalid department ID');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const module = modules[moduleIndex];
    if (code !== undefined) module.code = code.trim();
    if (name !== undefined) module.name = name.trim();
    if (courseId !== undefined) {
      const course = courses.find(c => c.id === courseId);
      module.courseId = courseId;
      module.courseName = course.name;
    }
    if (departmentId !== undefined) {
      const department = departments.find(d => d.id === departmentId);
      module.departmentId = departmentId;
      module.departmentName = department.name;
      module.facultyId = department.facultyId;
      module.facultyName = department.facultyName;
    }

    res.json({
      success: true,
      data: module,
      message: 'Module updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update module error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/modules/:id - Delete single module
app.delete('/api/admin/modules/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const moduleIndex = modules.findIndex(m => m.id === id);

    if (moduleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Module not found',
      });
    }

    const deleted = modules.splice(moduleIndex, 1);

    res.json({
      success: true,
      data: deleted[0],
      message: 'Module deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Delete module error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/modules - Batch delete modules
app.delete('/api/admin/modules', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['ids must be a non-empty array'],
      });
    }

    const idsToDelete = new Set(ids);
    const beforeCount = modules.length;
    const filtered = modules.filter(m => !idsToDelete.has(m.id));
    const deletedCount = beforeCount - filtered.length;

    modules.length = 0;
    modules.push(...filtered);

    res.json({
      success: true,
      data: { deleted: deletedCount, message: `${deletedCount} module(s) deleted successfully` },
      message: 'Modules deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Batch delete modules error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// ROLE ENDPOINTS
// ============================================================================

// POST /api/admin/roles - Create new role
app.post('/api/admin/roles', authMiddleware, (req, res) => {
  try {
    const { role, level } = req.body;

    const errors = [];
    if (!role || role.trim().length === 0) {
      errors.push('Role name is required');
    }
    if (!level) {
      errors.push('Level is required');
    } else {
      const levelNum = parseInt(level);
      if (isNaN(levelNum) || levelNum < 1 || levelNum > 9) {
        errors.push('Level must be a number between 1 and 9');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const newRole = {
      id: generateRoleId(),
      role: role.trim(),
      level: level.toString(),
    };

    roles.push(newRole);

    res.status(201).json({
      success: true,
      data: newRole,
      message: 'Role created successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Create role error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/roles - Get all roles with pagination and search
app.get('/api/admin/roles', authMiddleware, (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    let filteredRoles = [...roles];

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRoles = filteredRoles.filter(r =>
        r.role.toLowerCase().includes(searchLower) ||
        r.level.toLowerCase().includes(searchLower) ||
        r.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = filteredRoles.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      total: filteredRoles.length,
      page: pageNum,
      limit: limitNum,
      message: 'Roles retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/roles/:id - Get single role
app.get('/api/admin/roles/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const role = roles.find(r => r.id === id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Role not found',
      });
    }

    res.json({
      success: true,
      data: role,
      message: 'Role retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get role error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/roles/:id - Update role
app.put('/api/admin/roles/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { role, level } = req.body;

    const roleIndex = roles.findIndex(r => r.id === id);
    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Role not found',
      });
    }

    const errors = [];
    if (role !== undefined && role.trim().length === 0) {
      errors.push('Role name cannot be empty');
    }
    if (level !== undefined) {
      const levelNum = parseInt(level);
      if (isNaN(levelNum) || levelNum < 1 || levelNum > 9) {
        errors.push('Level must be a number between 1 and 9');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const roleRecord = roles[roleIndex];
    if (role !== undefined) roleRecord.role = role.trim();
    if (level !== undefined) roleRecord.level = level.toString();

    res.json({
      success: true,
      data: roleRecord,
      message: 'Role updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/roles/:id - Delete single role
app.delete('/api/admin/roles/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const roleIndex = roles.findIndex(r => r.id === id);

    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Role not found',
      });
    }

    const deletedRole = roles.splice(roleIndex, 1)[0];

    res.json({
      success: true,
      data: { id: deletedRole.id, message: 'Role deleted successfully' },
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Delete role error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/roles - Batch delete roles
app.delete('/api/admin/roles', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['ids must be a non-empty array'],
      });
    }

    const idsToDelete = new Set(ids);
    const beforeCount = roles.length;
    const filtered = roles.filter(r => !idsToDelete.has(r.id));
    const deletedCount = beforeCount - filtered.length;

    roles.length = 0;
    roles.push(...filtered);

    res.json({
      success: true,
      data: { deleted: deletedCount, message: `${deletedCount} role(s) deleted successfully` },
      message: 'Roles deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Batch delete roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// EXTRACURRICULAR ENDPOINTS
// ============================================================================

// POST /api/admin/extracurriculars - Create new extracurricular activity
app.post('/api/admin/extracurriculars', authMiddleware, (req, res) => {
  try {
    const { activity, category, departmentId } = req.body;

    const errors = [];
    if (!activity || activity.trim().length === 0) {
      errors.push('Activity name is required');
    }
    if (!category) {
      errors.push('Category is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    // Resolve department name if departmentId is provided
    let departmentName = null;
    if (departmentId) {
      const dept = departments.find(d => d.id === departmentId);
      if (dept) {
        departmentName = dept.name;
      }
    }

    const newExtracurricular = {
      id: generateExtracurricularId(),
      activity: activity.trim(),
      category,
      departmentId: departmentId || null,
      departmentName: departmentName,
    };

    extracurriculars.push(newExtracurricular);

    res.status(201).json({
      success: true,
      data: newExtracurricular,
      message: 'Extracurricular activity created successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Create extracurricular error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/extracurriculars - Get all extracurricular activities with filtering and pagination
app.get('/api/admin/extracurriculars', authMiddleware, (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    let filteredActivities = [...extracurriculars];

    // Filter by category
    if (category) {
      filteredActivities = filteredActivities.filter(a => a.category === category);
    }

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredActivities = filteredActivities.filter(a =>
        a.activity.toLowerCase().includes(searchLower) ||
        a.category.toLowerCase().includes(searchLower) ||
        (a.departmentName && a.departmentName.toLowerCase().includes(searchLower)) ||
        a.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = filteredActivities.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      total: filteredActivities.length,
      page: pageNum,
      limit: limitNum,
      message: 'Extracurricular activities retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get extracurriculars error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/extracurriculars/:id - Get single extracurricular activity
app.get('/api/admin/extracurriculars/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const activity = extracurriculars.find(a => a.id === id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Extracurricular activity not found',
      });
    }

    res.json({
      success: true,
      data: activity,
      message: 'Extracurricular activity retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get extracurricular error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/extracurriculars/:id - Update extracurricular activity
app.put('/api/admin/extracurriculars/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { activity, category, departmentId } = req.body;

    const activityIndex = extracurriculars.findIndex(a => a.id === id);
    if (activityIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Extracurricular activity not found',
      });
    }

    const errors = [];
    if (activity !== undefined && activity.trim().length === 0) {
      errors.push('Activity name cannot be empty');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const activityObj = extracurriculars[activityIndex];
    if (activity !== undefined) activityObj.activity = activity.trim();
    if (category !== undefined) activityObj.category = category;
    
    // Handle department update
    if (departmentId !== undefined) {
      activityObj.departmentId = departmentId || null;
      if (departmentId) {
        const dept = departments.find(d => d.id === departmentId);
        activityObj.departmentName = dept ? dept.name : null;
      } else {
        activityObj.departmentName = null;
      }
    }

    res.json({
      success: true,
      data: activityObj,
      message: 'Extracurricular activity updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update extracurricular error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/extracurriculars/:id - Delete single extracurricular activity
app.delete('/api/admin/extracurriculars/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const activityIndex = extracurriculars.findIndex(a => a.id === id);

    if (activityIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Extracurricular activity not found',
      });
    }

    const deletedActivity = extracurriculars.splice(activityIndex, 1)[0];

    res.json({
      success: true,
      data: { id: deletedActivity.id, message: 'Extracurricular activity deleted successfully' },
      message: 'Extracurricular activity deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Delete extracurricular error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/extracurriculars - Batch delete extracurricular activities
app.delete('/api/admin/extracurriculars', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['ids must be a non-empty array'],
      });
    }

    const idsToDelete = new Set(ids);
    const beforeCount = extracurriculars.length;
    const filtered = extracurriculars.filter(a => !idsToDelete.has(a.id));
    const deletedCount = beforeCount - filtered.length;

    extracurriculars.length = 0;
    extracurriculars.push(...filtered);

    res.json({
      success: true,
      data: { deleted: deletedCount, message: `${deletedCount} extracurricular activity(ies) deleted successfully` },
      message: 'Extracurricular activities deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Batch delete extracurriculars error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// STAFF ENDPOINTS
// ============================================================================

// POST /api/admin/staff - Create new staff member
app.post('/api/admin/staff', authMiddleware, (req, res) => {
  try {
    const { staffId, title, initials, firstName, lastName, role, department, level, campus, campusId, image } = req.body;

    const errors = [];
    if (!staffId || staffId.trim().length === 0) {
      errors.push('Staff ID is required');
    }
    if (!title) {
      errors.push('Title is required');
    }
    if (!firstName || firstName.trim().length === 0) {
      errors.push('First name is required');
    }
    if (!lastName || lastName.trim().length === 0) {
      errors.push('Last name is required');
    }
    if (!role || role.trim().length === 0) {
      errors.push('Role is required');
    }
    if (!department || department.trim().length === 0) {
      errors.push('Department is required');
    }
    if (!level) {
      errors.push('Level is required');
    }
    if (!campus) {
      errors.push('Campus is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const newStaff = {
      id: generateStaffId(),
      staffId: staffId.trim(),
      title,
      initials: initials ? initials.trim() : '',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role.trim(),
      department: department.trim(),
      level,
      campus,
      campusId: campusId || '',
      image: image || '',
    };

    staff.push(newStaff);

    res.status(201).json({
      success: true,
      data: newStaff,
      message: 'Staff member created successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Create staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/staff - Get all staff with filtering and pagination
app.get('/api/admin/staff', authMiddleware, (req, res) => {
  try {
    const { campus, departmentId, search, page = 1, limit = 20 } = req.query;

    let filteredStaff = [...staff];

    // Filter by campus
    if (campus) {
      filteredStaff = filteredStaff.filter(s => s.campus === campus);
    }

    // Filter by department (optional)
    if (departmentId) {
      filteredStaff = filteredStaff.filter(s => s.department === departmentId);
    }

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStaff = filteredStaff.filter(s =>
        s.staffId.toLowerCase().includes(searchLower) ||
        s.firstName.toLowerCase().includes(searchLower) ||
        s.lastName.toLowerCase().includes(searchLower) ||
        s.role.toLowerCase().includes(searchLower) ||
        s.department.toLowerCase().includes(searchLower) ||
        s.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = filteredStaff.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      total: filteredStaff.length,
      page: pageNum,
      limit: limitNum,
      message: 'Staff retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/staff/:id - Get single staff member
app.get('/api/admin/staff/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const staffMember = staff.find(s => s.id === id);

    if (!staffMember) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Staff member not found',
      });
    }

    res.json({
      success: true,
      data: staffMember,
      message: 'Staff member retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/staff/:id - Update staff member
app.put('/api/admin/staff/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, title, initials, firstName, lastName, role, department, level, campus, campusId, image } = req.body;

    const staffIndex = staff.findIndex(s => s.id === id);
    if (staffIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Staff member not found',
      });
    }

    const errors = [];
    if (firstName !== undefined && firstName.trim().length === 0) {
      errors.push('First name cannot be empty');
    }
    if (lastName !== undefined && lastName.trim().length === 0) {
      errors.push('Last name cannot be empty');
    }
    if (role !== undefined && role.trim().length === 0) {
      errors.push('Role cannot be empty');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const staffMember = staff[staffIndex];
    if (staffId !== undefined) staffMember.staffId = staffId.trim();
    if (title !== undefined) staffMember.title = title;
    if (initials !== undefined) staffMember.initials = initials.trim();
    if (firstName !== undefined) staffMember.firstName = firstName.trim();
    if (lastName !== undefined) staffMember.lastName = lastName.trim();
    if (role !== undefined) staffMember.role = role.trim();
    if (department !== undefined) staffMember.department = department.trim();
    if (level !== undefined) staffMember.level = level;
    if (campus !== undefined) staffMember.campus = campus;
    if (campusId !== undefined) staffMember.campusId = campusId;
    if (image !== undefined) staffMember.image = image;

    res.json({
      success: true,
      data: staffMember,
      message: 'Staff member updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/staff/:id - Delete single staff member
app.delete('/api/admin/staff/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const staffIndex = staff.findIndex(s => s.id === id);

    if (staffIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Staff member not found',
      });
    }

    const deletedStaff = staff.splice(staffIndex, 1)[0];

    res.json({
      success: true,
      data: { id: deletedStaff.id, message: 'Staff member deleted successfully' },
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Delete staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/staff - Batch delete staff members
app.delete('/api/admin/staff', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['ids must be a non-empty array'],
      });
    }

    const idsToDelete = new Set(ids);
    const beforeCount = staff.length;
    const filtered = staff.filter(s => !idsToDelete.has(s.id));
    const deletedCount = beforeCount - filtered.length;

    staff.length = 0;
    staff.push(...filtered);

    res.json({
      success: true,
      data: { deleted: deletedCount, message: `${deletedCount} staff member(s) deleted successfully` },
      message: 'Staff members deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Batch delete staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// RESIDENCE ENDPOINTS
// ============================================================================

// POST /api/admin/residences - Create new residence
app.post('/api/admin/residences', authMiddleware, (req, res) => {
  try {
    const { residenceId, residence, address, residenceType, manager, campus } = req.body;

    const errors = [];
    if (!residenceId || residenceId.trim().length === 0) {
      errors.push('Residence ID is required');
    }
    if (!residence || residence.trim().length === 0) {
      errors.push('Residence name is required');
    }
    if (!address || address.trim().length === 0) {
      errors.push('Address is required');
    }
    if (!residenceType) {
      errors.push('Residence type is required');
    }
    if (!campus) {
      errors.push('Campus is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const newResidence = {
      id: generateResidenceId(),
      residenceId: residenceId.trim(),
      residence: residence.trim(),
      address: address.trim(),
      residenceType,
      manager: manager || '',
      campus,
    };

    residences.push(newResidence);

    res.status(201).json({
      success: true,
      data: newResidence,
      message: 'Residence created successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Create residence error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/residences - Get all residences with filtering and pagination
app.get('/api/admin/residences', authMiddleware, (req, res) => {
  try {
    const { campus, residenceType, search, page = 1, limit = 20 } = req.query;

    let filteredResidences = [...residences];

    // Filter by campus
    if (campus) {
      filteredResidences = filteredResidences.filter(r => r.campus === campus);
    }

    // Filter by residence type (optional)
    if (residenceType) {
      filteredResidences = filteredResidences.filter(r => r.residenceType === residenceType);
    }

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResidences = filteredResidences.filter(r =>
        r.residence.toLowerCase().includes(searchLower) ||
        r.address.toLowerCase().includes(searchLower) ||
        r.residenceId.toLowerCase().includes(searchLower) ||
        r.residenceType.toLowerCase().includes(searchLower) ||
        r.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = filteredResidences.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      total: filteredResidences.length,
      page: pageNum,
      limit: limitNum,
      message: 'Residences retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get residences error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/residences/:id - Get single residence
app.get('/api/admin/residences/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const residence = residences.find(r => r.id === id);

    if (!residence) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Residence not found',
      });
    }

    res.json({
      success: true,
      data: residence,
      message: 'Residence retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get residence error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/residences/:id - Update residence
app.put('/api/admin/residences/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { residenceId, residence, address, residenceType, manager, campus } = req.body;

    const residenceIndex = residences.findIndex(r => r.id === id);
    if (residenceIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Residence not found',
      });
    }

    const errors = [];
    if (residence !== undefined && residence.trim().length === 0) {
      errors.push('Residence name cannot be empty');
    }
    if (address !== undefined && address.trim().length === 0) {
      errors.push('Address cannot be empty');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const residenceObj = residences[residenceIndex];
    if (residenceId !== undefined) residenceObj.residenceId = residenceId.trim();
    if (residence !== undefined) residenceObj.residence = residence.trim();
    if (address !== undefined) residenceObj.address = address.trim();
    if (residenceType !== undefined) residenceObj.residenceType = residenceType;
    if (manager !== undefined) residenceObj.manager = manager;
    if (campus !== undefined) residenceObj.campus = campus;

    res.json({
      success: true,
      data: residenceObj,
      message: 'Residence updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update residence error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/residences/:id - Delete single residence
app.delete('/api/admin/residences/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const residenceIndex = residences.findIndex(r => r.id === id);

    if (residenceIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Residence not found',
      });
    }

    const deletedResidence = residences.splice(residenceIndex, 1)[0];

    res.json({
      success: true,
      data: { id: deletedResidence.id, message: 'Residence deleted successfully' },
      message: 'Residence deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Delete residence error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/residences - Batch delete residences
app.delete('/api/admin/residences', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['ids must be a non-empty array'],
      });
    }

    const idsToDelete = new Set(ids);
    const beforeCount = residences.length;
    const filtered = residences.filter(r => !idsToDelete.has(r.id));
    const deletedCount = beforeCount - filtered.length;

    residences.length = 0;
    residences.push(...filtered);

    res.json({
      success: true,
      data: { deleted: deletedCount, message: `${deletedCount} residence(s) deleted successfully` },
      message: 'Residences deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Batch delete residences error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

// GET /api/admin/dashboard/statistics - Get dashboard statistics
app.get('/api/admin/dashboard/statistics', authMiddleware, (req, res) => {
  try {
    res.json({
      success: true,
      data: mockStats,
      message: 'Dashboard statistics retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// COMPLAINTS ENDPOINTS
// ============================================================================

// GET /api/admin/complaints - Get all complaints with filters
app.get('/api/admin/complaints', authMiddleware, (req, res) => {
  try {
    const { status, priority, category, search, page = 1, limit = 20 } = req.query;

    let complaintsList = [...complaints];

    // Filter by status
    if (status && status !== 'all') {
      complaintsList = complaintsList.filter(c => c.status === status);
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      complaintsList = complaintsList.filter(c => c.priority === priority);
    }

    // Filter by category
    if (category && category !== 'all') {
      complaintsList = complaintsList.filter(c => c.category === category);
    }

    // Search by student name, email, or title
    if (search) {
      const searchLower = search.toLowerCase();
      complaintsList = complaintsList.filter(c =>
        c.studentName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.title.toLowerCase().includes(searchLower)
      );
    }

    // Sort by most recent
    complaintsList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Pagination
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedList = complaintsList.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedList,
      pagination: {
        total: complaintsList.length,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(complaintsList.length / pageSize),
      },
      message: 'Complaints retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get complaints error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/complaints/:complaintId - Get specific complaint
app.get('/api/admin/complaints/:complaintId', authMiddleware, (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = complaints.find(c => c.id === complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Complaint not found',
      });
    }

    res.json({
      success: true,
      data: complaint,
      message: 'Complaint retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/complaints/:complaintId - Update complaint
app.put('/api/admin/complaints/:complaintId', authMiddleware, (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, priority, resolution } = req.body;

    const complaint = complaints.find(c => c.id === complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Complaint not found',
      });
    }

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [`Status must be one of: ${validStatuses.join(', ')}`],
      });
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [`Priority must be one of: ${validPriorities.join(', ')}`],
      });
    }

    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (resolution) complaint.resolution = resolution;
    complaint.updatedAt = new Date();

    res.json({
      success: true,
      data: complaint,
      message: 'Complaint updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /api/admin/complaints - Create new complaint (admin can create on behalf of students)
app.post('/api/admin/complaints', authMiddleware, (req, res) => {
  try {
    const { studentId, studentName, email, title, description, category, priority } = req.body;

    const errors = [];
    if (!studentId) errors.push('Student ID is required');
    if (!studentName) errors.push('Student name is required');
    if (!email) errors.push('Email is required');
    if (!title) errors.push('Title is required');
    if (!description) errors.push('Description is required');
    if (!category) errors.push('Category is required');

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const newComplaint = {
      id: 'complaint-' + Date.now(),
      studentId: studentId,
      studentName: studentName,
      email: email,
      title: title,
      description: description,
      category: category,
      status: 'pending',
      priority: priority || 'normal',
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: [],
      resolution: null,
    };

    complaints.unshift(newComplaint);

    res.status(201).json({
      success: true,
      data: newComplaint,
      message: 'Complaint created successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Create complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/admin/complaints/:complaintId - Delete complaint
app.delete('/api/admin/complaints/:complaintId', authMiddleware, (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaintIndex = complaints.findIndex(c => c.id === complaintId);

    if (complaintIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Complaint not found',
      });
    }

    const deletedComplaint = complaints.splice(complaintIndex, 1)[0];

    res.json({
      success: true,
      data: {
        id: deletedComplaint.id,
        message: 'Complaint deleted successfully',
      },
    });
  } catch (error) {
    console.error('[ADMIN] Delete complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/admin/users - Get all users
app.get('/api/admin/users', authMiddleware, (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    let usersList = [...users];

    // Filter by role
    if (role && role !== 'all') {
      usersList = usersList.filter(u => u.role === role);
    }

    // Filter by status
    if (status && status !== 'all') {
      usersList = usersList.filter(u => u.status === status);
    }

    // Search by name or email
    if (search) {
      const searchLower = search.toLowerCase();
      usersList = usersList.filter(u =>
        u.firstName.toLowerCase().includes(searchLower) ||
        u.lastName.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedList = usersList.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedList,
      pagination: {
        total: usersList.length,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(usersList.length / pageSize),
      },
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/admin/users/:userId - Get specific user
app.get('/api/admin/users/:userId', authMiddleware, (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/users/:userId - Update user
app.put('/api/admin/users/:userId', authMiddleware, (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, role, status } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'User not found',
      });
    }

    const validRoles = ['student', 'admin', 'admin-resolve'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [`Role must be one of: ${validRoles.join(', ')}`],
      });
    }

    const validStatuses = ['active', 'inactive', 'suspended'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [`Status must be one of: ${validStatuses.join(', ')}`],
      });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// ADMIN PROFILE ENDPOINTS
// ============================================================================

// GET /api/admin/profile - Get admin profile
app.get('/api/admin/profile', authMiddleware, (req, res) => {
  try {
    res.json({
      success: true,
      data: adminProfile,
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/profile - Update admin profile
app.put('/api/admin/profile', authMiddleware, (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    const errors = [];
    if (email && !email.includes('@')) {
      errors.push('Email must be valid');
    }
    if (phone && !/^\d{10,}$/.test(phone)) {
      errors.push('Phone must be at least 10 digits');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    if (firstName) adminProfile.firstName = firstName;
    if (lastName) adminProfile.lastName = lastName;
    if (email) adminProfile.email = email;
    if (phone) adminProfile.phone = phone;

    res.json({
      success: true,
      data: adminProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// SYSTEM SETTINGS ENDPOINTS
// ============================================================================

// GET /api/admin/settings - Get system settings
app.get('/api/admin/settings', authMiddleware, (req, res) => {
  try {
    res.json({
      success: true,
      data: systemSettings,
      message: 'System settings retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/admin/settings - Update system settings
app.put('/api/admin/settings', authMiddleware, (req, res) => {
  try {
    const { autoEscalationDays, resolutionTimeLimit, emailNotifications, smsNotifications, maintenanceMode } = req.body;

    const errors = [];
    if (autoEscalationDays && (autoEscalationDays < 1 || autoEscalationDays > 30)) {
      errors.push('Auto escalation days must be between 1 and 30');
    }
    if (resolutionTimeLimit && (resolutionTimeLimit < 1 || resolutionTimeLimit > 60)) {
      errors.push('Resolution time limit must be between 1 and 60 days');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    if (autoEscalationDays) systemSettings.autoEscalationDays = autoEscalationDays;
    if (resolutionTimeLimit) systemSettings.resolutionTimeLimit = resolutionTimeLimit;
    if (emailNotifications !== undefined) systemSettings.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined) systemSettings.smsNotifications = smsNotifications;
    if (maintenanceMode !== undefined) systemSettings.maintenanceMode = maintenanceMode;

    res.json({
      success: true,
      data: systemSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// REPORTS ENDPOINTS
// ============================================================================

// GET /api/admin/reports/complaints - Get complaints report
app.get('/api/admin/reports/complaints', authMiddleware, (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const report = {
      period: {
        start: startDate || '2025-01-01',
        end: endDate || '2025-03-05',
      },
      summary: mockStats,
      topCategories: [
        { category: 'facilities', count: 45, percentage: 28.8 },
        { category: 'academic', count: 38, percentage: 24.4 },
        { category: 'accommodation', count: 32, percentage: 20.5 },
        { category: 'conduct', count: 21, percentage: 13.5 },
        { category: 'other', count: 20, percentage: 12.8 },
      ],
      resolutionTrend: [
        { week: '1-7 Mar', resolved: 8, pending: 6 },
        { week: '22-28 Feb', resolved: 12, pending: 9 },
        { week: '15-21 Feb', resolved: 10, pending: 7 },
        { week: '8-14 Feb', resolved: 9, pending: 8 },
      ],
    };

    res.json({
      success: true,
      data: report,
      message: 'Complaints report retrieved successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Campus Admin Backend',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Endpoint not found: ${req.method} ${req.path}`,
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Campus Admin Backend Server                          ║');
  console.log(`║  Server: http://localhost:${PORT}                         ║`);
  console.log('║  Status: ✅ READY                                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('Available endpoints:');
  console.log('');
  console.log('  CAMPUS MANAGEMENT:');
  console.log('  POST   /api/admin/campuses');
  console.log('  GET    /api/admin/campuses');
  console.log('  GET    /api/admin/campuses/:id');
  console.log('  PUT    /api/admin/campuses/:id');
  console.log('  DELETE /api/admin/campuses/:id');
  console.log('  DELETE /api/admin/campuses (batch)');
  console.log('');
  console.log('  DEPARTMENT MANAGEMENT:');
  console.log('  POST   /api/admin/departments');
  console.log('  GET    /api/admin/departments');
  console.log('  GET    /api/admin/departments/:id');
  console.log('  PUT    /api/admin/departments/:id');
  console.log('  DELETE /api/admin/departments/:id');
  console.log('  DELETE /api/admin/departments (batch)');
  console.log('');
  console.log('  FACULTY MANAGEMENT:');
  console.log('  POST   /api/admin/faculties');
  console.log('  GET    /api/admin/faculties');
  console.log('  GET    /api/admin/faculties/:id');
  console.log('  PUT    /api/admin/faculties/:id');
  console.log('  DELETE /api/admin/faculties/:id');
  console.log('  DELETE /api/admin/faculties (batch)');
  console.log('');
  console.log('  COURSE MANAGEMENT:');
  console.log('  POST   /api/admin/courses');
  console.log('  GET    /api/admin/courses');
  console.log('  GET    /api/admin/courses/:id');
  console.log('  PUT    /api/admin/courses/:id');
  console.log('  DELETE /api/admin/courses/:id');
  console.log('  DELETE /api/admin/courses (batch)');
  console.log('');
  console.log('  MODULE MANAGEMENT:');
  console.log('  POST   /api/admin/modules');
  console.log('  GET    /api/admin/modules');
  console.log('  GET    /api/admin/modules/:id');
  console.log('  PUT    /api/admin/modules/:id');
  console.log('  DELETE /api/admin/modules/:id');
  console.log('  DELETE /api/admin/modules (batch)');
  console.log('');
  console.log('  DASHBOARD & COMPLAINTS:');
  console.log('  GET    /api/admin/dashboard/statistics');
  console.log('  GET    /api/admin/complaints');
  console.log('  GET    /api/admin/complaints/:id');
  console.log('  POST   /api/admin/complaints');
  console.log('  PUT    /api/admin/complaints/:id');
  console.log('  DELETE /api/admin/complaints/:id');
  console.log('');
  console.log('  USERS & SETTINGS:');
  console.log('  GET    /api/admin/users');
  console.log('  GET    /api/admin/users/:id');
  console.log('  PUT    /api/admin/users/:id');
  console.log('  GET    /api/admin/profile');
  console.log('  PUT    /api/admin/profile');
  console.log('  GET    /api/admin/settings');
  console.log('  PUT    /api/admin/settings');
  console.log('  GET    /api/admin/reports/complaints');
  console.log('');
});

module.exports = app;
