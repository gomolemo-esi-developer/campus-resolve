/**
 * Campus Admin API Service
 * Handles all API calls to the backend for Campus and Course management
 * 
 * Base URL: http://localhost:3000/api/admin
 * Port: 8082 (backend) routed through proxy at 3000
 */

const API_BASE = '/api/admin';

// Get auth token from localStorage
// authService.ts (packages/shared) stores the real Cognito token under 'auth_token'
function getAuthToken(): string {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        console.warn('[getAuthToken] No token found in localStorage, using fallback');
        return 'test-token-dev';
    }
    return token;
}

// Headers for all requests
function getHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
    };
}

// API response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message: string;
    error?: string;
    details?: string[];
    count?: number;
    total?: number;
    page?: number;
    limit?: number;
}

// Campus types
export interface CampusData {
    id: string;
    name: string;
    abbreviation: string;
    location: string;
}

// Course types
export interface CourseData {
    id: string;
    code: string;
    name: string;
    departmentId: string;
    departmentName: string;
    facultyId: string;
    facultyName: string;
    qualificationType: string;
}

// Department types
export interface DepartmentData {
    id: string;
    name: string;
    abbreviation: string;
    facultyId: string;
    facultyName: string;
}

// Faculty types
export interface FacultyData {
    id: string;
    name: string;
    abbreviation: string;
}

// Module types
export interface ModuleData {
    id: string;
    code: string;
    name: string;
    courseId: string;
    courseName: string;
    departmentId: string;
    departmentName: string;
    facultyId: string;
    facultyName: string;
}

// Role types
export interface RoleData {
    id: string;
    role: string;
    level: string;
}

// Error handling
export class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public details?: string[]
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Handle API response
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    console.log('[DEBUG handleResponse] Status:', response.status);
    if (!response.ok) {
        const data = await response.json();
        throw new ApiError(
            response.status,
            data.message || `API Error: ${response.statusText}`,
            data.details
        );
    }

    const json = await response.json();
    console.log('[DEBUG handleResponse] JSON keys:', Object.keys(json));
    console.log('[DEBUG handleResponse] JSON data:', json.data);
    return json;
}

// ============================================================================
// CAMPUS API
// ============================================================================

