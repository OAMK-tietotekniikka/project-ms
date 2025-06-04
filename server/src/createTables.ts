import pool from "./config/mysql.config";

//This is for the creation of tables in the CSC OpenShift Rahti2 MySql database

const createTables = async () => {
    let connection;
    try {
        connection = await pool.getConnection();

        if (!connection) {
            throw new Error('Failed to get database connection pool');
        }

        //delete tables if they exist
        await connection.execute('DROP TABLE IF EXISTS student_project');
        await connection.execute('DROP TABLE IF EXISTS company_teacher');
        await connection.execute('DROP TABLE IF EXISTS project_note');
        await connection.execute('DROP TABLE IF EXISTS resources');
        await connection.execute('DROP TABLE IF EXISTS projects'); // Depends on teachers, companies
        await connection.execute('DROP TABLE IF EXISTS students');
        await connection.execute('DROP TABLE IF EXISTS teachers');
        await connection.execute('DROP TABLE IF EXISTS companies');

        
        //create tables
        await connection.execute(
            `CREATE TABLE IF NOT EXISTS companies (
            company_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            company_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (company_id)
        )`);

        await connection.execute(`CREATE TABLE IF NOT EXISTS teachers (
            teacher_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            teacher_name VARCHAR(100) DEFAULT NOT NULL,
            email VARCHAR(100) DEFAULT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (teacher_id),
            UNIQUE (email)
        )`);

        await connection.execute(`CREATE TABLE IF NOT EXISTS projects (
            project_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            project_name VARCHAR(100) DEFAULT NOT NULL,
            project_desc TEXT DEFAULT NULL,
            teacher_id INT UNSIGNED DEFAULT NULL,
            company_id INT UNSIGNED DEFAULT NULL,
            project_status ENUM('pending', 'ongoing', 'completed') DEFAULT 'pending',
            project_url VARCHAR(255) DEFAULT NULL,         
            start_date DATE DEFAULT NULL,
            end_date DATE DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (project_id),
            Foreign Key (teacher_id) REFERENCES teachers(teacher_id),
            Foreign Key (company_id) REFERENCES companies(company_id)
        )`);

        await connection.execute(`CREATE INDEX idx_projects_teacher_id ON projects (teacher_id)`);
        await connection.execute(`CREATE INDEX idx_projects_company_id ON projects (company_id)`);


        await connection.execute(`CREATE TABLE IF NOT EXISTS students (
            student_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            student_name VARCHAR(100) DEFAULT NOT NULL,
            email VARCHAR(100) DEFAULT NOT NULL,
            class_code VARCHAR(25) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (student_id),
            UNIQUE (email)
        )`);

        await connection.execute(`CREATE INDEX idx_students_class_code ON students (class_code)`);


        await connection.execute(`CREATE TABLE IF NOT EXISTS resources (
            resource_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            teacher_id INT UNSIGNED DEFAULT NULL,
            total_resources INT DEFAULT NULL,
            used_resources INT DEFAULT NULL,
            study_year VARCHAR(25) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (resource_id),
            Foreign Key (teacher_id) REFERENCES teachers(teacher_id)
        )`);

        await connection.execute(`CREATE TABLE IF NOT EXISTS project_note (
            note_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            project_id INT UNSIGNED DEFAULT NULL,
            note VARCHAR(200) DEFAULT NULL,
            document_path VARCHAR(255) DEFAULT NULL,
            created_by VARCHAR(100) DEFAULT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (note_id),
            Foreign Key (project_id) REFERENCES projects (project_id)
        )`);

        await connection.execute(`CREATE INDEX idx_project_note_project_id ON project_note (project_id)`);

        await connection.execute(`CREATE TABLE IF NOT EXISTS student_project (
            student_id INT UNSIGNED NOT NULL,
            project_id INT UNSIGNED NOT NULL,
            PRIMARY KEY (student_id, project_id),
            FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE ON UPDATE CASCADE
        )`);    

        await connection.execute(`CREATE TABLE IF NOT EXISTS company_teacher (
            company_id INT UNSIGNED NOT NULL,
            teacher_id INT UNSIGNED NOT NULL,
            PRIMARY KEY (company_id, teacher_id),
            FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE ON UPDATE CASCADE
        )`);

        //add dummy data to tables

        await connection.execute(`INSERT INTO companies (company_name) VALUES ('Google')`);
        await connection.execute(`INSERT INTO companies (company_name) VALUES ('Nokia')`);
        await connection.execute(`INSERT INTO companies (company_name) VALUES ('Microsoft')`);

        await connection.execute(`INSERT INTO teachers (teacher_name, email) VALUES ('Teacher One', 'teacher1@mail.com')`);
        await connection.execute(`INSERT INTO teachers (teacher_name, email) VALUES ('Teacher Two', 'teacher2@mail.com')`);

        await connection.execute(`INSERT INTO students (student_name, email, class_code) VALUES ('John Doe', 'john@mail.com', 'din23sp')`);
        await connection.execute(`INSERT INTO students (student_name, email, class_code) VALUES ('Jane Doe', 'jane@mail.com', 'din21sp')`);

        await connection.execute(`INSERT INTO resources (teacher_id, total_resources, used_resources, study_year) VALUES (1, 10, 7, '2021-2022')`);
        await connection.execute(`INSERT INTO resources (teacher_id, total_resources, used_resources, study_year) VALUES (1, 7, 7, '2022-2023')`);
        await connection.execute(`INSERT INTO resources (teacher_id, total_resources, used_resources, study_year) VALUES (1, 7, 1, '2023-2024')`);
        await connection.execute(`INSERT INTO resources (teacher_id, total_resources, used_resources, study_year) VALUES (2, 5, 5, '2023-2024')`);
        await connection.execute(`INSERT INTO resources (teacher_id, total_resources, used_resources, study_year) VALUES (2, 5, 2, '2024-2025')`);
        await connection.execute(`INSERT INTO resources (teacher_id, total_resources, used_resources, study_year) VALUES (1, 5, 2, '2024-2025')`);
        
        await connection.execute(`INSERT INTO company_teacher (company_id, teacher_id) VALUES (1, 1)`);
        await connection.execute(`INSERT INTO company_teacher (company_id, teacher_id) VALUES (2, 2)`);
        await connection.execute(`INSERT INTO company_teacher (company_id, teacher_id) VALUES (3, 1)`);

        await connection.execute(`INSERT INTO projects (project_name, project_desc, teacher_id, company_id, project_status, project_url, start_date, end_date) VALUES ('Project One', 'Project One Description', 1, 1, 'ongoing', 'http://projectone.com', '2024-09-08', '2024-12-30')`);
        await connection.execute(`INSERT INTO projects (project_name, project_desc, teacher_id, company_id, project_status, project_url, start_date, end_date) VALUES ('Project Two', 'Project Two Description', 2, 2, 'completed', 'http://projecttwo.com', '2024-08-08', '2024-10-30')`);

        await connection.execute(`INSERT INTO student_project (student_id, project_id) VALUES (1, 1)`);
        await connection.execute(`INSERT INTO student_project (student_id, project_id) VALUES (2, 2)`);
        
        console.log('Tables created successfully');
    } catch (error) {
        console.error(`Table creation failed: [${new Date().toLocaleDateString()}] ${error}`);
    } finally {
        if (connection) connection.release(); 
    }
};

export default createTables;