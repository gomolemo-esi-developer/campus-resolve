// Student Profile Service - Read-only access to the student's own Student Data record (Campus Voice)
// The Profile page is read-only and must reflect the same `students` table Admin's Student Data uses,
// resolving module catalog IDs to display names the same way campus-admin's ProfileFormModal does
// (moduleMap lookup).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class StudentProfileService {
  constructor(supabaseClient) {
    this.client = supabaseClient;
    this.tableName = 'students';
  }

  _ensureEnabled() {
    if (!this.client) {
      throw new Error('StudentProfileService not initialized - no Supabase client');
    }
  }

  /**
   * Look up the logged-in user's student record by cognito_sub
   */
  async _getProfile(authUser) {
    this._ensureEnabled();

    const { data: student, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('cognito_sub', authUser.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!student) {
      const notFoundError = new Error('No student record found for this account');
      notFoundError.statusCode = 404;
      throw notFoundError;
    }

    return student;
  }

  _parseJsonArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Batch-fetch id -> "code - name" for the modules referenced by this student record
   */
  async _fetchModuleMap(ids) {
    const uniqueIds = [...new Set(ids.filter((id) => id && UUID_RE.test(id)))];
    if (uniqueIds.length === 0) return {};

    const { data, error } = await this.client.from('modules').select('id, code, name').in('id', uniqueIds);
    if (error || !data) return {};

    const map = {};
    data.forEach((row) => {
      map[row.id] = `${row.code} - ${row.name}`;
    });
    return map;
  }

  /**
   * Map a `students` row to the same field names/shapes used by Admin's Student Data API
   * (see adminController.js studentController getAll/getById transforms), resolving module IDs to names.
   */
  async _mapProfile(student) {
    const rawModules = this._parseJsonArray(student.modules);
    const moduleMap = await this._fetchModuleMap(rawModules);

    return {
      id: student.id,
      email: student.email || '',
      firstName: student.first_name || '',
      lastName: student.last_name || '',
      studentNumber: student.student_id || '',
      idNumber: student.id_number || '',
      title: student.title || '',
      initials: student.initials || '',
      faculty: student.faculty || '',
      facultyCode: student.faculty_code || '',
      department: student.department || '',
      departmentCode: student.department_code || '',
      campus: student.campus || '',
      course: student.course || '',
      courseCode: student.course_code || '',
      extracurricular: student.extracurricular || '',
      residence: student.residence || '',
      modules: rawModules.map((moduleValue) => (UUID_RE.test(moduleValue) ? moduleMap[moduleValue] : moduleValue) || moduleValue),
    };
  }

  /**
   * Get current user's student profile (read-only)
   */
  async getProfile(authUser) {
    const student = await this._getProfile(authUser);
    return this._mapProfile(student);
  }
}

module.exports = StudentProfileService;
