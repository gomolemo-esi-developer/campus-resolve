/**
 * Admin Validators
 * Input validation rules for all 9 admin resources
 */

class ValidationError extends Error {
  constructor(details) {
    super('Validation failed');
    this.statusCode = 400;
    this.details = details;
  }
}

/**
 * Mapping of department/faculty codes to their UUIDs
 * These map the frontend string codes to actual database UUIDs
 */
const DEPARTMENT_CODE_TO_UUID = {
  'DEPT001': 'bbbbbbbb-1111-1111-1111-111111111111', // Civil Engineering
  'DEPT002': 'bbbbbbbb-2222-2222-2222-222222222222', // Mechanical Engineering
  'DEPT003': 'bbbbbbbb-3333-3333-3333-333333333333', // Accounting
  'DEPT004': 'bbbbbbbb-4444-4444-4444-444444444444', // Management
  'DEPT005': 'bbbbbbbb-5555-5555-5555-555555555555', // Nursing
  'DEPT006': 'bbbbbbbb-6666-6666-6666-666666666666', // Physics
};

const FACULTY_CODE_TO_UUID = {
  'FAC001': 'aaaaaaaa-1111-1111-1111-111111111111', // Faculty of Engineering
  'FAC002': 'aaaaaaaa-2222-2222-2222-222222222222', // Faculty of Business and Management
  'FAC003': 'aaaaaaaa-3333-3333-3333-333333333333', // Faculty of Health Sciences
  'FAC004': 'aaaaaaaa-4444-4444-4444-444444444444', // Faculty of Science
  'FAC005': 'aaaaaaaa-5555-5555-5555-555555555555', // Faculty of Humanities
};

