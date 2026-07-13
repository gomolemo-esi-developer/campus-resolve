-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Campuses
CREATE INDEX idx_campuses_name ON campuses(name);
CREATE INDEX idx_campuses_abbreviation ON campuses(abbreviation);

-- Faculties
CREATE INDEX idx_faculties_name ON faculties(name);
CREATE INDEX idx_faculties_abbreviation ON faculties(abbreviation);

-- Departments
CREATE INDEX idx_departments_faculty_id ON departments(faculty_id);
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_abbreviation ON departments(abbreviation);

-- Courses
CREATE INDEX idx_courses_department_id ON courses(department_id);
CREATE INDEX idx_courses_faculty_id ON courses(faculty_id);
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_name ON courses(name);

-- Modules
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_code ON modules(code);

-- Roles
CREATE INDEX idx_roles_level ON roles(level);
CREATE INDEX idx_roles_role ON roles(role);

-- Staff
CREATE INDEX idx_staff_campus_id ON staff(campus_id);
CREATE INDEX idx_staff_department_id ON staff(department_id);
CREATE INDEX idx_staff_staff_id ON staff(staff_id);
CREATE INDEX idx_staff_email ON staff(email);

-- Residences
CREATE INDEX idx_residences_campus_id ON residences(campus_id);
CREATE INDEX idx_residences_residence_type ON residences(residence_type);

-- Extracurriculars
CREATE INDEX idx_extracurriculars_category ON extracurriculars(category);
CREATE INDEX idx_extracurriculars_department_id ON extracurriculars(department_id);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Users Sync
CREATE INDEX idx_users_sync_cognito_sub ON users_sync(cognito_sub);
CREATE INDEX idx_users_sync_cognito_email ON users_sync(cognito_email);
