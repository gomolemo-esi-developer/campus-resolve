/**
 * Admin Controllers
 * Handles all admin CRUD operations using Supabase backend
 */

const supabaseService = require('../services/supabaseService');
const { validators, ValidationError } = require('../validators/adminValidators');
const s3StorageService = require('../services/s3StorageService');

/**
 * Extract S3 object key from a full S3 URL.
 * If the URL is already a key (no http), returns as-is.
 */
function extractS3Key(url) {
  if (!url) return null;
  try {
    if (url.startsWith('http')) {
      const parsed = new URL(url);
      // Remove leading slash from pathname
      return parsed.pathname.replace(/^\//, '');
    }
    return url;
  } catch (e) {
    // If URL parsing fails, assume it's already a key
    return url;
  }
}

class AdminController {
  /**
   * Generic CRUD handler factory
   * Creates controllers for any admin resource with standard validation
   */
  static createResourceController(tableName, validator) {
    return {
      /**
       * GET /api/admin/{resource}
       * Get all records with pagination and filtering
       */
      async getAll(req, res) {
        try {
          const { page = 1, limit = 20, search, sort = 'created_at', order = 'desc' } = req.query;
          const pageNum = Math.max(1, parseInt(page));
          const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

          const result = await supabaseService.findAll(tableName, {
            page: pageNum,
            limit: limitNum,
            sortBy: sort,
            sortOrder: order,
          });

          // Client-side search if needed
          let data = result.data;
          if (search) {
            const searchLower = search.toLowerCase();
            data = data.filter((record) =>
              Object.values(record).some(
                (val) =>
                  val &&
                  String(val).toLowerCase().includes(searchLower)
              )
            );
          }

          return res.json({
            success: true,
            data,
            count: data.length,
            total: result.total,
            page: pageNum,
            limit: limitNum,
            message: `${tableName} retrieved successfully`,
          });
        } catch (error) {
          return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Internal server error',
            details: error.details,
          });
        }
      },

      /**
       * GET /api/admin/{resource}/:id
       * Get single record by ID
       */
      async getById(req, res) {
        try {
          const { id } = req.params;
          const data = await supabaseService.findById(tableName, id);

          return res.json({
            success: true,
            data,
            message: `${tableName} record retrieved successfully`,
          });
        } catch (error) {
          return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Internal server error',
          });
        }
      },

      /**
       * POST /api/admin/{resource}
       * Create new record
       */
      async create(req, res) {
        try {
          const userId = req.user?.id || 'system';
          const sanitized = validator.create(req.body);
          const data = await supabaseService.create(tableName, sanitized, userId);

          // Log audit
          await supabaseService.logAudit({
            user_id: userId,
            action: 'CREATE',
            table_name: tableName,
            record_id: data.id,
            changes: sanitized,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            created_at: new Date().toISOString(),
          });

          return res.status(201).json({
            success: true,
            data,
            message: `${tableName} record created successfully`,
          });
        } catch (error) {
          const statusCode = error.statusCode || 500;
          return res.status(statusCode).json({
            success: false,
            error: error.message || 'Internal server error',
            details: error.details,
          });
        }
      },

      /**
       * PUT /api/admin/{resource}/:id
       * Update existing record
       */
      async update(req, res) {
        try {
          const { id } = req.params;
          const userId = req.user?.id || 'system';

          // Get old record for audit trail
          const oldRecord = await supabaseService.findById(tableName, id);

          const sanitized = validator.update(req.body);
          const data = await supabaseService.update(tableName, id, sanitized, userId);

          // Log audit
          await supabaseService.logAudit({
            user_id: userId,
            action: 'UPDATE',
            table_name: tableName,
            record_id: id,
            changes: {
              before: oldRecord,
              after: sanitized,
            },
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            created_at: new Date().toISOString(),
          });

          return res.json({
            success: true,
            data,
            message: `${tableName} record updated successfully`,
          });
        } catch (error) {
          const statusCode = error.statusCode || 500;
          return res.status(statusCode).json({
            success: false,
            error: error.message || 'Internal server error',
            details: error.details,
          });
        }
      },

      /**
       * DELETE /api/admin/{resource}/:id
       * Delete single record
       */
      async delete(req, res) {
        try {
          const { id } = req.params;
          const userId = req.user?.id || 'system';

          // Get record for audit before deletion
          const record = await supabaseService.findById(tableName, id);

          await supabaseService.delete(tableName, id);

          // Log audit
          await supabaseService.logAudit({
            user_id: userId,
            action: 'DELETE',
            table_name: tableName,
            record_id: id,
            changes: record,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            created_at: new Date().toISOString(),
          });

          return res.json({
            success: true,
            data: { id },
            message: `${tableName} record deleted successfully`,
          });
        } catch (error) {
          const statusCode = error.statusCode || 500;
          return res.status(statusCode).json({
            success: false,
            error: error.message || 'Internal server error',
          });
        }
      },

      /**
       * DELETE /api/admin/{resource}
       * Batch delete multiple records
       */
      async deleteMany(req, res) {
        try {
          const { ids } = req.body;
          const userId = req.user?.id || 'system';

          if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
              success: false,
              error: 'Validation failed',
              details: ['ids must be a non-empty array'],
            });
          }

          const result = await supabaseService.deleteMany(tableName, ids);

          // Log audit for batch delete
          await supabaseService.logAudit({
            user_id: userId,
            action: 'BATCH_DELETE',
            table_name: tableName,
            changes: { deleted_count: result.deleted, ids },
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            created_at: new Date().toISOString(),
          });

          return res.json({
            success: true,
            data: { deleted: result.deleted },
            message: `${result.deleted} record(s) deleted successfully`,
          });
        } catch (error) {
          const statusCode = error.statusCode || 500;
          return res.status(statusCode).json({
            success: false,
            error: error.message || 'Internal server error',
          });
        }
      },
    };
  }
};
// Custom campus controller
const campusController = AdminController.createResourceController('campuses', validators.campus);
// Custom faculty controller
const facultyController = AdminController.createResourceController('faculties', validators.faculty);
// Custom department controller with faculty name lookup
const departmentController = {
  ...AdminController.createResourceController('departments', validators.department),
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, search, sort = 'created_at', order = 'desc' } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

      // Fetch all departments
      const { data: departments, error: deptsError } = await supabaseService.client
        .from('departments')
        .select('*')
        .order(sort, { ascending: order === 'asc' });

      if (deptsError) {
        throw supabaseService._handleError(deptsError);
      }

      // Fetch all faculties for lookup
      const { data: faculties, error: facsError } = await supabaseService.client
        .from('faculties')
        .select('id, name');

      if (facsError) {
        throw supabaseService._handleError(facsError);
      }

      // Create faculty lookup map
      const facMap = {};
      (faculties || []).forEach(f => { facMap[f.id] = f.name; });

      // Merge department data with faculty names
      let transformedData = (departments || []).map(dept => ({
        ...dept,
        faculty_name: facMap[dept.faculty_id] || 'Unknown',
      }));

      // Client-side search if needed
      if (search) {
        const searchLower = search.toLowerCase();
        transformedData = transformedData.filter((record) =>
          Object.values(record).some(
            (val) =>
              val &&
              String(val).toLowerCase().includes(searchLower)
          )
        );
      }

      // Apply pagination to filtered results
      const totalFilteredCount = transformedData.length;
      const startIdx = (pageNum - 1) * limitNum;
      const endIdx = startIdx + limitNum;
      const paginatedData = transformedData.slice(startIdx, endIdx);

      return res.json({
        success: true,
        data: paginatedData,
        count: paginatedData.length,
        total: totalFilteredCount,
        page: pageNum,
        limit: limitNum,
        message: 'Departments retrieved successfully',
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  }
};
// Custom course controller with qualification_type filtering and manual JOINs
const courseController = {
  ...AdminController.createResourceController('courses', validators.course),
  
  // Override create to auto-populate faculty_id from department
  async create(req, res) {
    try {
      const userId = req.user?.id || 'system';
      
      // Get the department to fetch its faculty_id
      const { data: department, error: deptError } = await supabaseService.client
        .from('departments')
        .select('faculty_id')
        .eq('id', req.body.department_id)
        .single();
      
      if (deptError || !department) {
        return res.status(400).json({
          success: false,
          error: 'Invalid department',
          details: ['Department not found'],
        });
      }
      
      // Check if department has a faculty assigned
      if (!department.faculty_id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid department',
          details: ['Department must be assigned to a faculty before creating courses. Please edit the department and select a faculty.'],
        });
      }
      
      // Merge the department's faculty_id into the request
      const courseData = {
        ...req.body,
        faculty_id: department.faculty_id,
      };
      
      const sanitized = validators.course.create(courseData);
      const data = await supabaseService.create('courses', sanitized, userId);
      
      // Log audit
      await supabaseService.logAudit({
        user_id: userId,
        action: 'CREATE',
        table_name: 'courses',
        record_id: data.id,
        changes: sanitized,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString(),
      });
      
      return res.status(201).json({
        success: true,
        data,
        message: 'Course record created successfully',
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },

  // Override update to auto-populate faculty_id from department if department changes
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'system';

      // Get old record for audit trail
      const oldRecord = await supabaseService.findById('courses', id);

      let courseData = { ...req.body };

      // If department is being updated, look up its faculty_id
      if (req.body.department_id) {
        const { data: department, error: deptError } = await supabaseService.client
          .from('departments')
          .select('faculty_id')
          .eq('id', req.body.department_id)
          .single();

        if (deptError || !department) {
          return res.status(400).json({
            success: false,
            error: 'Invalid department',
            details: ['Department not found'],
          });
        }

        // Check if department has a faculty assigned
        if (!department.faculty_id) {
          return res.status(400).json({
            success: false,
            error: 'Invalid department',
            details: ['Department must be assigned to a faculty before creating courses. Please edit the department and select a faculty.'],
          });
        }

        courseData.faculty_id = department.faculty_id;
      }

      const sanitized = validators.course.update(courseData);
      const data = await supabaseService.update('courses', id, sanitized, userId);

      // Log audit
      await supabaseService.logAudit({
        user_id: userId,
        action: 'UPDATE',
        table_name: 'courses',
        record_id: id,
        changes: {
          before: oldRecord,
          after: sanitized,
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString(),
      });

      return res.json({
        success: true,
        data,
        message: 'Course record updated successfully',
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },
};

const moduleController = {
  ...AdminController.createResourceController('modules', validators.module),
  // Override create to auto-populate faculty_id from department
  async create(req, res) {
    try {
      const userId = req.user?.id || 'system';
      
      // Get the department to fetch its faculty_id
      const { data: department, error: deptError } = await supabaseService.client
        .from('departments')
        .select('faculty_id')
        .eq('id', req.body.department_id)
        .single();
      
      if (deptError || !department) {
        return res.status(400).json({
          success: false,
          error: 'Invalid department',
          details: ['Department not found'],
        });
      }
      
      // Check if department has a faculty assigned
      if (!department.faculty_id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid department',
          details: ['Department must be assigned to a faculty before creating modules. Please edit the department and select a faculty.'],
        });
      }
      
      // Merge the department's faculty_id into the request
      const moduleData = {
        ...req.body,
        faculty_id: department.faculty_id,
      };
      
      const sanitized = validators.module.create(moduleData);
      console.log('[moduleController.create] Sanitized data before save:', sanitized);
      const data = await supabaseService.create('modules', sanitized, userId);
      
      // Log audit
      await supabaseService.logAudit({
        user_id: userId,
        action: 'CREATE',
        table_name: 'modules',
        record_id: data.id,
        changes: sanitized,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString(),
      });
      
      // Fetch lookup data to transform response
      const { data: course } = await supabaseService.client
        .from('courses')
        .select('name')
        .eq('id', data.course_id)
        .single();
      
      const { data: deptData } = await supabaseService.client
        .from('departments')
        .select('name')
        .eq('id', data.department_id)
        .single();
      
      const { data: faculty } = await supabaseService.client
        .from('faculties')
        .select('name')
        .eq('id', data.faculty_id)
        .single();
      
      // Return transformed data with lookup names
      const transformedData = {
        ...data,
        course_name: course?.name || 'Unknown',
        department_name: deptData?.name || 'Unknown',
        faculty_name: faculty?.name || 'Unknown',
      };
      
      return res.status(201).json({
        success: true,
        data: transformedData,
        message: 'Module record created successfully',
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },

  // Override update to auto-populate faculty_id from department if department changes
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'system';

      // Get old record for audit trail
      const oldRecord = await supabaseService.findById('modules', id);

      let moduleData = { ...req.body };

      // If department is being updated, look up its faculty_id
      if (req.body.department_id) {
        const { data: department, error: deptError } = await supabaseService.client
          .from('departments')
          .select('faculty_id')
          .eq('id', req.body.department_id)
          .single();

        if (deptError || !department) {
          return res.status(400).json({
            success: false,
            error: 'Invalid department',
            details: ['Department not found'],
          });
        }

        // Check if department has a faculty assigned
        if (!department.faculty_id) {
          return res.status(400).json({
            success: false,
            error: 'Invalid department',
            details: ['Department must be assigned to a faculty before updating modules. Please edit the department and select a faculty.'],
          });
        }

        moduleData.faculty_id = department.faculty_id;
      }

      const sanitized = validators.module.update(moduleData);
      const data = await supabaseService.update('modules', id, sanitized, userId);

      // Log audit
      await supabaseService.logAudit({
        user_id: userId,
        action: 'UPDATE',
        table_name: 'modules',
        record_id: id,
        changes: {
          before: oldRecord,
          after: sanitized,
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString(),
      });

      return res.json({
        success: true,
        data,
        message: 'Module record updated successfully',
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },

  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, search, sort = 'created_at', order = 'desc' } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

      // Fetch all modules
      const { data: modules, error: modulesError } = await supabaseService.client
        .from('modules')
        .select('*')
        .order(sort, { ascending: order === 'asc' });

      if (modulesError) {
        throw supabaseService._handleError(modulesError);
      }

      // Fetch all courses
      const { data: courses, error: coursesError } = await supabaseService.client
        .from('courses')
        .select('id, name');

      if (coursesError) {
        throw supabaseService._handleError(coursesError);
      }

      // Fetch all departments
      const { data: departments, error: deptsError } = await supabaseService.client
        .from('departments')
        .select('id, name');

      if (deptsError) {
        throw supabaseService._handleError(deptsError);
      }

      // Fetch all faculties
      const { data: faculties, error: facsError } = await supabaseService.client
        .from('faculties')
        .select('id, name');

      if (facsError) {
        throw supabaseService._handleError(facsError);
      }

      // Create lookup maps
      const courseMap = {};
      const deptMap = {};
      const facMap = {};
      (courses || []).forEach(c => { courseMap[c.id] = c.name; });
      (departments || []).forEach(d => { deptMap[d.id] = d.name; });
      (faculties || []).forEach(f => { facMap[f.id] = f.name; });

      // Merge module data with course, department, and faculty names
      let transformedData = (modules || []).map(module => {
        console.log(`[moduleController.getAll] Module ${module.code}: faculty_id=${module.faculty_id}`);
        return {
          ...module,
          course_name: courseMap[module.course_id] || 'Unknown',
          department_name: deptMap[module.department_id] || 'Unknown',
          faculty_name: facMap[module.faculty_id] || 'Unknown',
        };
      });

      // Client-side search if needed
      if (search) {
        const searchLower = search.toLowerCase();
        transformedData = transformedData.filter((record) =>
          Object.values(record).some(
            (val) =>
              val &&
              String(val).toLowerCase().includes(searchLower)
          )
        );
      }

      // Apply pagination to filtered results
      const totalFilteredCount = transformedData.length;
      const startIdx = (pageNum - 1) * limitNum;
      const endIdx = startIdx + limitNum;
      const paginatedData = transformedData.slice(startIdx, endIdx);

      return res.json({
        success: true,
        data: paginatedData,
        count: paginatedData.length,
        total: totalFilteredCount,
        page: pageNum,
        limit: limitNum,
        message: 'Modules retrieved successfully',
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  }
};
const roleController = AdminController.createResourceController('roles', validators.role);

// Custom staff controller with department name lookup
const staffController = {
  ...AdminController.createResourceController('staff', validators.staff),
  
  // Override create to return transformed data with department name
  async create(req, res) {
    try {
      const userId = req.user?.id || 'system';
      const sanitized = validators.staff.create(req.body);
      
      // Extract academic info from professional_entries if provided
      let facultyId = req.body.faculty_id || null;
      let departmentId = req.body.department_id || null;
      let courseId = req.body.course_id || null;
      let facultyName = req.body.faculty || null;
      let departmentName = req.body.department || null;
      let courseName = req.body.course || null;
      
      if (req.body.professional_entries) {
        try {
          const entriesData = typeof req.body.professional_entries === 'string' 
            ? JSON.parse(req.body.professional_entries) 
            : req.body.professional_entries;
          
          if (entriesData.length > 0) {
            const firstEntry = entriesData[0];
            if (!facultyId && firstEntry.faculty) facultyId = firstEntry.faculty;
            if (!departmentId && firstEntry.departmentId) departmentId = firstEntry.departmentId;
            if (!courseId && firstEntry.course) courseId = firstEntry.course;
          }
        } catch (e) {
          console.log('[staffController.create] Error parsing professional_entries:', e.message);
        }
      }
      
      // Look up names from IDs
      if (facultyId || departmentId || courseId) {
        try {
          if (facultyId && !facultyName) {
            const { data: facultyData } = await supabaseService.client
              .from('faculties')
              .select('name')
              .eq('id', facultyId)
              .single();
            if (facultyData) facultyName = facultyData.name;
          }
          
          if (departmentId && !departmentName) {
            const { data: deptData } = await supabaseService.client
              .from('departments')
              .select('name')
              .eq('id', departmentId)
              .single();
            if (deptData) departmentName = deptData.name;
          }
          
          if (courseId && !courseName) {
            const { data: courseData } = await supabaseService.client
              .from('courses')
              .select('name')
              .eq('id', courseId)
              .single();
            if (courseData) courseName = courseData.name;
          }
        } catch (e) {
          console.log('[staffController.create] Error looking up names:', e.message);
        }
      }
      
      // Add extracted values to sanitized data
      const finalData = {
        ...sanitized,
      };
      
      // Extract S3 key from image_url if present (strip presigned URL to just the object key)
      if (finalData.image_url) {
        finalData.image_url = extractS3Key(finalData.image_url);
      }
      
      // Add ID fields - wrapped in try/catch in case columns don't exist yet
      // NOTE: staff table only has department_id, faculty_id, course_id (UUID FK columns)
      // It does NOT have text columns for department, faculty, course
      try {
        if (facultyId || sanitized.faculty_id) {
          finalData.faculty_id = facultyId || sanitized.faculty_id;
        }
        if (departmentId || sanitized.department_id) {
          finalData.department_id = departmentId || sanitized.department_id;
        }
        if (courseId || sanitized.course_id) {
          finalData.course_id = courseId || sanitized.course_id;
        }
        // Remove: department, faculty, course are NOT columns in staff table
        // They are derived from the FK IDs via JOINs when reading
      } catch (fieldError) {
        console.log('[staffController.create] Field error (columns may not exist):', fieldError.message);
      }
      
      // Create the staff record
      let data;
      try {
        console.log('[staffController.create] Final data being sent to DB:', JSON.stringify(finalData, null, 2));
        data = await supabaseService.create('staff', finalData, userId);
      } catch (createError) {
        console.log('[staffController.create] Insert error:', createError.message);
        console.log('[staffController.create] Insert error details:', JSON.stringify(createError));
        throw createError;
      }
      
       // Log audit
       await supabaseService.logAudit({
         user_id: userId,
         action: 'CREATE',
         table_name: 'staff',
         record_id: data.id,
         changes: sanitized,
         ip_address: req.ip,
         user_agent: req.get('User-Agent'),
         created_at: new Date().toISOString(),
       });
       
       // Generate presigned URL for image if present
       let imageUrl = data.image_url || null;
       if (imageUrl) {
         try {
           imageUrl = await s3StorageService.generateDownloadUrl(imageUrl, 3600);
         } catch (err) {
           console.error('[staffController.create] Failed to generate presigned URL:', err);
           imageUrl = null;
         }
       }
       
       // Build complete response with all fields
       let transformedData = {
         id: data.id,
         staffId: data.staff_id,
         title: data.title,
         initials: data.initials,
         firstName: data.first_name,
         lastName: data.last_name,
         role: data.role,
         level: data.level,
         campus: data.campus,
         campusId: data.campus_id,
         email: data.email,
         phone: data.phone,
         image: imageUrl,
         departmentId: data.department_id,
         department: 'Unknown',
         idNumber: data.id_number,
         location: data.location,
         faculty: data.faculty,
         facultyCode: data.faculty_code,
         course: data.course,
         courseCode: data.course_code,
         modules: (() => {
           try {
             return typeof data.professional_modules === 'string' 
               ? JSON.parse(data.professional_modules) 
               : (data.professional_modules || []);
           } catch {
             return [];
           }
         })(),
         academicEntries: (() => {
           try {
             return typeof data.professional_entries === 'string' 
               ? JSON.parse(data.professional_entries) 
               : (data.professional_entries || []);
           } catch {
             return [];
           }
         })(),
         extracurricular: data.extracurricular,
         residence: data.residence,
       };
      
      if (data.department_id) {
        const { data: dept } = await supabaseService.client
          .from('departments')
          .select('name')
          .eq('id', data.department_id)
          .single();
        
        if (dept) {
          transformedData.department = dept.name;
        }
      }
      
      return res.status(201).json({
        success: true,
        data: transformedData,
        message: 'Staff record created successfully',
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },

  // Override update to return transformed data with department name
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'system';

      // Get old record for audit trail
      const oldRecord = await supabaseService.findById('staff', id);

      const sanitized = validators.staff.update(req.body);
      
      // Extract academic info from professional_entries if provided
      let facultyId = req.body.faculty_id || null;
      let departmentId = req.body.department_id || null;
      let courseId = req.body.course_id || null;
      let facultyName = req.body.faculty || null;
      let departmentName = req.body.department || null;
      let courseName = req.body.course || null;
      
      if (req.body.professional_entries) {
        try {
          const entriesData = typeof req.body.professional_entries === 'string' 
            ? JSON.parse(req.body.professional_entries) 
            : req.body.professional_entries;
          
          if (entriesData.length > 0) {
            const firstEntry = entriesData[0];
            if (!facultyId && firstEntry.faculty) facultyId = firstEntry.faculty;
            if (!departmentId && firstEntry.departmentId) departmentId = firstEntry.departmentId;
            if (!courseId && firstEntry.course) courseId = firstEntry.course;
          }
        } catch (e) {
          console.log('[staffController.update] Error parsing professional_entries:', e.message);
        }
      }
      
      // Build final update data with extracted values
      const finalData = {
        ...sanitized,
      };

      // Extract S3 key from image_url if present
      if (finalData.image_url) {
        finalData.image_url = extractS3Key(finalData.image_url);
      }

      // Convert campus name to UUID if needed
      if (finalData.campus_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalData.campus_id)) {
        // Looks like a name, not a UUID - try to look up the campus by name
        try {
          const { data: campusRecord } = await supabaseService.client
            .from('campuses')
            .select('id')
            .eq('campus', finalData.campus_id)
            .limit(1)
            .single();
          if (campusRecord) {
            finalData.campus_id = campusRecord.id;
            console.log('[staffController.update] Converted campus name to ID:', finalData.campus_id);
          } else {
            // Campus not found by name, remove campus_id to avoid error
            delete finalData.campus_id;
            console.log('[staffController.update] Campus name not found, removing campus_id from update');
          }
        } catch (e) {
          console.log('[staffController.update] Error looking up campus by name:', e.message);
          // Remove campus_id to prevent UUID error
          delete finalData.campus_id;
        }
      }

      if (facultyId) finalData.faculty_id = facultyId;
      if (departmentId) finalData.department_id = departmentId;
      if (courseId) finalData.course_id = courseId;
      // Remove: department, faculty, course are NOT columns in staff table
      // They are derived from FK IDs when reading
      
      // Look up names from IDs - but DON'T save them to staff table
      // These are only used for response transformation
      let lookupFaculty = finalData.faculty_id;
      let lookupDept = finalData.department_id;
      let lookupCourse = finalData.course_id;
      
      // Don't set these on finalData - they don't exist as columns
      // if (facultyName) finalData.faculty = facultyName;
      // if (departmentName) finalData.department = departmentName;
      // if (courseName) finalData.course = courseName;
      
      // Look up names for RESPONSE only - don't save to DB
      facultyName = null;
      departmentName = null;
      courseName = null;
      
      if (finalData.faculty_id || finalData.department_id || finalData.course_id) {
        try {
          if (finalData.faculty_id) {
            const { data: facultyData } = await supabaseService.client
              .from('faculties')
              .select('name')
              .eq('id', finalData.faculty_id)
              .single();
            if (facultyData) facultyName = facultyData.name;
          }
          
          if (finalData.department_id) {
            const { data: deptData } = await supabaseService.client
              .from('departments')
              .select('name')
              .eq('id', finalData.department_id)
              .single();
            if (deptData) departmentName = deptData.name;
          }
          
          if (finalData.course_id) {
            const { data: courseData } = await supabaseService.client
              .from('courses')
              .select('name')
              .eq('id', finalData.course_id)
              .single();
            if (courseData) courseName = courseData.name;
          }
        } catch (e) {
          console.log('[staffController.update] Error looking up names:', e.message);
        }
      }
      
       const data = await supabaseService.update('staff', id, finalData, userId);
       console.log('[staffController.update] Updated data:', JSON.stringify(data, null, 2));

       // Generate presigned URL for image if present
       let imageUrl = data.image_url || null;
       if (imageUrl) {
         try {
           imageUrl = await s3StorageService.generateDownloadUrl(imageUrl, 3600);
         } catch (err) {
           console.error('[staffController.update] Failed to generate presigned URL:', err);
           imageUrl = null;
         }
       }
       
       // Log audit
       await supabaseService.logAudit({
         user_id: userId,
         action: 'UPDATE',
         table_name: 'staff',
         record_id: id,
         changes: {
           before: oldRecord,
           after: sanitized,
         },
         ip_address: req.ip,
         user_agent: req.get('User-Agent'),
         created_at: new Date().toISOString(),
       });

       // Build complete response with all fields
       let transformedData = {
         id: data.id,
         staffId: data.staff_id,
         title: data.title,
         initials: data.initials,
         firstName: data.first_name,
         lastName: data.last_name,
         role: data.role,
         level: data.level,
         campus: data.campus,
         campusId: data.campus_id,
         email: data.email,
         phone: data.phone,
         image: imageUrl,
         departmentId: data.department_id,
         department: 'Unknown',
         idNumber: data.id_number,
         location: data.location,
         faculty: data.faculty,
         facultyCode: data.faculty_code,
         course: data.course,
         courseCode: data.course_code,
         modules: (() => {
           try {
             return typeof data.professional_modules === 'string' 
               ? JSON.parse(data.professional_modules) 
               : (data.professional_modules || []);
           } catch {
             return [];
           }
         })(),
         academicEntries: (() => {
           try {
             return typeof data.professional_entries === 'string' 
               ? JSON.parse(data.professional_entries) 
               : (data.professional_entries || []);
           } catch {
             return [];
           }
         })(),
         extracurricular: data.extracurricular,
         residence: data.residence,
       };
      
      if (data.department_id) {
        const { data: dept } = await supabaseService.client
          .from('departments')
          .select('name')
          .eq('id', data.department_id)
          .single();
        
        if (dept) {
          transformedData.department = dept.name;
        }
      }
      
      // Get faculty name for response
      if (data.faculty_id) {
        const { data: fac } = await supabaseService.client
          .from('faculties')
          .select('name')
          .eq('id', data.faculty_id)
          .single();
        if (fac) transformedData.faculty = fac.name;
      }
      
      // Get course name for response
      if (data.course_id) {
        const { data: crs } = await supabaseService.client
          .from('courses')
          .select('name')
          .eq('id', data.course_id)
          .single();
        if (crs) transformedData.course = crs.name;
      }

      return res.json({
        success: true,
        data: transformedData,
        message: 'Staff record updated successfully',
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },

  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, search, sort = 'created_at', order = 'desc', campus } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

      // Fetch all staff
      const { data: staff, error: staffError } = await supabaseService.client
        .from('staff')
        .select('*')
        .order(sort, { ascending: order === 'asc' });

      if (staffError) {
        throw supabaseService._handleError(staffError);
      }

      // Fetch all departments for lookup
      const { data: departments, error: deptsError } = await supabaseService.client
        .from('departments')
        .select('id, name');

      if (deptsError) {
        throw supabaseService._handleError(deptsError);
      }

      // Create lookup map
      const deptMap = {};
      (departments || []).forEach(d => { deptMap[d.id] = d.name; });

       // Merge staff data with department names and transform field names
       // Also generate presigned URLs for profile images
       let transformedData = await Promise.all((staff || []).map(async (member) => {
         const transformed = {
           id: member.id,
           staffId: member.staff_id,
           title: member.title,
           initials: member.initials,
           firstName: member.first_name,
           lastName: member.last_name,
           role: member.role,
           department: deptMap[member.department_id] || 'Unknown',
           departmentId: member.department_id,
           level: member.level,
           campus: member.campus,
           campusId: member.campus_id,
           email: member.email,
           phone: member.phone,
           image: member.image_url || null,
           idNumber: member.id_number,
           location: member.location,
           faculty: member.faculty,
           facultyCode: member.faculty_code,
           course: member.course,
           courseCode: member.course_code,
           modules: (() => {
             try {
               return typeof member.professional_modules === 'string'
                 ? JSON.parse(member.professional_modules)
                 : (member.professional_modules || []);
             } catch { return []; }
           })(),
           academicEntries: (() => {
             try {
               return typeof member.professional_entries === 'string'
                 ? JSON.parse(member.professional_entries)
                 : (member.professional_entries || []);
             } catch { return []; }
           })(),
           extracurricular: member.extracurricular,
           residence: member.residence,
         };

         // Generate presigned URL for image if present
         if (transformed.image) {
           try {
             transformed.image = await s3StorageService.generateDownloadUrl(transformed.image, 3600);
           } catch (err) {
             console.error('[staffController.getAll] Presign error for staff', transformed.id, err);
             transformed.image = null;
           }
         }

         console.log('[DEBUG adminController.getAll] Transformed staff for', member.first_name, member.last_name, ':', JSON.stringify(transformed, null, 2));
         return transformed;
       }));

      // Filter by campus if provided
      if (campus) {
        transformedData = transformedData.filter((member) => member.campus === campus);
      }

      // Client-side search if needed
      if (search) {
        const searchLower = search.toLowerCase();
        transformedData = transformedData.filter((record) =>
          Object.values(record).some(
            (val) =>
              val &&
              String(val).toLowerCase().includes(searchLower)
          )
        );
      }

      // Apply pagination to filtered results
      const totalFilteredCount = transformedData.length;
      const startIdx = (pageNum - 1) * limitNum;
      const endIdx = startIdx + limitNum;
      const paginatedData = transformedData.slice(startIdx, endIdx);

       return res.json({
         success: true,
         data: paginatedData,
         count: paginatedData.length,
         total: totalFilteredCount,
         page: pageNum,
         limit: limitNum,
         message: 'Staff retrieved successfully',
       });
     } catch (error) {
       return res.status(error.statusCode || 500).json({
         success: false,
         error: error.message || 'Internal server error',
         details: error.details,
       });
     }
   },

   // Get single staff member by ID with presigned image URL
   async getById(req, res) {
     try {
       const { id } = req.params;
       const { data, error } = await supabaseService.client
         .from('staff')
         .select('*')
         .eq('id', id)
         .single();

       if (error || !data) {
         return res.status(404).json({
           success: false,
           error: 'Staff not found',
         });
       }

       // Generate presigned URL for image if present
       let imageUrl = data.image_url || null;
       if (imageUrl) {
         try {
           imageUrl = await s3StorageService.generateDownloadUrl(imageUrl, 3600);
         } catch (err) {
           console.error('[staffController.getById] Presign error:', err);
           imageUrl = null;
         }
       }

       // Look up department name if available
       let departmentName = 'Unknown';
       if (data.department_id) {
         const { data: dept } = await supabaseService.client
           .from('departments')
           .select('name')
           .eq('id', data.department_id)
           .single();
         if (dept) departmentName = dept.name;
       }

       // Look up faculty name
       let facultyName = null;
       if (data.faculty_id) {
         const { data: fac } = await supabaseService.client
           .from('faculties')
           .select('name')
           .eq('id', data.faculty_id)
           .single();
         if (fac) facultyName = fac.name;
       }

       // Look up course name
       let courseName = null;
       if (data.course_id) {
         const { data: crs } = await supabaseService.client
           .from('courses')
           .select('name')
           .eq('id', data.course_id)
           .single();
         if (crs) courseName = crs.name;
       }

       const transformed = {
         id: data.id,
         staffId: data.staff_id,
         title: data.title,
         initials: data.initials,
         firstName: data.first_name,
         lastName: data.last_name,
         role: data.role,
         level: data.level,
         campus: data.campus,
         campusId: data.campus_id,
         email: data.email,
         phone: data.phone,
         image: imageUrl,
         departmentId: data.department_id,
         department: departmentName,
         idNumber: data.id_number,
         location: data.location,
         faculty: facultyName,
         facultyCode: data.faculty_code,
         course: courseName,
         courseCode: data.course_code,
         modules: (() => {
           try {
             return typeof data.professional_modules === 'string'
               ? JSON.parse(data.professional_modules)
               : (data.professional_modules || []);
           } catch { return []; }
         })(),
         academicEntries: (() => {
           try {
             return typeof data.professional_entries === 'string'
               ? JSON.parse(data.professional_entries)
               : (data.professional_entries || []);
           } catch { return []; }
         })(),
         extracurricular: data.extracurricular,
         residence: data.residence,
       };

       return res.json({
         success: true,
         data: transformed,
         message: 'Staff record retrieved successfully',
       });
     } catch (error) {
       return res.status(error.statusCode || 500).json({
         success: false,
         error: error.message || 'Internal server error',
         details: error.details,
       });
     }
   }
 };

// Custom residence controller with type transformation
const residenceController = {
  ...AdminController.createResourceController('residences', validators.residence),
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, search, sort = 'created_at', order = 'desc', campus } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

      // Fetch all residences
      const { data: residences, error: residencesError } = await supabaseService.client
        .from('residences')
        .select('*')
        .order(sort, { ascending: order === 'asc' });

      if (residencesError) {
        throw supabaseService._handleError(residencesError);
      }

      // Transform field names from snake_case to camelCase
      let transformedData = (residences || []).map(residence => ({
        id: residence.id,
        residenceId: residence.residence_id,
        residence: residence.residence,
        address: residence.address,
        residenceType: residence.residence_type,
        manager: residence.manager,
        campus: residence.campus,
        campusId: residence.campus_id,
        capacity: residence.capacity,
        currentOccupancy: residence.current_occupancy,
      }));

      // Filter by campus if provided
      if (campus) {
        transformedData = transformedData.filter((res) => res.campus === campus);
      }

      // Client-side search if needed
      if (search) {
        const searchLower = search.toLowerCase();
        transformedData = transformedData.filter((record) =>
          Object.values(record).some(
            (val) =>
              val &&
              String(val).toLowerCase().includes(searchLower)
          )
        );
      }

      // Apply pagination to filtered results
      const totalFilteredCount = transformedData.length;
      const startIdx = (pageNum - 1) * limitNum;
      const endIdx = startIdx + limitNum;
      const paginatedData = transformedData.slice(startIdx, endIdx);

      return res.json({
        success: true,
        data: paginatedData,
        count: paginatedData.length,
        total: totalFilteredCount,
        page: pageNum,
        limit: limitNum,
        message: 'Residences retrieved successfully',
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  }
};

// Custom extracurricular controller with department name lookup
const extracurricularController = {
  ...AdminController.createResourceController('extracurriculars', validators.extracurricular),
  
  // Override create to return department name
  async create(req, res) {
    try {
      const userId = req.user?.id || 'system';
      const sanitized = validators.extracurricular.create(req.body);
      const data = await supabaseService.create('extracurriculars', sanitized, userId);
      
      // Log audit
      await supabaseService.logAudit({
        user_id: userId,
        action: 'CREATE',
        table_name: 'extracurriculars',
        record_id: data.id,
        changes: sanitized,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString(),
      });
      
      // Fetch department name to transform response
      let transformedData = { ...data };
      if (data.department_id) {
        const { data: dept } = await supabaseService.client
          .from('departments')
          .select('name')
          .eq('id', data.department_id)
          .single();
        
        if (dept) {
          transformedData.department_name = dept.name;
        }
      }
      
      return res.status(201).json({
        success: true,
        data: transformedData,
        message: 'Extracurricular record created successfully',
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },

  // Override update to return department name
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'system';

      // Get old record for audit trail
      const oldRecord = await supabaseService.findById('extracurriculars', id);

      const sanitized = validators.extracurricular.update(req.body);
      const data = await supabaseService.update('extracurriculars', id, sanitized, userId);

      // Log audit
      await supabaseService.logAudit({
        user_id: userId,
        action: 'UPDATE',
        table_name: 'extracurriculars',
        record_id: id,
        changes: {
          before: oldRecord,
          after: sanitized,
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString(),
      });

      // Fetch department name to transform response
      let transformedData = { ...data };
      if (data.department_id) {
        const { data: dept } = await supabaseService.client
          .from('departments')
          .select('name')
          .eq('id', data.department_id)
          .single();
        
        if (dept) {
          transformedData.department_name = dept.name;
        }
      }

      return res.json({
        success: true,
        data: transformedData,
        message: 'Extracurricular record updated successfully',
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },

  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, search, sort = 'created_at', order = 'desc', category } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

      // Fetch all extracurriculars
      const { data: activities, error: activitiesError } = await supabaseService.client
        .from('extracurriculars')
        .select('*')
        .order(sort, { ascending: order === 'asc' });

      if (activitiesError) {
        throw supabaseService._handleError(activitiesError);
      }

      // Fetch all departments for lookup
      const { data: departments, error: deptsError } = await supabaseService.client
        .from('departments')
        .select('id, name');

      if (deptsError) {
        throw supabaseService._handleError(deptsError);
      }

      // Create lookup map
      const deptMap = {};
      (departments || []).forEach(d => { deptMap[d.id] = d.name; });

      // Merge extracurricular data with department names
      let transformedData = (activities || []).map(activity => ({
        ...activity,
        department_name: deptMap[activity.department_id] || null,
      }));

      // Filter by category if provided
      if (category) {
        transformedData = transformedData.filter((activity) => activity.category === category);
      }

      // Client-side search if needed
      if (search) {
        const searchLower = search.toLowerCase();
        transformedData = transformedData.filter((record) =>
          Object.values(record).some(
            (val) =>
              val &&
              String(val).toLowerCase().includes(searchLower)
          )
        );
      }

      // Apply pagination to filtered results
      const totalFilteredCount = transformedData.length;
      const startIdx = (pageNum - 1) * limitNum;
      const endIdx = startIdx + limitNum;
      const paginatedData = transformedData.slice(startIdx, endIdx);

      return res.json({
        success: true,
        data: paginatedData,
        count: paginatedData.length,
        total: totalFilteredCount,
        page: pageNum,
        limit: limitNum,
        message: 'Extracurriculars retrieved successfully',
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  }
};

// Student controller for managing student profiles
const studentController = {
  // Create a new student
  async create(req, res) {
    try {
      const userId = req.user?.id || 'system';
      
      // Validate required fields
      if (!req.body.student_id) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: ['student_id is required'],
        });
      }
      
      if (!req.body.first_name || !req.body.last_name) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: ['first_name and last_name are required'],
        });
      }
      
      if (!req.body.email) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: ['email is required'],
        });
      }
      
      // Extract academic info from academic_entries if provided
      let facultyId = req.body.faculty_id || null;
      let departmentId = req.body.department_id || null;
      let courseId = req.body.course_id || null;
      let facultyName = req.body.faculty || null;
      let departmentName = req.body.department || null;
      let courseName = req.body.course || null;
      
      // Parse academic_entries to extract IDs and names
      let academicEntriesData = [];
      if (req.body.academic_entries) {
        try {
          academicEntriesData = typeof req.body.academic_entries === 'string' 
            ? JSON.parse(req.body.academic_entries) 
            : req.body.academic_entries;
          
          if (academicEntriesData.length > 0) {
            const firstEntry = academicEntriesData[0];
            
            // Use IDs from academic_entries if not provided separately
            if (!facultyId && firstEntry.faculty) facultyId = firstEntry.faculty;
            if (!departmentId && firstEntry.departmentId) departmentId = firstEntry.departmentId;
            if (!courseId && firstEntry.course) courseId = firstEntry.course;
          }
        } catch (e) {
          console.log('[studentController.create] Error parsing academic_entries:', e.message);
        }
      }
      
      // Look up names from IDs if IDs are provided
      if (facultyId || departmentId || courseId) {
        try {
          // Fetch faculty name if we have facultyId but no name
          if (facultyId && !facultyName) {
            const { data: facultyData } = await supabaseService.client
              .from('faculties')
              .select('name')
              .eq('id', facultyId)
              .single();
            if (facultyData) facultyName = facultyData.name;
          }
          
          // Fetch department name if we have departmentId but no name
          if (departmentId && !departmentName) {
            const { data: deptData } = await supabaseService.client
              .from('departments')
              .select('name')
              .eq('id', departmentId)
              .single();
            if (deptData) departmentName = deptData.name;
          }
          
          // Fetch course name if we have courseId but no name
          if (courseId && !courseName) {
            const { data: courseData } = await supabaseService.client
              .from('courses')
              .select('name')
              .eq('id', courseId)
              .single();
            if (courseData) courseName = courseData.name;
          }
        } catch (e) {
          console.log('[studentController.create] Error looking up names:', e.message);
        }
      }
      
      const studentData = {
        student_id: req.body.student_id,
        cognito_sub: req.body.cognito_sub || null,
        title: req.body.title || null,
        initials: req.body.initials || null,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        id_number: req.body.id_number || null,
        email: req.body.email,
        phone: req.body.phone || null,
        campus_id: req.body.campus_id || null,
        campus: req.body.campus || null,
        faculty: facultyName,
        faculty_id: facultyId,
        faculty_code: req.body.faculty_code || null,
        department_id: departmentId,
        department: departmentName,
        department_code: req.body.department_code || null,
        course_id: courseId,
        course: courseName,
        course_code: req.body.course_code || null,
        residence: req.body.residence || null,
        extracurricular: req.body.extracurricular || null,
        modules: req.body.modules || [],
        academic_entries: academicEntriesData,
        user_type: 'student',
        image_url: req.body.image_url ? extractS3Key(req.body.image_url) : null,
      };
      
       const { data, error } = await supabaseService.client
         .from('students')
         .insert(studentData)
         .select()
         .single();
       
       if (error) {
         if (error.code === '23505') {
           return res.status(400).json({
             success: false,
             error: 'Duplicate student ID',
             details: ['A student with this student_id already exists'],
           });
         }
         throw supabaseService._handleError(error);
       }
       
       // Generate presigned URL for image if present
       let imageUrl = data.image_url || null;
       if (imageUrl) {
         try {
           imageUrl = await s3StorageService.generateDownloadUrl(imageUrl, 3600);
         } catch (err) {
           console.error('[studentController.create] Failed to generate presigned URL:', err);
           imageUrl = null;
         }
       }
       
       // Log audit
       await supabaseService.logAudit({
         user_id: userId,
         action: 'CREATE',
         table_name: 'students',
         record_id: data.id,
         changes: studentData,
         ip_address: req.ip,
         user_agent: req.get('User-Agent'),
         created_at: new Date().toISOString(),
       });
       
       return res.status(201).json({
         success: true,
         data: {
           id: data.id,
           studentId: data.student_id,
           title: data.title,
           initials: data.initials,
           firstName: data.first_name,
           lastName: data.last_name,
           idNumber: data.id_number,
           email: data.email,
           phone: data.phone,
           campus: data.campus,
           campusId: data.campus_id,
           faculty: data.faculty,
           facultyId: data.faculty_id,
           facultyCode: data.faculty_code,
           department: data.department,
           departmentId: data.department_id,
           departmentCode: data.department_code,
           course: data.course,
           courseId: data.course_id,
           courseCode: data.course_code,
           residence: data.residence,
           extracurricular: data.extracurricular,
           modules: typeof data.modules === 'string' 
             ? JSON.parse(data.modules) 
             : (data.modules || []),
           academicEntries: typeof data.academic_entries === 'string' 
             ? JSON.parse(data.academic_entries) 
             : (data.academic_entries || []),
           image: imageUrl,
         },
         message: 'Student record created successfully',
       });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },

  // Update a student
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'system';

      // Get old record for audit trail
      const { data: oldRecord, error: oldError } = await supabaseService.client
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      
      if (oldError || !oldRecord) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
        });
      }
      
      const updateData = {};
      if (req.body.student_id !== undefined) updateData.student_id = req.body.student_id;
      if (req.body.cognito_sub !== undefined) updateData.cognito_sub = req.body.cognito_sub;
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.initials !== undefined) updateData.initials = req.body.initials;
      if (req.body.first_name !== undefined) updateData.first_name = req.body.first_name;
      if (req.body.last_name !== undefined) updateData.last_name = req.body.last_name;
      if (req.body.id_number !== undefined) updateData.id_number = req.body.id_number;
      if (req.body.email !== undefined) updateData.email = req.body.email;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;
      if (req.body.campus_id !== undefined) updateData.campus_id = req.body.campus_id;
      if (req.body.campus !== undefined) updateData.campus = req.body.campus;
      if (req.body.faculty !== undefined) updateData.faculty = req.body.faculty;
      if (req.body.faculty_code !== undefined) updateData.faculty_code = req.body.faculty_code;
      if (req.body.department_id !== undefined) updateData.department_id = req.body.department_id;
      if (req.body.department !== undefined) updateData.department = req.body.department;
      if (req.body.department_code !== undefined) updateData.department_code = req.body.department_code;
      if (req.body.course !== undefined) updateData.course = req.body.course;
      if (req.body.course_code !== undefined) updateData.course_code = req.body.course_code;
      if (req.body.residence !== undefined) updateData.residence = req.body.residence;
      if (req.body.extracurricular !== undefined) updateData.extracurricular = req.body.extracurricular;
       if (req.body.modules !== undefined) updateData.modules = req.body.modules;
       if (req.body.academic_entries !== undefined) {
         // Parse and extract IDs and names from academic_entries
         let academicEntriesData = req.body.academic_entries;
         try {
           academicEntriesData = typeof req.body.academic_entries === 'string'
             ? JSON.parse(req.body.academic_entries)
             : req.body.academic_entries;
           
           if (academicEntriesData.length > 0) {
             const firstEntry = academicEntriesData[0];
             
             // Update ID fields from academic_entries
             if (firstEntry.faculty) updateData.faculty_id = firstEntry.faculty;
             if (firstEntry.departmentId) updateData.department_id = firstEntry.departmentId;
             if (firstEntry.course) updateData.course_id = firstEntry.course;
           }
         } catch (e) {
           console.log('[studentController.update] Error parsing academic_entries:', e.message);
         }
         
         updateData.academic_entries = academicEntriesData;
       }
       
       // Handle image_url
       if (req.body.image_url !== undefined) {
         updateData.image_url = req.body.image_url ? extractS3Key(req.body.image_url) : null;
       }
      
      // Look up names from IDs after setting updateData
      if (updateData.faculty_id || updateData.department_id || updateData.course_id) {
        try {
          if (updateData.faculty_id && !updateData.faculty) {
            const { data: facultyData } = await supabaseService.client
              .from('faculties')
              .select('name')
              .eq('id', updateData.faculty_id)
              .single();
            if (facultyData) updateData.faculty = facultyData.name;
          }
          
          if (updateData.department_id && !updateData.department) {
            const { data: deptData } = await supabaseService.client
              .from('departments')
              .select('name')
              .eq('id', updateData.department_id)
              .single();
            if (deptData) updateData.department = deptData.name;
          }
          
          if (updateData.course_id && !updateData.course) {
            const { data: courseData } = await supabaseService.client
              .from('courses')
              .select('name')
              .eq('id', updateData.course_id)
              .single();
            if (courseData) updateData.course = courseData.name;
          }
        } catch (e) {
          console.log('[studentController.update] Error looking up names:', e.message);
        }
      }
      
        updateData.updated_at = new Date().toISOString();

        // Convert campus name to UUID if needed
        if (updateData.campus_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updateData.campus_id)) {
          try {
            const { data: campusRecord } = await supabaseService.client
              .from('campuses')
              .select('id')
              .eq('campus', updateData.campus_id)
              .limit(1)
              .single();
            if (campusRecord) {
              updateData.campus_id = campusRecord.id;
              console.log('[studentController.update] Converted campus name to ID:', updateData.campus_id);
            } else {
              delete updateData.campus_id;
            }
          } catch (e) {
            console.log('[studentController.update] Campus lookup error:', e.message);
            delete updateData.campus_id;
          }
        }

         const { data, error } = await supabaseService.client
         .from('students')
         .update(updateData)
         .eq('id', id)
         .select()
         .single();
       
       if (error) {
         if (error.code === '23505') {
           return res.status(400).json({
             success: false,
             error: 'Duplicate student ID',
             details: ['A student with this student_id already exists'],
           });
         }
         throw supabaseService._handleError(error);
       }
       
       // Generate presigned URL for image if present
       let imageUrl = data.image_url || null;
       if (imageUrl) {
         try {
           imageUrl = await s3StorageService.generateDownloadUrl(imageUrl, 3600);
         } catch (err) {
           console.error('[studentController.update] Failed to generate presigned URL:', err);
           imageUrl = null;
         }
       }
       
       // Log audit
       await supabaseService.logAudit({
         user_id: userId,
         action: 'UPDATE',
         table_name: 'students',
         record_id: id,
         changes: {
           before: oldRecord,
           after: data,
         },
         ip_address: req.ip,
         user_agent: req.get('User-Agent'),
         created_at: new Date().toISOString(),
       });
       
       return res.json({
         success: true,
         data: {
           id: data.id,
           studentId: data.student_id,
           title: data.title,
           initials: data.initials,
           firstName: data.first_name,
           lastName: data.last_name,
           idNumber: data.id_number,
           email: data.email,
           phone: data.phone,
           campus: data.campus,
           campusId: data.campus_id,
           faculty: data.faculty,
           facultyId: data.faculty_id,
           facultyCode: data.faculty_code,
           department: data.department,
           departmentId: data.department_id,
           departmentCode: data.department_code,
           course: data.course,
           courseId: data.course_id,
           courseCode: data.course_code,
           residence: data.residence,
           extracurricular: data.extracurricular,
           modules: typeof data.modules === 'string' 
             ? JSON.parse(data.modules) 
             : (data.modules || []),
           academicEntries: typeof data.academic_entries === 'string' 
             ? JSON.parse(data.academic_entries) 
             : (data.academic_entries || []),
          image: imageUrl,
        },
        message: 'Student record updated successfully',
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },

  // Get all students
  async getAll(req, res) {
    try {
      console.log('[studentController.getAll] Request received');
      console.log('[studentController.getAll] Query params:', req.query);
      
      // Fix: Handle empty string from query params
      const pageParam = req.query.page;
      const limitParam = req.query.limit;
      
      const pageNum = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
      const limitNum = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10))) : 20;
      
      console.log('[studentController.getAll] Parsed pagination:', { pageNum, limitNum });
      
      const { search, sort = 'created_at', order = 'desc', campus } = req.query;

      console.log('[studentController.getAll] Fetching from students table...');

      // Fetch all students
      const { data: students, error: studentsError } = await supabaseService.client
        .from('students')
        .select('*')
        .order(sort, { ascending: order === 'asc' });

      console.log('[studentController.getAll] Supabase response:', { dataCount: students?.length, error: studentsError });

      if (studentsError) {
        console.error('[studentController.getAll] Supabase error:', studentsError);
        throw supabaseService._handleError(studentsError);
      }

        // Transform field names from snake_case to camelCase
        // Also generate presigned URLs for profile images
        let transformedData = await Promise.all((students || []).map(async (student) => {
          console.log('[DEBUG] Student record:', student.student_id, 'image_url:', student.image_url);
          const item = {
            id: student.id,
            studentId: student.student_id,
            cognitoSub: student.cognito_sub,
            title: student.title,
            initials: student.initials,
            firstName: student.first_name,
            lastName: student.last_name,
            idNumber: student.id_number,
            email: student.email,
            phone: student.phone,
            campus: student.campus,
            campusId: student.campus_id,
            faculty: student.faculty,
            facultyCode: student.faculty_code,
            department: student.department,
            departmentId: student.department_id,
            departmentCode: student.department_code,
            course: student.course,
            courseCode: student.course_code,
            residence: student.residence,
            extracurricular: student.extracurricular,
            modules: typeof student.modules === 'string'
              ? JSON.parse(student.modules)
              : (student.modules || []),
            academicEntries: typeof student.academic_entries === 'string'
              ? JSON.parse(student.academic_entries)
              : (student.academic_entries || []),
            image: student.image_url || null,
          };

          // Generate a presigned GET URL for the profile image if present
          if (item.image) {
            try {
              console.log('[DEBUG] Generating presigned URL for student', item.studentId, 'key:', item.image);
              const presigned = await s3StorageService.generateDownloadUrl(item.image, 3600);
              item.image = presigned;
            } catch (err) {
              console.error('[studentController] Failed to generate presigned URL for student', item.studentId, err);
              // Keep key as fallback (will not display if bucket private)
              item.image = null;
            }
          } else {
            console.log('[DEBUG] No image for student', item.studentId);
          }

          return item;
        }));

      console.log('[studentController.getAll] Transformed data count:', transformedData.length);
      console.log('[studentController.getAll] Transformed data sample:', transformedData[0]);
      console.log('[studentController.getAll] Campus filter:', campus);

      // Filter by campus if provided
      if (campus) {
        console.log('[studentController.getAll] Applying campus filter:', campus);
        transformedData = transformedData.filter((student) => student.campus === campus);
        console.log('[studentController.getAll] After campus filter:', transformedData.length);
      } else {
        console.log('[studentController.getAll] No campus filter, total:', transformedData.length);
      }

      // Client-side search if needed
      if (search) {
        const searchLower = search.toLowerCase();
        transformedData = transformedData.filter((record) =>
          Object.values(record).some(
            (val) =>
              val &&
              String(val).toLowerCase().includes(searchLower)
          )
        );
      }

      // Apply pagination to filtered results
      const totalFilteredCount = transformedData.length;
      const startIdx = (pageNum - 1) * limitNum;
      const endIdx = startIdx + limitNum;
      const paginatedData = transformedData.slice(startIdx, endIdx);

      console.log('[studentController.getAll] Pagination:', { totalFilteredCount, pageNum, limitNum, startIdx, endIdx, paginatedDataLength: paginatedData.length });

      const response = {
        success: true,
        data: paginatedData,
        count: paginatedData.length,
        total: totalFilteredCount,
        page: pageNum,
        limit: limitNum,
        message: 'Students retrieved successfully',
      };
      
      console.log('[studentController.getAll] Final response data length:', response.data.length);
      
      return res.json(response);
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
        details: error.details,
      });
    }
  },

  // Get student by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      
       const { data, error } = await supabaseService.client
         .from('students')
         .select('*')
         .eq('id', id)
         .single();
       
       if (error || !data) {
         return res.status(404).json({
           success: false,
           error: 'Student not found',
         });
       }
       
       // Build response with presigned image URL if available
       let imageUrl = data.image_url || null;
       if (imageUrl) {
         try {
           imageUrl = await s3StorageService.generateDownloadUrl(imageUrl, 3600);
         } catch (err) {
           console.error('[studentController] Failed to generate presigned URL for student', id, err);
           imageUrl = null;
         }
       }

       return res.json({
         success: true,
         data: {
           id: data.id,
           studentId: data.student_id,
           cognitoSub: data.cognito_sub,
           title: data.title,
           initials: data.initials,
           firstName: data.first_name,
           lastName: data.last_name,
           idNumber: data.id_number,
           email: data.email,
           phone: data.phone,
           campus: data.campus,
           campusId: data.campus_id,
           faculty: data.faculty,
           facultyCode: data.faculty_code,
           department: data.department,
           departmentId: data.department_id,
           departmentCode: data.department_code,
           course: data.course,
           courseCode: data.course_code,
           residence: data.residence,
           extracurricular: data.extracurricular,
           modules: typeof data.modules === 'string' 
             ? JSON.parse(data.modules) 
             : (data.modules || []),
           academicEntries: typeof data.academic_entries === 'string' 
             ? JSON.parse(data.academic_entries) 
             : (data.academic_entries || []),
           image: imageUrl,
         },
         message: 'Student record retrieved successfully',
       });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  },

  // Delete a student
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'system';

      // Get record for audit before deletion
      const { data: record, error: recordError } = await supabaseService.client
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      
      if (recordError || !record) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
        });
      }

      const { error } = await supabaseService.client
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw supabaseService._handleError(error);
      }

      // Log audit
      await supabaseService.logAudit({
        user_id: userId,
        action: 'DELETE',
        table_name: 'students',
        record_id: id,
        changes: record,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString(),
      });

      return res.json({
        success: true,
        data: { id },
        message: 'Student record deleted successfully',
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  },

  // Batch delete students
  async deleteMany(req, res) {
    try {
      const { ids } = req.body;
      const userId = req.user?.id || 'system';

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: ['ids must be a non-empty array'],
        });
      }

      const { error } = await supabaseService.client
        .from('students')
        .delete()
        .in('id', ids);
      
      if (error) {
        throw supabaseService._handleError(error);
      }

      // Log audit for batch delete
      await supabaseService.logAudit({
        user_id: userId,
        action: 'BATCH_DELETE',
        table_name: 'students',
        changes: { deleted_count: ids.length, ids },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString(),
      });

      return res.json({
        success: true,
        data: { deleted: ids.length },
        message: `${ids.length} student(s) deleted successfully`,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  },
};

module.exports = {
  AdminController,
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
};
