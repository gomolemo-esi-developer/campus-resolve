// Staff Profile Service - Read-only access to the staff member's own Staff Data record (Campus Resolve)
// The Profile page is read-only and must reflect the same `staff` table Admin's Staff Data uses,
// resolving catalog IDs (department/faculty/course/module) to display names the same way
// campus-admin's ProfileFormModal does (moduleMap/departmentOptions/etc. lookups).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class StaffProfileService {
  constructor(supabaseClient) {
    this.client = supabaseClient;
    this.tableName = 'staff';
  }

  _ensureEnabled() {
    if (!this.client) {
      throw new Error('StaffProfileService not initialized - no Supabase client');
    }
  }

  /**
   * Look up the logged-in user's staff record by cognito_sub
   */
  async _getProfile(authUser) {
    this._ensureEnabled();

    const { data: staff, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('cognito_sub', authUser.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!staff) {
      const notFoundError = new Error('No staff record found for this account');
      notFoundError.statusCode = 404;
      throw notFoundError;
    }

    return staff;
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
   * Batch-fetch id -> name for a table, for exactly the ids referenced by this staff record
   */
  async _fetchNameMap(table, ids) {
    const uniqueIds = [...new Set(ids.filter((id) => id && UUID_RE.test(id)))];
    if (uniqueIds.length === 0) return {};

    const { data, error } = await this.client.from(table).select('id, name').in('id', uniqueIds);
    if (error || !data) return {};

    const map = {};
    data.forEach((row) => {
      map[row.id] = row.name;
    });
    return map;
  }

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
   * Normalize a professional/academic entry - the `staff` table has entries saved in two
   * historical shapes: legacy {facultyName, facultyCode, departmentName, departmentCode,
   * courseName, courseCode} and current {faculty, facultyCode, department, departmentId,
   * course, courseCode}. Course/faculty values in the current shape may be raw catalog IDs.
   */
  _normalizeEntry(entry, courseMap, facultyMap) {
    const rawCourse = entry.course ?? entry.courseName ?? '';
    const rawFaculty = entry.faculty ?? entry.facultyName ?? '';

    return {
      id: entry.id,
      course: (UUID_RE.test(rawCourse) ? courseMap[rawCourse] : rawCourse) || '',
      courseCode: entry.courseCode || '',
      department: entry.department ?? entry.departmentName ?? '',
      departmentCode: entry.departmentCode || '',
      faculty: (UUID_RE.test(rawFaculty) ? facultyMap[rawFaculty] : rawFaculty) || '',
      facultyCode: entry.facultyCode || '',
    };
  }

  /**
   * Map a `staff` row to the same field names/shapes used by Admin's Staff Data API
   * (see adminController.js getAll/getById staff transforms), resolving catalog IDs to names.
   */
  async _mapProfile(staff) {
    const rawModules = this._parseJsonArray(staff.professional_modules);
    const rawEntries = this._parseJsonArray(staff.professional_entries);

    const entryCourseIds = rawEntries.map((e) => e.course).filter((v) => v);
    const entryFacultyIds = rawEntries.map((e) => e.faculty).filter((v) => v);

    const [departmentName, moduleMap, courseMap, facultyMap] = await Promise.all([
      staff.department_id
        ? this._fetchNameMap('departments', [staff.department_id]).then((m) => m[staff.department_id] || '')
        : Promise.resolve(''),
      this._fetchModuleMap(rawModules),
      this._fetchNameMap('courses', entryCourseIds),
      this._fetchNameMap('faculties', entryFacultyIds),
    ]);

    return {
      id: staff.id,
      email: staff.email || '',
      firstName: staff.first_name || '',
      lastName: staff.last_name || '',
      staffNumber: staff.staff_id || '',
      idNumber: staff.id_number || '',
      title: staff.title || '',
      initials: staff.initials || '',
      location: staff.location || '',
      campus: staff.campus || '',
      faculty: staff.faculty || '',
      facultyCode: staff.faculty_code || '',
      department: departmentName,
      departmentCode: staff.department_code || '',
      course: staff.course || '',
      courseCode: staff.course_code || '',
      extracurricular: staff.extracurricular || '',
      residence: staff.residence || '',
      modules: rawModules.map((moduleValue) => (UUID_RE.test(moduleValue) ? moduleMap[moduleValue] : moduleValue) || moduleValue),
      professionalEntries: rawEntries.map((entry) => this._normalizeEntry(entry, courseMap, facultyMap)),
    };
  }

  /**
   * Get current user's staff profile (read-only)
   */
  async getProfile(authUser) {
    const staff = await this._getProfile(authUser);
    return this._mapProfile(staff);
  }
}

module.exports = StaffProfileService;