const validators = {
  /**
   * Campus validation
   */
  campus: {
    create(data) {
      const errors = [];

      if (!data.name || data.name.trim().length === 0) {
        errors.push('Campus name is required');
      } else if (data.name.trim().length > 255) {
        errors.push('Campus name must not exceed 255 characters');
      }

      if (!data.abbreviation || data.abbreviation.trim().length === 0) {
        errors.push('Campus abbreviation is required');
      } else if (data.abbreviation.trim().length > 10) {
        errors.push('Campus abbreviation must not exceed 10 characters');
      }

      if (data.location && data.location.trim().length > 500) {
        errors.push('Campus location must not exceed 500 characters');
      }

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      return {
        name: data.name.trim(),
        abbreviation: data.abbreviation.trim().toUpperCase(),
        location: data.location.trim(),
      };
    },

    update(data) {
      const sanitized = {};

      if (data.name !== undefined) {
        if (data.name.trim().length === 0) {
          throw new ValidationError(['Campus name cannot be empty']);
        }
        sanitized.name = data.name.trim();
      }

      if (data.abbreviation !== undefined) {
        if (data.abbreviation.trim().length === 0) {
          throw new ValidationError(['Campus abbreviation cannot be empty']);
        }
        sanitized.abbreviation = data.abbreviation.trim().toUpperCase();
      }

      if (data.location !== undefined) {
        if (data.location && data.location.trim().length > 500) {
          throw new ValidationError(['Campus location must not exceed 500 characters']);
        }
        sanitized.location = data.location ? data.location.trim() : null;
      }

      return sanitized;
    },
  },

  /**
   * Faculty validation
   */
  faculty: {
    create(data) {
      const errors = [];

      if (!data.name || data.name.trim().length === 0) {
        errors.push('Faculty name is required');
      } else if (data.name.trim().length > 255) {
        errors.push('Faculty name must not exceed 255 characters');
      }

      if (!data.abbreviation || data.abbreviation.trim().length === 0) {
        errors.push('Faculty abbreviation is required');
      } else if (data.abbreviation.trim().length > 10) {
        errors.push('Faculty abbreviation must not exceed 10 characters');
      }

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      return {
        name: data.name.trim(),
        abbreviation: data.abbreviation.trim().toUpperCase(),
      };
    },

    update(data) {
      const sanitized = {};

      if (data.name !== undefined) {
        if (data.name.trim().length === 0) {
          throw new ValidationError(['Faculty name cannot be empty']);
        }
        sanitized.name = data.name.trim();
      }

      if (data.abbreviation !== undefined) {
        if (data.abbreviation.trim().length === 0) {
          throw new ValidationError(['Faculty abbreviation cannot be empty']);
        }
        sanitized.abbreviation = data.abbreviation.trim().toUpperCase();
      }

      return sanitized;
    },
  },

  /**
   * Department validation
   */
  department: {
    create(data) {
      const errors = [];

      if (!data.name || data.name.trim().length === 0) {
        errors.push('Department name is required');
      } else if (data.name.trim().length > 255) {
        errors.push('Department name must not exceed 255 characters');
      }

      if (!data.abbreviation || data.abbreviation.trim().length === 0) {
        errors.push('Department abbreviation is required');
      } else if (data.abbreviation.trim().length > 10) {
        errors.push('Department abbreviation must not exceed 10 characters');
      }

      if (data.faculty_id && typeof data.faculty_id !== 'string') {
        errors.push('Invalid faculty ID format');
      }

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      return {
        name: data.name.trim(),
        abbreviation: data.abbreviation.trim().toUpperCase(),
        faculty_id: data.faculty_id || null,
      };
    },

    update(data) {
      const sanitized = {};

      if (data.name !== undefined) {
        if (data.name.trim().length === 0) {
          throw new ValidationError(['Department name cannot be empty']);
        }
        sanitized.name = data.name.trim();
      }

      if (data.abbreviation !== undefined) {
        if (data.abbreviation.trim().length === 0) {
          throw new ValidationError(['Department abbreviation cannot be empty']);
        }
        sanitized.abbreviation = data.abbreviation.trim().toUpperCase();
      }

      if (data.faculty_id !== undefined) {
        sanitized.faculty_id = data.faculty_id || null;
      }

      return sanitized;
    },
  },

  /**
   * Course validation
   */
  course: {
    create(data) {
      const errors = [];

      if (!data.code || data.code.trim().length === 0) {
        errors.push('Course code is required');
      } else if (data.code.trim().length > 20) {
        errors.push('Course code must not exceed 20 characters');
      }

      if (!data.name || data.name.trim().length === 0) {
        errors.push('Course name is required');
      } else if (data.name.trim().length > 255) {
        errors.push('Course name must not exceed 255 characters');
      }

      if (!data.department_id) {
        errors.push('Department is required');
      } else if (typeof data.department_id !== 'string') {
        errors.push('Invalid department ID format');
      }

      if (!data.faculty_id) {
        errors.push('Faculty is required');
      } else if (typeof data.faculty_id !== 'string') {
        errors.push('Invalid faculty ID format');
      }

      if (data.qualification_type && data.qualification_type.trim().length > 50) {
        errors.push('Qualification type must not exceed 50 characters');
      }

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      // Convert department and faculty codes to UUIDs if needed
      let department_id = data.department_id;
      let faculty_id = data.faculty_id;

      // If the value is a code (like DEPT001), convert it to UUID
      if (DEPARTMENT_CODE_TO_UUID[data.department_id]) {
        department_id = DEPARTMENT_CODE_TO_UUID[data.department_id];
      }

      // If the value is a code (like FAC001), convert it to UUID
      if (FACULTY_CODE_TO_UUID[data.faculty_id]) {
        faculty_id = FACULTY_CODE_TO_UUID[data.faculty_id];
      }

      return {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        department_id: department_id,
        faculty_id: faculty_id,
        qualification_type: data.qualification_type?.trim() || null,
      };
    },

    update(data) {
      const sanitized = {};

      if (data.code !== undefined) {
        if (data.code.trim().length === 0) {
          throw new ValidationError(['Course code cannot be empty']);
        }
        sanitized.code = data.code.trim().toUpperCase();
      }

      if (data.name !== undefined) {
        if (data.name.trim().length === 0) {
          throw new ValidationError(['Course name cannot be empty']);
        }
        sanitized.name = data.name.trim();
      }

      if (data.department_id !== undefined) {
        // Convert department code to UUID if needed
        sanitized.department_id = DEPARTMENT_CODE_TO_UUID[data.department_id] || data.department_id;
      }

      if (data.faculty_id !== undefined) {
        // Convert faculty code to UUID if needed
        sanitized.faculty_id = FACULTY_CODE_TO_UUID[data.faculty_id] || data.faculty_id;
      }

      if (data.qualification_type !== undefined) {
        sanitized.qualification_type = data.qualification_type?.trim() || null;
      }

      return sanitized;
    },
  },

  /**
    * Module validation
    */
  module: {
    create(data) {
      const errors = [];

      if (!data.code || data.code.trim().length === 0) {
        errors.push('Module code is required');
      } else if (data.code.trim().length > 20) {
        errors.push('Module code must not exceed 20 characters');
      }

      if (!data.name || data.name.trim().length === 0) {
        errors.push('Module name is required');
      } else if (data.name.trim().length > 255) {
        errors.push('Module name must not exceed 255 characters');
      }

      if (!data.course_id) {
        errors.push('Course is required');
      } else if (typeof data.course_id !== 'string') {
        errors.push('Invalid course ID format');
      }

      if (!data.department_id) {
        errors.push('Department is required');
      } else if (typeof data.department_id !== 'string') {
        errors.push('Invalid department ID format');
      }

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      return {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        course_id: data.course_id,
        department_id: data.department_id,
        faculty_id: data.faculty_id || null,
        credits: data.credits || null,
        semester: data.semester || null,
      };
    },

    update(data) {
      const sanitized = {};

      if (data.code !== undefined) {
        if (data.code.trim().length === 0) {
          throw new ValidationError(['Module code cannot be empty']);
        }
        sanitized.code = data.code.trim().toUpperCase();
      }

      if (data.name !== undefined) {
        if (data.name.trim().length === 0) {
          throw new ValidationError(['Module name cannot be empty']);
        }
        sanitized.name = data.name.trim();
      }

      if (data.course_id !== undefined) {
        sanitized.course_id = data.course_id;
      }

      if (data.department_id !== undefined) {
        sanitized.department_id = data.department_id;
      }

      if (data.faculty_id !== undefined) {
        sanitized.faculty_id = data.faculty_id || null;
      }

      if (data.credits !== undefined) {
        sanitized.credits = data.credits;
      }

      if (data.semester !== undefined) {
        sanitized.semester = data.semester;
      }

      return sanitized;
    },
  },

  /**
   * Role validation
   */
  role: {
    create(data) {
      const errors = [];

      if (!data.role || data.role.trim().length === 0) {
        errors.push('Role name is required');
      } else if (data.role.trim().length > 255) {
        errors.push('Role name must not exceed 255 characters');
      }

      if (!data.level || isNaN(parseInt(data.level))) {
        errors.push('Role level is required and must be a number');
      } else {
        const levelNum = parseInt(data.level);
        if (levelNum < 1 || levelNum > 9) {
          errors.push('Role level must be between 1 and 9');
        }
      }

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      return {
        role: data.role.trim(),
        level: parseInt(data.level),
      };
    },

    update(data) {
      const sanitized = {};

      if (data.role !== undefined) {
        if (data.role.trim().length === 0) {
          throw new ValidationError(['Role name cannot be empty']);
        }
        sanitized.role = data.role.trim();
      }

      if (data.level !== undefined) {
        if (isNaN(parseInt(data.level))) {
          throw new ValidationError(['Level must be a number']);
        }
        const levelNum = parseInt(data.level);
        if (levelNum < 1 || levelNum > 9) {
          throw new ValidationError(['Level must be between 1 and 9']);
        }
        sanitized.level = levelNum;
      }

      return sanitized;
    },
  },

  /**
   * Staff validation
   */
  staff: {
    create(data) {
      const errors = [];

      if (!data.staff_id || data.staff_id.trim().length === 0) {
        errors.push('Staff ID is required');
      }

      if (!data.title || data.title.trim().length === 0) {
        errors.push('Title is required');
      }

      if (!data.first_name || data.first_name.trim().length === 0) {
        errors.push('First name is required');
      }

      if (!data.last_name || data.last_name.trim().length === 0) {
        errors.push('Last name is required');
      }

      if (!data.email || !this._isValidEmail(data.email)) {
        errors.push('Valid email address is required');
      }

      if (data.department_id && typeof data.department_id !== 'string') {
        errors.push('Invalid department ID format');
      }

      if (data.campus_id && typeof data.campus_id !== 'string') {
        errors.push('Invalid campus ID format');
      }

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      return {
        staff_id: data.staff_id.trim(),
        title: data.title.trim(),
        initials: data.initials?.trim() || null,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        role: data.role?.trim() || null,
        level: data.level ? String(data.level).trim() : null,
        department_id: data.department_id || null,
        campus_id: data.campus_id || null,
        campus: data.campus?.trim() || null,
        image_url: data.image_url || null,
        id_number: data.id_number?.trim() || null,
        location: data.location?.trim() || null,
        faculty: data.faculty?.trim() || null,
        faculty_code: data.faculty_code?.trim() || null,
        course: data.course?.trim() || null,
        course_code: data.course_code?.trim() || null,
        faculty_id: data.faculty_id || null,
        course_id: data.course_id || null,
        professional_modules: data.professional_modules || null,
        professional_entries: data.professional_entries || null,
        residence: data.residence?.trim() || null,
        extracurricular: data.extracurricular?.trim() || null,
        user_type: data.user_type || 'staff',
      };
    },

    update(data) {
      const sanitized = {};

      if (data.staff_id !== undefined) {
        if (!data.staff_id || data.staff_id.trim().length === 0) {
          throw new ValidationError(['Staff ID cannot be empty']);
        }
        sanitized.staff_id = data.staff_id.trim();
      }

      if (data.title !== undefined) {
        if (!data.title || data.title.trim().length === 0) {
          throw new ValidationError(['Title cannot be empty']);
        }
        sanitized.title = data.title.trim();
      }

      if (data.initials !== undefined) {
        sanitized.initials = data.initials?.trim() || null;
      }

      if (data.first_name !== undefined) {
        if (!data.first_name || data.first_name.trim().length === 0) {
          throw new ValidationError(['First name cannot be empty']);
        }
        sanitized.first_name = data.first_name.trim();
      }

      if (data.last_name !== undefined) {
        if (!data.last_name || data.last_name.trim().length === 0) {
          throw new ValidationError(['Last name cannot be empty']);
        }
        sanitized.last_name = data.last_name.trim();
      }

      if (data.email !== undefined) {
        if (!data.email || !this._isValidEmail(data.email)) {
          throw new ValidationError(['Valid email address is required']);
        }
        sanitized.email = data.email.trim().toLowerCase();
      }

      if (data.phone !== undefined) {
        sanitized.phone = data.phone?.trim() || null;
      }

      if (data.role !== undefined) {
        sanitized.role = data.role?.trim() || null;
      }

      if (data.level !== undefined) {
        sanitized.level = data.level ? String(data.level).trim() : null;
      }

      if (data.department_id !== undefined) {
        sanitized.department_id = data.department_id || null;
      }

      if (data.campus_id !== undefined) {
        sanitized.campus_id = data.campus_id || null;
      }

      if (data.campus !== undefined) {
        sanitized.campus = data.campus?.trim() || null;
      }

      if (data.image_url !== undefined) {
        sanitized.image_url = data.image_url || null;
      }

      if (data.id_number !== undefined) {
        sanitized.id_number = data.id_number?.trim() || null;
      }

      if (data.location !== undefined) {
        sanitized.location = data.location?.trim() || null;
      }

      if (data.faculty !== undefined) {
        sanitized.faculty = data.faculty?.trim() || null;
      }

      if (data.faculty_code !== undefined) {
        sanitized.faculty_code = data.faculty_code?.trim() || null;
      }

      if (data.course !== undefined) {
        sanitized.course = data.course?.trim() || null;
      }

      if (data.course_code !== undefined) {
        sanitized.course_code = data.course_code?.trim() || null;
      }

      if (data.faculty_id !== undefined) {
        sanitized.faculty_id = data.faculty_id || null;
      }

      if (data.course_id !== undefined) {
        sanitized.course_id = data.course_id || null;
      }

      if (data.professional_modules !== undefined) {
        sanitized.professional_modules = data.professional_modules;
      }

      if (data.professional_entries !== undefined) {
        sanitized.professional_entries = data.professional_entries;
      }

      if (data.residence !== undefined) {
        sanitized.residence = data.residence?.trim() || null;
      }

      if (data.extracurricular !== undefined) {
        sanitized.extracurricular = data.extracurricular?.trim() || null;
      }

      return sanitized;
    },

    _isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
  },

  /**
   * Residence validation
   */
  residence: {
    create(data) {
      const errors = [];

      if (!data.residence_id || data.residence_id.trim().length === 0) {
        errors.push('Residence ID is required');
      }

      if (!data.residence || data.residence.trim().length === 0) {
        errors.push('Residence name is required');
      }

      if (!data.address || data.address.trim().length === 0) {
        errors.push('Address is required');
      }

      if (!data.residence_type || data.residence_type.trim().length === 0) {
        errors.push('Residence type is required');
      }

      if (data.campus_id && typeof data.campus_id !== 'string') {
        errors.push('Invalid campus ID format');
      }

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      return {
        residence_id: data.residence_id.trim(),
        residence: data.residence.trim(),
        address: data.address.trim(),
        residence_type: data.residence_type.trim(),
        manager: data.manager?.trim() || null,
        campus_id: data.campus_id || null,
        capacity: data.capacity || null,
        current_occupancy: data.current_occupancy || 0,
      };
    },

    update(data) {
      const sanitized = {};

      if (data.residence !== undefined) {
        if (data.residence.trim().length === 0) {
          throw new ValidationError(['Residence name cannot be empty']);
        }
        sanitized.residence = data.residence.trim();
      }

      if (data.address !== undefined) {
        if (data.address.trim().length === 0) {
          throw new ValidationError(['Address cannot be empty']);
        }
        sanitized.address = data.address.trim();
      }

      if (data.residence_type !== undefined) {
        sanitized.residence_type = data.residence_type.trim();
      }

      if (data.manager !== undefined) {
        sanitized.manager = data.manager?.trim() || null;
      }

      if (data.campus_id !== undefined) {
        sanitized.campus_id = data.campus_id || null;
      }

      if (data.capacity !== undefined) {
        sanitized.capacity = data.capacity;
      }

      if (data.current_occupancy !== undefined) {
        sanitized.current_occupancy = data.current_occupancy;
      }

      return sanitized;
    },
  },

  /**
   * Extracurricular validation
   */
  extracurricular: {
    create(data) {
      const errors = [];

      if (!data.activity || data.activity.trim().length === 0) {
        errors.push('Activity name is required');
      } else if (data.activity.trim().length > 255) {
        errors.push('Activity name must not exceed 255 characters');
      }

      if (!data.category || data.category.trim().length === 0) {
        errors.push('Category is required');
      }

      if (data.department_id && typeof data.department_id !== 'string') {
        errors.push('Invalid department ID format');
      }

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      return {
        activity: data.activity.trim(),
        category: data.category.trim(),
        department_id: data.department_id || null,
        description: data.description?.trim() || null,
        contact_person: data.contact_person?.trim() || null,
      };
    },

    update(data) {
      const sanitized = {};

      if (data.activity !== undefined) {
        if (data.activity.trim().length === 0) {
          throw new ValidationError(['Activity name cannot be empty']);
        }
        sanitized.activity = data.activity.trim();
      }

      if (data.category !== undefined) {
        sanitized.category = data.category.trim();
      }

      if (data.department_id !== undefined) {
        sanitized.department_id = data.department_id || null;
      }

      if (data.description !== undefined) {
        sanitized.description = data.description?.trim() || null;
      }

      if (data.contact_person !== undefined) {
        sanitized.contact_person = data.contact_person?.trim() || null;
      }

      return sanitized;
    },
  },
};

module.exports = { validators, ValidationError };