export const campusApi = {
    /**
     * Create a new campus
     */
    create: async (campus: Omit<CampusData, 'id'>): Promise<CampusData> => {
        const response = await fetch(`${API_BASE}/campuses`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(campus),
        });
        const result = await handleResponse<CampusData>(response);
        return result.data!;
    },

    /**
     * Get all campuses with optional search and pagination
     */
    list: async (
        search = '',
        page = 1,
        limit = 20
    ): Promise<{ data: CampusData[]; count: number; total: number; page: number; limit: number }> => {
        const params = new URLSearchParams({
            ...(search && { search }),
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await fetch(`${API_BASE}/campuses?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<CampusData[]>(response);
        return {
            data: result.data!,
            count: result.count!,
            total: result.total!,
            page: result.page!,
            limit: result.limit!,
        };
    },

    /**
     * Get a single campus by ID
     */
    get: async (id: string): Promise<CampusData> => {
        const response = await fetch(`${API_BASE}/campuses/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<CampusData>(response);
        return result.data!;
    },

    /**
     * Update a campus
     */
    update: async (id: string, campus: Partial<Omit<CampusData, 'id'>>): Promise<CampusData> => {
        const response = await fetch(`${API_BASE}/campuses/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(campus),
        });
        const result = await handleResponse<CampusData>(response);
        return result.data!;
    },

    /**
     * Delete a single campus
     */
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/campuses/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(response);
    },

    /**
     * Delete multiple campuses (batch delete)
     */
    batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
        const response = await fetch(`${API_BASE}/campuses`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        const result = await handleResponse<{ deleted: number }>(response);
        return result.data!;
    },
};

// ============================================================================
// COURSE API
// ============================================================================

export const courseApi = {
    /**
     * Create a new course
     * Note: facultyId is automatically looked up from department by backend
     */
    create: async (course: Omit<CourseData, 'id' | 'departmentName' | 'facultyId' | 'facultyName'>): Promise<CourseData> => {
        // Transform camelCase to snake_case for backend
        // Note: faculty_id is NOT sent - backend will auto-populate from department
        const payload = {
            code: course.code,
            name: course.name,
            department_id: course.departmentId,
            qualification_type: course.qualificationType,
        };
        
        const response = await fetch(`${API_BASE}/courses`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const result = await handleResponse<CourseData>(response);
        return result.data!;
    },

    /**
     * Get all courses with optional filtering and pagination
     */
    list: async (
        qualificationType = '',
        departmentId = '',
        search = '',
        page = 1,
        limit = 20
    ): Promise<{ data: CourseData[]; count: number; total: number; page: number; limit: number }> => {
        const params = new URLSearchParams({
            ...(qualificationType && { qualificationType }),
            ...(departmentId && { departmentId }),
            ...(search && { search }),
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await fetch(`${API_BASE}/courses?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<any[]>(response);

        // Transform snake_case API response to camelCase
        // qualification_type from DB contains abbreviated values (HCert, Dip, ND, etc.)
        const transformedData = result.data!.map((course: any) => ({
            id: course.id,
            code: course.code,
            name: course.name,
            departmentId: course.department_id,
            departmentName: course.department_name || 'Unknown',
            facultyId: course.faculty_id,
            facultyName: course.faculty_name || 'Unknown',
            qualificationType: course.qualification_type || 'HCert',
        }));

        return {
            data: transformedData,
            count: result.count!,
            total: result.total!,
            page: result.page!,
            limit: result.limit!,
        };
    },

    /**
     * Get a single course by ID
     */
    get: async (id: string): Promise<CourseData> => {
        const response = await fetch(`${API_BASE}/courses/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<CourseData>(response);
        return result.data!;
    },

    /**
     * Update a course
     * Note: facultyId is automatically looked up from department by backend if department changes
     */
    update: async (id: string, course: Partial<Omit<CourseData, 'id'>>): Promise<CourseData> => {
        // Transform camelCase to snake_case for backend
        const payload: any = {};
        if (course.code !== undefined) payload.code = course.code;
        if (course.name !== undefined) payload.name = course.name;
        if (course.departmentId !== undefined) payload.department_id = course.departmentId;
        // Note: facultyId is NOT sent - backend will auto-populate from department
        if (course.qualificationType !== undefined) payload.qualification_type = course.qualificationType;
        
        const response = await fetch(`${API_BASE}/courses/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const result = await handleResponse<CourseData>(response);
        return result.data!;
    },

    /**
     * Delete a single course
     */
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/courses/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(response);
    },

    /**
     * Delete multiple courses (batch delete)
     */
    batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
        const response = await fetch(`${API_BASE}/courses`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        const result = await handleResponse<{ deleted: number }>(response);
        return result.data!;
    },
};

// ============================================================================
// DEPARTMENT API
// ============================================================================

export const departmentApi = {
    /**
     * Create a new department
     */
    create: async (department: Omit<DepartmentData, 'id' | 'facultyName'>): Promise<DepartmentData> => {
        // Transform camelCase to snake_case for backend
        const payload = {
            name: department.name,
            abbreviation: department.abbreviation,
            faculty_id: department.facultyId,
        };
        
        const response = await fetch(`${API_BASE}/departments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const result = await handleResponse<any>(response);
        
        // Transform response back to camelCase with facultyName
        const transformed = {
            id: result.data.id,
            name: result.data.name,
            abbreviation: result.data.abbreviation,
            facultyId: result.data.faculty_id,
            facultyName: result.data.faculty_name || 'Unknown',
        };
        return transformed;
    },

    /**
     * Get all departments with optional search and pagination
     */
    list: async (
        search = '',
        page = 1,
        limit = 20
    ): Promise<{ data: DepartmentData[]; count: number; total: number; page: number; limit: number }> => {
        const params = new URLSearchParams({
            ...(search && { search }),
            page: page.toString(),
            limit: limit.toString(),
        });

        const headers = getHeaders();
        const url = `${API_BASE}/departments?${params}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });
        
        const result = await handleResponse<any[]>(response);

        // Transform snake_case to camelCase
        const transformedData = (result.data || []).map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            abbreviation: dept.abbreviation,
            facultyId: dept.faculty_id,
            facultyName: dept.faculty_name || 'Unknown',
        }));

        return {
            data: transformedData,
            count: result.count!,
            total: result.total!,
            page: result.page!,
            limit: result.limit!,
        };
    },

    /**
     * Get a single department by ID
     */
    get: async (id: string): Promise<DepartmentData> => {
        const response = await fetch(`${API_BASE}/departments/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<DepartmentData>(response);
        return result.data!;
    },

    /**
     * Update a department
     */
    update: async (id: string, department: Partial<Omit<DepartmentData, 'id'>>): Promise<DepartmentData> => {
        // Transform camelCase to snake_case for backend
        const payload: any = {};
        if (department.name !== undefined) payload.name = department.name;
        if (department.abbreviation !== undefined) payload.abbreviation = department.abbreviation;
        if (department.facultyId !== undefined) payload.faculty_id = department.facultyId;
        
        const response = await fetch(`${API_BASE}/departments/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const result = await handleResponse<any>(response);
        
        // Transform response back to camelCase with facultyName
        const transformed = {
            id: result.data.id,
            name: result.data.name,
            abbreviation: result.data.abbreviation,
            facultyId: result.data.faculty_id,
            facultyName: result.data.faculty_name || 'Unknown',
        };
        return transformed;
    },

    /**
     * Delete a single department
     */
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/departments/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(response);
    },

    /**
     * Delete multiple departments (batch delete)
     */
    batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
        const response = await fetch(`${API_BASE}/departments`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        const result = await handleResponse<{ deleted: number }>(response);
        return result.data!;
    },
};

// ============================================================================
// FACULTY API
// ============================================================================

