CREATE DATABASE IF NOT EXISTS project_ms;
USE project_ms;



-- -----------------------------------------------------
-- Table `companies`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
                           company_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                           company_name VARCHAR(255) NOT NULL,
                           industry VARCHAR(100) NULL,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           PRIMARY KEY (company_id),
                           INDEX idx_companies_industry (industry)
) AUTO_INCREMENT = 1;

-- -----------------------------------------------------
-- Table `teachers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
                          teacher_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                          teacher_name VARCHAR(127) NOT NULL,
                          version INT UNSIGNED DEFAULT 1,
                          email VARCHAR(127) NOT NULL,
                          active BOOLEAN DEFAULT TRUE,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          PRIMARY KEY (teacher_id),
                          UNIQUE KEY uk_teachers_email (email),
                          INDEX idx_teachers_active (active),
                          INDEX idx_teachers_email_covering (email, teacher_id)
) AUTO_INCREMENT = 1;

-- -----------------------------------------------------
-- Table `students`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
                          student_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                          student_name VARCHAR(127) NOT NULL,
                          email VARCHAR(127) NOT NULL,
                          class_code VARCHAR(25) NULL,
                          current_projects TINYINT UNSIGNED DEFAULT 0 NOT NULL,
                          active BOOLEAN DEFAULT TRUE,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          version INT UNSIGNED DEFAULT 1,
                          PRIMARY KEY (student_id),
                          UNIQUE KEY uk_students_email (email),
                          INDEX idx_students_class_code (class_code),
                          INDEX idx_students_active (active),
                          INDEX idx_students_project_counts (current_projects)

) AUTO_INCREMENT = 1;

-- -----------------------------------------------------
-- Table `projects`
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
                                        project_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                        project_name VARCHAR(255) NOT NULL,
                                        project_desc TEXT,
                                        teacher_id INT UNSIGNED NULL,
                                        company_id INT UNSIGNED NULL,
                                        project_status ENUM('pending', 'ongoing', 'completed') DEFAULT 'pending',
                                        project_url VARCHAR(255) NULL,
                                        study_year VARCHAR(10) NOT NULL,
                                        start_date DATE NOT NULL,
                                        end_date DATE NOT NULL,
                                        completed_at TIMESTAMP NULL,
                                        max_students TINYINT UNSIGNED DEFAULT 8,
                                        current_students TINYINT UNSIGNED DEFAULT 0,
                                        active BOOLEAN DEFAULT TRUE,
                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        version INT UNSIGNED DEFAULT 1,
                                        PRIMARY KEY (project_id),
                                        FOREIGN KEY fk_projects_teacher (teacher_id) REFERENCES teachers(teacher_id) ON DELETE RESTRICT ON UPDATE CASCADE,
                                        FOREIGN KEY fk_projects_company (company_id) REFERENCES companies(company_id) ON DELETE RESTRICT ON UPDATE CASCADE,
                                        CONSTRAINT chk_project_dates CHECK (end_date > start_date),
                                        CONSTRAINT chk_project_capacity CHECK (current_students <= max_students),
                                        INDEX idx_projects_teacher (teacher_id),
                                        INDEX idx_projects_company (company_id),
                                        INDEX idx_projects_status (project_status),
                                        INDEX idx_projects_study_year (study_year),
                                        INDEX idx_projects_dates (start_date, end_date),
                                        INDEX idx_projects_active (active),
                                        INDEX idx_projects_company_year (company_id, study_year),
                                        INDEX idx_projects_teacher_year (teacher_id, study_year),
                                        INDEX idx_projects_status_year (project_status, study_year),
                                        INDEX idx_student_project_completion (completed_at),
                                        INDEX idx_projects_status_capacity (project_status, current_students, max_students),
                                        INDEX idx_projects_teacher_status (teacher_id, project_status, study_year),
                                        INDEX idx_projects_company_status (company_id, project_status, study_year),
                                        INDEX idx_projects_list_covering (project_id, teacher_id, project_name, project_status)
) AUTO_INCREMENT = 1;

-- -----------------------------------------------------
-- Table `resources`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS resources (
                           resource_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                           teacher_id INT UNSIGNED NOT NULL,
                           total_resources SMALLINT UNSIGNED DEFAULT 0,
                           used_resources SMALLINT UNSIGNED DEFAULT 0,
                           study_year VARCHAR(10) NOT NULL,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           PRIMARY KEY (resource_id),
                           FOREIGN KEY fk_resources_teacher (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE ON UPDATE CASCADE,
                           UNIQUE KEY uk_resources_teacher_year_type (teacher_id, study_year),  -- Prevent duplicates
                           INDEX idx_resources_study_year (study_year),
                           INDEX idx_resources_usage (used_resources, total_resources) -- For capacity queries
) AUTO_INCREMENT = 1;

-- -----------------------------------------------------
-- Table `student_project` (Many-to-Many)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS student_project (
                                               student_id INT UNSIGNED NOT NULL,
                                               project_id INT UNSIGNED NOT NULL,
                                               PRIMARY KEY (student_id, project_id),
                                               FOREIGN KEY fk_student_project_student (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
                                               FOREIGN KEY fk_student_project_project (project_id) REFERENCES projects(project_id) ON DELETE CASCADE ON UPDATE CASCADE,
                                               INDEX idx_student_project_project (project_id),
                                               INDEX idx_student_active_projects (student_id, project_id)
);

-- -----------------------------------------------------
-- Table `company_teacher` (Many-to-Many)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS company_teacher (
                                 company_id INT UNSIGNED NOT NULL,
                                 teacher_id INT UNSIGNED NOT NULL,
                                 active BOOLEAN DEFAULT TRUE,
                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 PRIMARY KEY (company_id, teacher_id),
                                 FOREIGN KEY fk_company_teacher_company (company_id) REFERENCES companies(company_id) ON DELETE CASCADE ON UPDATE CASCADE,
                                 FOREIGN KEY fk_company_teacher_teacher (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE ON UPDATE CASCADE,
                                 INDEX idx_company_teacher_active (active),
                                 INDEX idx_company_teacher_teacher (teacher_id)  -- For teacher-based queries
);

-- -----------------------------------------------------
-- Table `project_note`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_note (
                                            note_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                            project_id INT UNSIGNED NOT NULL,
                                            note_type ENUM('text', 'link', 'feedback', 'milestone') DEFAULT 'text',
                                            note_title VARCHAR(127) NULL ,
                                            note_content TEXT NOT NULL ,
                                            note_url VARCHAR(500),
                                            created_by_name VARCHAR(127) NOT NULL,
                                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            PRIMARY KEY (note_id),
                                            FOREIGN KEY fk_project_note_project (project_id) REFERENCES projects(project_id) ON DELETE CASCADE ON UPDATE CASCADE,
                                            INDEX idx_project_note_project (project_id),
                                            INDEX idx_project_note_type (note_type),
                                            INDEX idx_project_note_created (created_at)
) AUTO_INCREMENT = 1;


CREATE TABLE IF NOT EXISTS notifications (
                                             notification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                             recipient_type ENUM('student', 'teacher') NOT NULL,
                                             recipient_id INT UNSIGNED NOT NULL,
                                             notification_type VARCHAR(50) NOT NULL, -- 'project_note_added', 'project_teacher_changed', etc.
                                             entity_type VARCHAR(20) NOT NULL, -- 'project', 'resource', 'profile', etc.
                                             entity_id INT UNSIGNED NOT NULL,
                                             title VARCHAR(255) NOT NULL,
                                             message TEXT NOT NULL,
                                             data JSON NULL, -- Store additional context (old_value, new_value, etc.)
                                             priority TINYINT UNSIGNED DEFAULT 1, -- 1=low, 2=medium, 3=high
                                             is_read BOOLEAN DEFAULT FALSE,
                                             is_email_sent BOOLEAN DEFAULT FALSE,
                                             read_at TIMESTAMP NULL,
                                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                             expires_at TIMESTAMP NULL, -- Auto-cleanup old notifications
                                             PRIMARY KEY (notification_id),
                                             INDEX idx_notifications_recipient (recipient_type, recipient_id, is_read, created_at),
                                             INDEX idx_notifications_entity (entity_type, entity_id),
                                             INDEX idx_notifications_type_priority (notification_type, priority),
                                             INDEX idx_notifications_email_pending (is_email_sent, priority, created_at),
                                             INDEX idx_notifications_cleanup (expires_at)
) AUTO_INCREMENT = 1;

-- -----------------------------------------------------
-- Table `notification_preferences`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_preferences (
                                                        preference_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                                        user_type ENUM('student', 'teacher') NOT NULL,
                                                        user_id INT UNSIGNED NOT NULL,
                                                        notification_type VARCHAR(50) NOT NULL,
                                                        email_enabled BOOLEAN DEFAULT FALSE,
                                                        in_app_enabled BOOLEAN DEFAULT FALSE,
                                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                                        PRIMARY KEY (preference_id),
                                                        UNIQUE KEY uk_preferences_user_type (user_type, user_id, notification_type),
                                                        INDEX idx_preferences_user (user_type, user_id)
) AUTO_INCREMENT = 1;



-- Automatically set completion date when project status changes to completed
DELIMITER //
CREATE TRIGGER update_counts_after_insert
    AFTER INSERT ON student_project
    FOR EACH ROW
BEGIN
    -- Update student's current project count
    UPDATE students
    SET current_projects = current_projects + 1
    WHERE student_id = NEW.student_id;

    -- Update project's current student count
    UPDATE projects
    SET current_students = current_students + 1
    WHERE project_id = NEW.project_id;
END//


CREATE TRIGGER update_counts_after_delete
    AFTER DELETE ON student_project
    FOR EACH ROW
BEGIN
    -- Update student's current project count
    UPDATE students
    SET current_projects = current_projects - 1
    WHERE student_id = OLD.student_id;

    -- Update project's current student count
    UPDATE projects
    SET current_students = current_students - 1
    WHERE project_id = OLD.project_id;
END//

CREATE TRIGGER IF NOT EXISTS set_completion_date
    BEFORE UPDATE ON projects
    FOR EACH ROW
BEGIN
    IF NEW.project_status = 'completed' AND OLD.project_status != 'completed' THEN
        SET NEW.completed_at = CURRENT_TIMESTAMP;
    END IF;
END//
DELIMITER ;




-- -----------------------------------------------------
-- Sample Data
-- -----------------------------------------------------


INSERT INTO companies (company_name, industry) VALUES
                                                                 ('Google LLC', 'Technology'),
                                                                 ('Nokia Corporation', 'Telecommunications'),
                                                                 ('Microsoft Corporation', 'Technology'),
                                                                 ('Rovio Entertainment', 'Gaming');

-- Insert sample teachers
INSERT INTO teachers (teacher_name, email) VALUES
                                                           ('Dr. Jane Smith', 'jane.smith@uni.fi'),
                                                           ('Prof. John Doe', 'john.doe@uni.fi'),
                                                           ('Dr. Maria Garcia', 'maria.garcia@uni.fi');

-- Insert sample students
INSERT INTO students (student_name, email, class_code) VALUES
                                                                       ('Alice Johnson', 'alice.johnson@student.fi', null),
                                                                       ('Bob Wilson', 'bob.wilson@student.fi', 'DVP23SP'),
                                                                       ('Carol Davis', 'carol.davis@student.fi', 'DVP22SP'),
                                                                       ('David Brown', 'david.brown@student.fi', 'DVP21SP');

-- Insert sample resources
INSERT INTO resources (teacher_id, total_resources, used_resources, study_year) VALUES
                                                                                                   (1, 10, 3, '2024-2025'),
                                                                                                   (2, 8, 2, '2024-2025'),
                                                                                                   (3, 12, 4, '2024-2025');

-- Insert company-teacher relationships
INSERT INTO company_teacher (company_id, teacher_id) VALUES
                                                                            (1, 1),
                                                                            (2, 2),
                                                                            (3, 1),
                                                                            (4, 3),
                                                                            (1, 3);

-- Insert sample projects
INSERT INTO projects (project_name, project_desc, teacher_id, company_id, project_status, study_year, start_date, end_date, max_students) VALUES
                                                                                                                                              ('AI Chatbot Development', 'Develop an AI-powered customer service chatbot', 1, 1, 'ongoing', '2024-2025', '2024-09-01', '2024-12-15', 2),
                                                                                                                                              ('5G Network Optimization', 'Optimize 5G network performance for urban areas', 2, 2, 'pending', '2024-2025', '2024-10-01', '2025-01-31', 3),
                                                                                                                                              ('Cloud Migration Strategy', 'Develop migration strategy for legacy systems', 1, 3, 'completed', '2023-2024', '2024-01-15', '2024-05-30', 1),
                                                                                                                                              ('Mobile Game Analytics', 'Implement analytics dashboard for mobile games', 3, 4, 'ongoing', '2024-2025', '2024-08-15', '2024-11-30', 2);

-- Insert student-project assignments
INSERT INTO student_project (student_id, project_id) VALUES
                                                                                 (1, 1),
                                                                                 (2, 1),
                                                                                 (3, 3),
                                                                                 (4, 4);

-- Insert sample notes
INSERT INTO project_note (project_id, note_type, note_title, note_content, created_by_name) VALUES
                                                                                                                                (1, 'milestone', 'Project Kickoff', 'Initial project meeting completed successfully',  'Dr. Jane Smith'),
                                                                                                                                (1, 'link', 'Project Repository', '',  'Alice Johnson'),
                                                                                                                                (2, 'text', 'Requirements Review', 'Need to clarify technical requirements with Nokia team',  'Prof. John Doe'),
                                                                                                                                (4, 'feedback', 'Progress Update', 'Good progress on dashboard wireframes',  'Dr. Maria Garcia');

-- Update the note_url for the link type note
UPDATE project_note SET note_url = 'https://github.com/company/ai-chatbot' WHERE note_id = 2;