export const facultyApi = {
    /**
     * Create a new faculty
     */
    create: async (faculty: Omit<FacultyData, 'id'>): Promise<FacultyData> => {
        const response = await fetch(`${API_BASE}/faculties`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(faculty),
        });
        const result = await handleResponse<FacultyData>(response);
        return result.data!;
    },

    /**
     * Get all faculties with optional search and pagination
     */
    list: async (
        search = '',
        page = 1,
        limit = 20
    ): Promise<{ data: FacultyData[]; count: number; total: number; page: number; limit: number }> => {
        const params = new URLSearchParams({
            ...(search && { search }),
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await fetch(`${API_BASE}/faculties?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<FacultyData[]>(response);
        return {
            data: result.data!,
            count: result.count!,
            total: result.total!,
            page: result.page!,
            limit: result.limit!,
        };
    },

    /**
     * Get a single faculty by ID
     */
    get: async (id: string): Promise<FacultyData> => {
        const response = await fetch(`${API_BASE}/faculties/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<FacultyData>(response);
        return result.data!;
    },

    /**
     * Update a faculty
     */
    update: async (id: string, faculty: Partial<Omit<FacultyData, 'id'>>): Promise<FacultyData> => {
        const response = await fetch(`${API_BASE}/faculties/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(faculty),
        });
        const result = await handleResponse<FacultyData>(response);
        return result.data!;
    },

    /**
     * Delete a single faculty
     */
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/faculties/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(response);
    },

    /**
     * Delete multiple faculties (batch delete)
     */
    batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
        const response = await fetch(`${API_BASE}/faculties`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        const result = await handleResponse<{ deleted: number }>(response);
        return result.data!;
    },
};

// ============================================================================
// MODULE API
// ============================================================================

export const moduleApi = {
    /**
      * Create a new module
      * Note: Transform camelCase to snake_case for backend
      */
    create: async (module: Omit<ModuleData, 'id' | 'courseName' | 'departmentName' | 'facultyId' | 'facultyName'>): Promise<ModuleData> => {
        const payload = {
            code: module.code,
            name: module.name,
            course_id: module.courseId,
            department_id: module.departmentId,
        };
        
        const response = await fetch(`${API_BASE}/modules`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const result = await handleResponse<ModuleData>(response);
        return result.data!;
    },

    /**
      * Get all modules with optional filtering and pagination
      */
    list: async (
        departmentId = '',
        courseId = '',
        search = '',
        page = 1,
        limit = 20
    ): Promise<{ data: ModuleData[]; count: number; total: number; page: number; limit: number }> => {
        const params = new URLSearchParams({
            ...(departmentId && { departmentId }),
            ...(courseId && { courseId }),
            ...(search && { search }),
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await fetch(`${API_BASE}/modules?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<any[]>(response);

        // Transform snake_case API response to camelCase
        const transformedData = result.data!.map((module: any) => ({
            id: module.id,
            code: module.code,
            name: module.name,
            courseId: module.course_id,
            courseName: module.course_name || 'Unknown',
            departmentId: module.department_id,
            departmentName: module.department_name || 'Unknown',
            facultyId: module.faculty_id,
            facultyName: module.faculty_name || 'Unknown',
        }));

        return {
            data: transformedData,
            count: result.count!,
            total: result.total!,
            page: result.page!,
            limit: result.limit!,
        };
    },

    /**
      * Get a single module by ID
      */
    get: async (id: string): Promise<ModuleData> => {
        const response = await fetch(`${API_BASE}/modules/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<ModuleData>(response);
        return result.data!;
    },

    /**
      * Update a module
      */
    update: async (id: string, module: Partial<Omit<ModuleData, 'id'>>): Promise<ModuleData> => {
        const response = await fetch(`${API_BASE}/modules/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(module),
        });
        const result = await handleResponse<ModuleData>(response);
        return result.data!;
    },

    /**
      * Delete a single module
      */
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/modules/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(response);
    },

    /**
      * Delete multiple modules (batch delete)
      */
    batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
        const response = await fetch(`${API_BASE}/modules`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        const result = await handleResponse<{ deleted: number }>(response);
        return result.data!;
    },
};

// ============================================================================
// ROLE API
// ============================================================================

export const roleApi = {
    /**
     * Create a new role
     */
    create: async (role: Omit<RoleData, 'id'>): Promise<RoleData> => {
        const response = await fetch(`${API_BASE}/roles`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(role),
        });
        const result = await handleResponse<RoleData>(response);
        return result.data!;
    },

    /**
     * Get all roles with optional search and pagination
     */
    list: async (
        search = '',
        page = 1,
        limit = 20
    ): Promise<{ data: RoleData[]; count: number; total: number; page: number; limit: number }> => {
        const params = new URLSearchParams({
            ...(search && { search }),
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await fetch(`${API_BASE}/roles?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<RoleData[]>(response);
        return {
            data: result.data!,
            count: result.count!,
            total: result.total!,
            page: result.page!,
            limit: result.limit!,
        };
    },

    /**
     * Get a single role by ID
     */
    get: async (id: string): Promise<RoleData> => {
        const response = await fetch(`${API_BASE}/roles/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<RoleData>(response);
        return result.data!;
    },

    /**
     * Update a role
     */
    update: async (id: string, role: Partial<Omit<RoleData, 'id'>>): Promise<RoleData> => {
        const response = await fetch(`${API_BASE}/roles/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(role),
        });
        const result = await handleResponse<RoleData>(response);
        return result.data!;
    },

    /**
     * Delete a single role
     */
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/roles/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(response);
    },

    /**
     * Delete multiple roles (batch delete)
     */
    batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
        const response = await fetch(`${API_BASE}/roles`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        const result = await handleResponse<{ deleted: number }>(response);
        return result.data!;
    },
};

// ============================================================================
// EXTRACURRICULAR API
// ============================================================================

export interface ExtracurricularData {
    id: string;
    activity: string;
    category: string;
    departmentId: string | null;
    departmentName: string | null;
}

export const extracurricularApi = {
    /**
      * Create a new extracurricular activity
      * Note: Transform camelCase to snake_case for backend
      */
    create: async (extracurricular: Omit<ExtracurricularData, 'id'>): Promise<ExtracurricularData> => {
        const payload = {
            activity: extracurricular.activity,
            category: extracurricular.category,
            department_id: extracurricular.departmentId || null,
        };
        
        const response = await fetch(`${API_BASE}/extracurriculars`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const result = await handleResponse<any>(response);
        // Transform snake_case to camelCase
        return {
            id: result.data!.id,
            activity: result.data!.activity,
            category: result.data!.category,
            departmentId: result.data!.department_id || null,
            departmentName: result.data!.department_name || null,
        };
    },

    /**
     * Get all extracurricular activities with optional filtering and pagination
     */
    list: async (
        category = '',
        search = '',
        page = 1,
        limit = 20
    ): Promise<{ data: ExtracurricularData[]; count: number; total: number; page: number; limit: number }> => {
        const params = new URLSearchParams({
            ...(category && { category }),
            ...(search && { search }),
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await fetch(`${API_BASE}/extracurriculars?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<any[]>(response);
        // Transform snake_case to camelCase
        const transformedData = (result.data || []).map((activity: any) => ({
            id: activity.id,
            activity: activity.activity,
            category: activity.category,
            departmentId: activity.department_id || null,
            departmentName: activity.department_name || null,
        }));
        return {
            data: transformedData,
            count: result.count!,
            total: result.total!,
            page: result.page!,
            limit: result.limit!,
        };
    },

    /**
     * Get a single extracurricular activity by ID
     */
    get: async (id: string): Promise<ExtracurricularData> => {
        const response = await fetch(`${API_BASE}/extracurriculars/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<any>(response);
        // Transform snake_case to camelCase
        return {
            id: result.data!.id,
            activity: result.data!.activity,
            category: result.data!.category,
            departmentId: result.data!.department_id || null,
            departmentName: result.data!.department_name || null,
        };
    },

    /**
      * Update an extracurricular activity
      * Note: Transform camelCase to snake_case for backend
      */
    update: async (id: string, extracurricular: Partial<Omit<ExtracurricularData, 'id'>>): Promise<ExtracurricularData> => {
        const payload: any = {};
        if (extracurricular.activity !== undefined) payload.activity = extracurricular.activity;
        if (extracurricular.category !== undefined) payload.category = extracurricular.category;
        if (extracurricular.departmentId !== undefined) payload.department_id = extracurricular.departmentId || null;
        
        const response = await fetch(`${API_BASE}/extracurriculars/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const result = await handleResponse<any>(response);
        // Transform snake_case to camelCase
        return {
            id: result.data!.id,
            activity: result.data!.activity,
            category: result.data!.category,
            departmentId: result.data!.department_id || null,
            departmentName: result.data!.department_name || null,
        };
    },

    /**
     * Delete a single extracurricular activity
     */
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/extracurriculars/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(response);
    },

    /**
     * Delete multiple extracurricular activities (batch delete)
     */
    batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
        const response = await fetch(`${API_BASE}/extracurriculars`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        const result = await handleResponse<{ deleted: number }>(response);
        return result.data!;
    },
};

// ============================================================================
// STAFF API
// ============================================================================

export interface StaffData {
    id: string;
    staffId: string;
    title: string;
    initials: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    department: string;
    level: string;
    campus: string;
    campusId: string;
    departmentId?: string;
    residence?: string;
    extracurricular?: string;
    image?: string;
    idNumber?: string;
    location?: string;
    faculty?: string;
    facultyCode?: string;
    course?: string;
    courseCode?: string;
    modules?: string[];
    academicEntries?: any[];
}

export const staffApi = {
    /**
      * Create a new staff member
      * Note: Transform camelCase to snake_case for backend
      */
    create: async (staffMember: Omit<StaffData, 'id'>): Promise<StaffData> => {
        const payload = {
            staff_id: staffMember.staffId,
            title: staffMember.title,
            initials: staffMember.initials,
            first_name: staffMember.firstName,
            last_name: staffMember.lastName,
            role: staffMember.role,
            level: staffMember.level ? parseInt(staffMember.level, 10) : null,
            campus_id: staffMember.campusId,
            campus: staffMember.campus || null,
            email: staffMember.email,
            phone: staffMember.phone || null,
            image_url: staffMember.image || null,
            department_id: staffMember.departmentId || null,
            id_number: staffMember.idNumber || null,
            location: staffMember.location || null,
            faculty: staffMember.faculty || null,
            faculty_code: staffMember.facultyCode || null,
            course: staffMember.course || null,
            course_code: staffMember.courseCode || null,
            professional_modules: staffMember.modules ? JSON.stringify(staffMember.modules) : null,
            professional_entries: staffMember.academicEntries ? JSON.stringify(staffMember.academicEntries) : null,
            residence: staffMember.residence || null,
            extracurricular: staffMember.extracurricular || null,
            user_type: 'staff',
        };
        
        console.log('[DEBUG staffApi.create] Payload:', JSON.stringify(payload, null, 2));
        const response = await fetch(`${API_BASE}/staff`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        console.log('[DEBUG staffApi.create] Response status:', response.status);
        const result = await handleResponse<any>(response);
        console.log('[DEBUG staffApi.create] Result:', result);
        return {
            id: result.data!.id,
            staffId: result.data!.staffId || result.data!.staff_id,
            title: result.data!.title,
            initials: result.data!.initials,
            firstName: result.data!.firstName || result.data!.first_name,
            lastName: result.data!.lastName || result.data!.last_name,
            role: result.data!.role,
            department: result.data!.department || 'Unknown',
            departmentId: result.data!.departmentId || result.data!.department_id,
            level: result.data!.level ? String(result.data!.level) : '',
            campus: result.data!.campus,
            campusId: result.data!.campusId || result.data!.campus_id,
            email: result.data!.email,
            phone: result.data!.phone,
            image: result.data!.image_url || result.data!.image,
            idNumber: result.data!.idNumber || result.data!.id_number,
            location: result.data!.location,
            faculty: result.data!.faculty,
            facultyCode: result.data!.facultyCode || result.data!.faculty_code,
            course: result.data!.course,
            courseCode: result.data!.courseCode || result.data!.course_code,
            modules: result.data!.modules || result.data!.professional_modules || [],
            academicEntries: result.data!.academicEntries || result.data!.professional_entries || [],
            residence: result.data!.residence,
            extracurricular: result.data!.extracurricular,
        };
    },

    /**
     * Get all staff with optional filtering and pagination
     */
    list: async (
        campus = '',
        departmentId = '',
        search = '',
        page = 1,
        limit = 20
    ): Promise<{ data: StaffData[]; count: number; total: number; page: number; limit: number }> => {
        const params = new URLSearchParams({
            ...(campus && { campus }),
            ...(departmentId && { departmentId }),
            ...(search && { search }),
            page: page.toString(),
            limit: limit.toString(),
        });

        console.log('[DEBUG adminApi.list] Fetching from:', `${API_BASE}/staff?${params}`);
        const response = await fetch(`${API_BASE}/staff?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        console.log('[DEBUG adminApi.list] Response status:', response.status);
        const result = await handleResponse<any[]>(response);
        console.log('[DEBUG adminApi.list] Got result, count:', result.count, 'data length:', result.data?.length);
        
        // Transform snake_case OR camelCase database fields to camelCase
        const transformedData: StaffData[] = result.data!.map((item: any) => {
            const transformed = {
                id: item.id,
                staffId: item.staffId || item.staff_id,
                title: item.title,
                initials: item.initials,
                firstName: item.firstName || item.first_name,
                lastName: item.lastName || item.last_name,
                role: item.role,
                department: item.department || 'Unknown',
                departmentId: item.departmentId || item.department_id,
                level: item.level ? String(item.level) : '',
                campus: item.campus,
                campusId: item.campusId || item.campus_id,
                email: item.email,
                phone: item.phone,
                image: item.image_url || item.image,
                residence: item.residence,
                extracurricular: item.extracurricular,
                idNumber: item.idNumber || item.id_number,
                location: item.location,
                faculty: item.faculty,
                facultyCode: item.facultyCode || item.faculty_code,
                course: item.course,
                courseCode: item.courseCode || item.course_code,
                modules: item.modules || item.professional_modules || [],
                academicEntries: item.academicEntries || item.professional_entries || [],
            };
            return transformed;
        });
        
        return {
            data: transformedData,
            count: result.count!,
            total: result.total!,
            page: result.page!,
            limit: result.limit!,
        };
    },

    /**
     * Get a single staff member by ID
     */
    get: async (id: string): Promise<StaffData> => {
        const response = await fetch(`${API_BASE}/staff/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<StaffData>(response);
        return result.data!;
    },

     /**
      * Update a staff member
      * Note: Transform camelCase to snake_case for backend
      */
     update: async (id: string, staffMember: Partial<Omit<StaffData, 'id'>>): Promise<StaffData> => {
         const payload: any = {};
         if (staffMember.staffId !== undefined) payload.staff_id = staffMember.staffId;
         if (staffMember.title !== undefined) payload.title = staffMember.title;
         if (staffMember.initials !== undefined) payload.initials = staffMember.initials;
         if (staffMember.firstName !== undefined) payload.first_name = staffMember.firstName;
         if (staffMember.lastName !== undefined) payload.last_name = staffMember.lastName;
         if (staffMember.role !== undefined) payload.role = staffMember.role;
         if (staffMember.level !== undefined) payload.level = parseInt(staffMember.level, 10);
         if (staffMember.campusId !== undefined) payload.campus_id = staffMember.campusId;
         if (staffMember.campus !== undefined) payload.campus = staffMember.campus || null;
         if (staffMember.email !== undefined) payload.email = staffMember.email;
         if (staffMember.phone !== undefined) payload.phone = staffMember.phone || null;
         if (staffMember.image !== undefined) payload.image_url = staffMember.image || null;
         if (staffMember.departmentId !== undefined) payload.department_id = staffMember.departmentId || null;
         if (staffMember.idNumber !== undefined) payload.id_number = staffMember.idNumber || null;
         if (staffMember.location !== undefined) payload.location = staffMember.location || null;
         if (staffMember.faculty !== undefined) payload.faculty = staffMember.faculty || null;
         if (staffMember.facultyCode !== undefined) payload.faculty_code = staffMember.facultyCode || null;
         if (staffMember.course !== undefined) payload.course = staffMember.course || null;
         if (staffMember.courseCode !== undefined) payload.course_code = staffMember.courseCode || null;
         if (staffMember.modules !== undefined) payload.professional_modules = JSON.stringify(staffMember.modules);
         if (staffMember.academicEntries !== undefined) payload.professional_entries = JSON.stringify(staffMember.academicEntries);
         if (staffMember.residence !== undefined) payload.residence = staffMember.residence || null;
         if (staffMember.extracurricular !== undefined) payload.extracurricular = staffMember.extracurricular || null;
         
         const response = await fetch(`${API_BASE}/staff/${id}`, {
             method: 'PUT',
             headers: getHeaders(),
             body: JSON.stringify(payload),
         });
         const result = await handleResponse<any>(response);
         return {
             id: result.data!.id,
             staffId: result.data!.staffId || result.data!.staff_id,
             title: result.data!.title,
             initials: result.data!.initials,
             firstName: result.data!.firstName || result.data!.first_name,
             lastName: result.data!.lastName || result.data!.last_name,
             role: result.data!.role,
             department: result.data!.department || 'Unknown',
             departmentId: result.data!.departmentId || result.data!.department_id,
             level: result.data!.level ? String(result.data!.level) : '',
             campus: result.data!.campus,
             campusId: result.data!.campusId || result.data!.campus_id,
             email: result.data!.email,
             phone: result.data!.phone,
             image: result.data!.image_url || result.data!.image,
             idNumber: result.data!.idNumber || result.data!.id_number,
             location: result.data!.location,
             faculty: result.data!.faculty,
             facultyCode: result.data!.facultyCode || result.data!.faculty_code,
             course: result.data!.course,
             courseCode: result.data!.courseCode || result.data!.course_code,
             modules: result.data!.modules || result.data!.professional_modules || [],
             academicEntries: result.data!.academicEntries || result.data!.professional_entries || [],
             residence: result.data!.residence,
             extracurricular: result.data!.extracurricular,
         };
     },

    /**
     * Delete a single staff member
     */
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/staff/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(response);
    },

    /**
     * Delete multiple staff members (batch delete)
     */
    batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
        const response = await fetch(`${API_BASE}/staff`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        const result = await handleResponse<{ deleted: number }>(response);
        return result.data!;
    },
};

// ============================================================================
// RESIDENCE API
// ============================================================================

export interface ResidenceData {
    id: string;
    residenceId: string;
    residence: string;
    address: string;
    residenceType: string;
    manager?: string;
    campus: string;
}

export const residenceApi = {
    /**
      * Create a new residence
      * Note: Transform camelCase to snake_case for backend
      */
    create: async (residence: Omit<ResidenceData, 'id'>): Promise<ResidenceData> => {
        const payload = {
            residence_id: residence.residenceId,
            residence: residence.residence,
            address: residence.address,
            residence_type: residence.residenceType,
            manager: residence.manager || null,
            campus_id: residence.campusId || null,
        };
        
        const response = await fetch(`${API_BASE}/residences`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const result = await handleResponse<any>(response);
        return {
            id: result.data!.id,
            residenceId: result.data!.residence_id,
            residence: result.data!.residence,
            address: result.data!.address,
            residenceType: result.data!.residence_type,
            manager: result.data!.manager,
            campus: result.data!.campus,
            campusId: result.data!.campus_id,
        };
    },

    /**
     * Get all residences with optional filtering and pagination
     */
    list: async (
        campus = '',
        residenceType = '',
        search = '',
        page = 1,
        limit = 20
    ): Promise<{ data: ResidenceData[]; count: number; total: number; page: number; limit: number }> => {
        const params = new URLSearchParams({
            ...(campus && { campus }),
            ...(residenceType && { residenceType }),
            ...(search && { search }),
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await fetch(`${API_BASE}/residences?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<any[]>(response);
        
        // Transform snake_case OR camelCase database fields to camelCase, ensure campusId is included
        const transformedData: ResidenceData[] = result.data!.map((item: any) => ({
            id: item.id,
            residenceId: item.residenceId || item.residence_id,
            residence: item.residence,
            address: item.address,
            residenceType: item.residenceType || item.residence_type,
            manager: item.manager,
            campus: item.campus,
            campusId: item.campusId || item.campus_id,
            capacity: item.capacity,
            currentOccupancy: item.currentOccupancy || item.current_occupancy,
        }));
        
        return {
            data: transformedData,
            count: result.count!,
            total: result.total!,
            page: result.page!,
            limit: result.limit!,
        };
    },

    /**
     * Get a single residence by ID
     */
    get: async (id: string): Promise<ResidenceData> => {
        const response = await fetch(`${API_BASE}/residences/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<ResidenceData>(response);
        return result.data!;
    },

    /**
      * Update a residence
      * Note: Transform camelCase to snake_case for backend
      */
    update: async (id: string, residence: Partial<Omit<ResidenceData, 'id'>>): Promise<ResidenceData> => {
        const payload: any = {};
        if (residence.residence !== undefined) payload.residence = residence.residence;
        if (residence.address !== undefined) payload.address = residence.address;
        if (residence.residenceType !== undefined) payload.residence_type = residence.residenceType;
        if (residence.manager !== undefined) payload.manager = residence.manager || null;
        if (residence.campusId !== undefined) payload.campus_id = residence.campusId || null;
        
        const response = await fetch(`${API_BASE}/residences/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const result = await handleResponse<any>(response);
        return {
            id: result.data!.id,
            residenceId: result.data!.residenceId || result.data!.residence_id,
            residence: result.data!.residence,
            address: result.data!.address,
            residenceType: result.data!.residenceType || result.data!.residence_type,
            manager: result.data!.manager,
            campus: result.data!.campus,
            campusId: result.data!.campusId || result.data!.campus_id,
        };
    },

    /**
     * Delete a single residence
     */
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/residences/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(response);
    },

    /**
     * Delete multiple residences (batch delete)
     */
    batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
        const response = await fetch(`${API_BASE}/residences`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        const result = await handleResponse<{ deleted: number }>(response);
        return result.data!;
    },
};

// ============================================================================
// STUDENT API
// ============================================================================

export interface StudentData {
    id: string;
    studentId: string;
    cognitoSub?: string;
    title: string;
    initials: string;
    firstName: string;
    lastName: string;
    idNumber?: string;
    email: string;
    phone?: string;
    campus: string;
    campusId: string;
    faculty: string;
    facultyId?: string;
    facultyCode: string;
    department: string;
    departmentId: string;
    departmentCode: string;
    course: string;
    courseId?: string;
    courseCode: string;
    residence?: string;
    extracurricular?: string;
    modules: string[];
    academicEntries?: any[];
}

export const studentApi = {
     /**
      * Create a new student
      */
     create: async (student: Omit<StudentData, 'id'>): Promise<StudentData> => {
         const payload = {
             student_id: student.studentId,
             cognito_sub: student.cognitoSub || null,
             title: student.title || null,
             initials: student.initials || null,
             first_name: student.firstName,
             last_name: student.lastName,
             id_number: student.idNumber || null,
             email: student.email,
             phone: student.phone || null,
             campus_id: student.campusId || null,
             campus: student.campus || null,
             faculty: student.faculty || null,
             faculty_id: student.facultyId || null,
             faculty_code: student.facultyCode || null,
             department_id: student.departmentId || null,
             department: student.department || null,
             department_code: student.departmentCode || null,
             course: student.course || null,
             course_id: student.courseId || null,
             course_code: student.courseCode || null,
             residence: student.residence || null,
             extracurricular: student.extracurricular || null,
             modules: student.modules || [],
             academic_entries: student.academicEntries ? JSON.stringify(student.academicEntries) : null,
             image_url: student.image || null,
             user_type: 'student',
         };
         
         const response = await fetch(`${API_BASE}/students`, {
             method: 'POST',
             headers: getHeaders(),
             body: JSON.stringify(payload),
         });
         const result = await handleResponse<any>(response);
         return {
             id: result.data!.id,
             studentId: result.data!.studentId || result.data!.student_id,
             cognitoSub: result.data!.cognitoSub || result.data!.cognito_sub,
             title: result.data!.title,
             initials: result.data!.initials,
             firstName: result.data!.firstName || result.data!.first_name,
             lastName: result.data!.lastName || result.data!.last_name,
             idNumber: result.data!.idNumber || result.data!.id_number,
             email: result.data!.email,
             phone: result.data!.phone,
             campus: result.data!.campus,
             campusId: result.data!.campusId || result.data!.campus_id,
             faculty: result.data!.faculty,
             facultyId: result.data!.facultyId || result.data!.faculty_id,
             facultyCode: result.data!.facultyCode || result.data!.faculty_code,
             department: result.data!.department,
             departmentId: result.data!.departmentId || result.data!.department_id,
             departmentCode: result.data!.departmentCode || result.data!.department_code,
             course: result.data!.course,
             courseId: result.data!.courseId || result.data!.course_id,
             courseCode: result.data!.courseCode || result.data!.course_code,
             residence: result.data!.residence,
             extracurricular: result.data!.extracurricular,
             modules: result.data!.modules || [],
             academicEntries: typeof result.data!.academicEntries === 'string' 
                 ? JSON.parse(result.data!.academicEntries) 
                 : (result.data!.academicEntries || result.data!.academic_entries || []),
             image: result.data!.image_url || result.data!.image,
         };
     },

    /**
     * Get all students with optional filtering and pagination
     */
    list: async (
        campus = '',
        search = '',
        page = 1,
        limit = 20
    ): Promise<{ data: StudentData[]; count: number; total: number; page: number; limit: number }> => {
        const params = new URLSearchParams({
            ...(campus && { campus }),
            ...(search && { search }),
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await fetch(`${API_BASE}/students?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        
        const result = await handleResponse<any[]>(response);

         const transformedData: StudentData[] = result.data!.map((item: any) => ({
           id: item.id,
           studentId: item.studentId || item.student_id,
           cognitoSub: item.cognitoSub || item.cognito_sub,
           title: item.title,
           initials: item.initials,
           firstName: item.firstName || item.first_name,
           lastName: item.lastName || item.last_name,
           idNumber: item.idNumber || item.id_number,
           email: item.email,
           phone: item.phone,
           campus: item.campus,
           campusId: item.campusId || item.campus_id,
           faculty: item.faculty,
           facultyId: item.facultyId || item.faculty_id || item.faculty,
           facultyCode: item.facultyCode || item.faculty_code,
           department: item.department,
           departmentId: item.departmentId || item.department_id,
           departmentCode: item.departmentCode || item.department_code,
           course: item.course,
           courseId: item.courseId || item.course_id || item.course,
           courseCode: item.courseCode || item.course_code,
           residence: item.residence,
           extracurricular: item.extracurricular,
           modules: item.modules || [],
           academicEntries: typeof item.academicEntries === 'string'
               ? JSON.parse(item.academicEntries)
               : (item.academicEntries || item.academic_entries || []),
           image: item.image_url || item.image,
         }));

        return {
            data: transformedData,
            count: result.count!,
            total: result.total!,
            page: result.page!,
            limit: result.limit!,
        };
    },

    /**
     * Get a single student by ID
     */
    get: async (id: string): Promise<StudentData> => {
        const response = await fetch(`${API_BASE}/students/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const result = await handleResponse<any>(response);
        const item = result.data!;
        return {
            id: item.id,
            studentId: item.studentId || item.student_id,
            cognitoSub: item.cognitoSub || item.cognito_sub,
            title: item.title,
            initials: item.initials,
            firstName: item.firstName || item.first_name,
            lastName: item.lastName || item.last_name,
            idNumber: item.idNumber || item.id_number,
            email: item.email,
            phone: item.phone,
            campus: item.campus,
            campusId: item.campusId || item.campus_id,
            faculty: item.faculty,
            facultyId: item.facultyId || item.faculty_id || item.faculty,
            facultyCode: item.facultyCode || item.faculty_code,
            department: item.department,
            departmentId: item.departmentId || item.department_id,
            departmentCode: item.departmentCode || item.department_code,
            course: item.course,
            courseId: item.courseId || item.course_id || item.course,
            courseCode: item.courseCode || item.course_code,
            residence: item.residence,
            extracurricular: item.extracurricular,
            modules: item.modules || [],
        };
    },

     /**
      * Update a student
      */
     update: async (id: string, student: Partial<Omit<StudentData, 'id'>>): Promise<StudentData> => {
         const payload: any = {};
         if (student.studentId !== undefined) payload.student_id = student.studentId;
         if (student.cognitoSub !== undefined) payload.cognito_sub = student.cognitoSub;
         if (student.title !== undefined) payload.title = student.title;
         if (student.initials !== undefined) payload.initials = student.initials;
         if (student.firstName !== undefined) payload.first_name = student.firstName;
         if (student.lastName !== undefined) payload.last_name = student.lastName;
         if (student.idNumber !== undefined) payload.id_number = student.idNumber;
         if (student.email !== undefined) payload.email = student.email;
         if (student.phone !== undefined) payload.phone = student.phone || null;
         if (student.campusId !== undefined) payload.campus_id = student.campusId;
         if (student.campus !== undefined) payload.campus = student.campus;
         if (student.faculty !== undefined) payload.faculty = student.faculty;
         if (student.facultyId !== undefined) payload.faculty_id = student.facultyId;
         if (student.facultyCode !== undefined) payload.faculty_code = student.facultyCode;
         if (student.departmentId !== undefined) payload.department_id = student.departmentId;
         if (student.department !== undefined) payload.department = student.department;
         if (student.departmentCode !== undefined) payload.department_code = student.departmentCode;
         if (student.course !== undefined) payload.course = student.course;
         if (student.courseId !== undefined) payload.course_id = student.courseId;
         if (student.courseCode !== undefined) payload.course_code = student.courseCode;
         if (student.residence !== undefined) payload.residence = student.residence;
         if (student.extracurricular !== undefined) payload.extracurricular = student.extracurricular;
         if (student.modules !== undefined) payload.modules = student.modules;
         if (student.image !== undefined) payload.image_url = student.image || null;
         
         const response = await fetch(`${API_BASE}/students/${id}`, {
             method: 'PUT',
             headers: getHeaders(),
             body: JSON.stringify(payload),
         });
         const result = await handleResponse<any>(response);
         const item = result.data!;
         return {
             id: item.id,
             studentId: item.studentId || item.student_id,
             cognitoSub: item.cognitoSub || item.cognito_sub,
             title: item.title,
             initials: item.initials,
             firstName: item.firstName || item.first_name,
             lastName: item.lastName || item.last_name,
             idNumber: item.idNumber || item.id_number,
             email: item.email,
             phone: item.phone,
             campus: item.campus,
             campusId: item.campusId || item.campus_id,
             faculty: item.faculty,
             facultyCode: item.facultyCode || item.faculty_code,
             department: item.department,
             departmentId: item.departmentId || item.department_id,
             departmentCode: item.departmentCode || item.department_code,
             course: item.course,
             courseCode: item.courseCode || item.course_code,
             residence: item.residence,
             extracurricular: item.extracurricular,
             modules: item.modules || [],
             academicEntries: typeof item.academicEntries === 'string' 
                 ? JSON.parse(item.academicEntries) 
                 : (item.academicEntries || item.academic_entries || []),
             image: item.image_url || item.image,
         };
     },

    /**
     * Delete a single student
     */
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/students/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(response);
    },

    /**
     * Delete multiple students (batch delete)
     */
    batchDelete: async (ids: string[]): Promise<{ deleted: number }> => {
        const response = await fetch(`${API_BASE}/students`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        const result = await handleResponse<{ deleted: number }>(response);
        return result.data!;
    },
};
