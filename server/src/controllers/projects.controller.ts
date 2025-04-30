import { Request, Response } from 'express';
import { Project } from '../interface/project';
import { StudentProject } from '../interface/studentProject';
import pool from "../config/mysql.config";
import { QUERY } from '../query/projects.query';
import { R_QUERY } from '../query/resources.query';
import { Code } from '../enum/code.enum';
import { Status } from '../enum/status.enum';
import { HttpResponse } from '../domain/response';
import { FieldPacket, OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2';
import { getStudyYear, formatDate } from '../utils/dateUtils';
import exp from 'constants';
import e from 'cors';

type ResultSet = [RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader, FieldPacket[]];

// const formatDate = (date: Date): string => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// };

export const getProjects = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await pool.query(QUERY.SELECT_PROJECTS);
        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Projects fetched successfully', result[0]));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while fetching projects'));
    } finally {
        if (connection) connection.release();
    }
};



// Update createProject function

export const createProject = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleString()}] Incoming ${req.method}${req.originalUrl} Request from ${req.rawHeaders[1]}`);
    let project: Project = { ...req.body };
    let connection: any;
    project.start_date = new Date(formatDate(new Date(project.start_date)));
    project.end_date = new Date(formatDate(new Date(project.end_date)));

    try {
        connection = await pool.getConnection();

        // Create the project
        const result: ResultSet = await pool.query(QUERY.CREATE_PROJECT, Object.values(project));
        project = { project_id: (result[0] as ResultSetHeader).insertId, ...req.body };

        // If a teacher is assigned, increment their resource usage
        if (project.teacher_id) {
            const studyYear = getStudyYear(new Date(project.start_date));

            // Check if the teacher has resources for this year
            const [resources] = await connection.query(
                `SELECT * FROM resources
                 WHERE teacher_id = ? AND study_year = ?`,
                [project.teacher_id, studyYear]
            );

            // Only increment if resources exist and haven't reached the limit
            if (resources && resources.length > 0 &&
                resources[0].used_resources < resources[0].total_resources) {
                await connection.query(R_QUERY.INCREMENT_RESOURCE_USAGE,
                    [project.teacher_id, studyYear]
                );
            }
        }

        return res.status(Code.CREATED)
            .send(new HttpResponse(Code.CREATED, Status.CREATED, 'Project created successfully', project));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while creating project'));
    } finally {
        if (connection) connection.release();
    }
};


// Update updateProject function to handle teacher changes
export const updateProject = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleString()}] Incoming ${req.method}${req.originalUrl} Request from ${req.rawHeaders[1]}`);
    let project: Project = { ...req.body };
    project.start_date = new Date(formatDate(new Date(project.start_date)));
    project.end_date = new Date(formatDate(new Date(project.end_date)));
    let connection: any;

    try {
        connection = await pool.getConnection();

        // Get the original project to check for teacher ID changes
        const [originalProject] = await connection.query(QUERY.SELECT_PROJECT, [req.params.project_id]);

        if (!originalProject || originalProject.length === 0) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'Project not found'));
        }

        const originalTeacherId = originalProject[0].teacher_id;
        const newTeacherId = project.teacher_id;

        // Update the project
        await connection.query(QUERY.UPDATE_PROJECT, [...Object.values(project), req.params.project_id]);

        // If teacher has changed, update resources
        if (originalTeacherId !== newTeacherId) {
            const studyYear = getStudyYear(new Date(project.start_date));

            // Decrement previous teacher's resources
            if (originalTeacherId) {
                await connection.query(R_QUERY.DECREMENT_RESOURCE_USAGE, [originalTeacherId, studyYear]);
            }

            // Increment new teacher's resources
            if (newTeacherId) {
                // Check if the teacher has resources for this year
                const [resources] = await connection.query(
                    `SELECT * FROM resources 
                     WHERE teacher_id = ? AND study_year = ?`,
                    [newTeacherId, studyYear]
                );

                // Only increment if resources exist and haven't reached the limit
                if (resources && resources.length > 0 &&
                    resources[0].used_resources < resources[0].total_resources) {
                    await connection.query(R_QUERY.INCREMENT_RESOURCE_USAGE, [newTeacherId, studyYear]);
                }
            }
        }

        project = { project_id: parseInt(req.params.project_id), ...req.body };
        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Project updated successfully', project));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while updating project'));
    } finally {
        if (connection) connection.release();
    }
};

// Update  deleteProject function to decrement resources
export const deleteProject = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleString()}] Incoming ${req.method}${req.originalUrl} Request from ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();

        // Get the project details before deletion to find the teacher
        const [project] = await connection.query(QUERY.SELECT_PROJECT, [req.params.project_id]);

        if (!project || project.length === 0) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'Project not found'));
        }

        // Extract teacher ID and start date before deleting
        const teacherId = project[0].teacher_id;
        const startDate = new Date(project[0].start_date);

        // Delete the project and related data
        const result: ResultSet = await pool.query(QUERY.DELETE_PROJECT_BY_ID, [req.params.project_id]);
        const result2: ResultSet = await pool.query(QUERY.DELETE_STUDENT_PROJECT_BY_PROJECT_ID, [req.params.project_id]);
        const result3: ResultSet = await pool.query(QUERY.DELETE_PROJECT_NOTES_BY_PROJECT_ID, [req.params.project_id]);

        // Decrement teacher resources if applicable
        if (teacherId) {
            const studyYear = getStudyYear(startDate);
            await connection.query(R_QUERY.DECREMENT_RESOURCE_USAGE, [teacherId, studyYear]);
        }

        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Project deleted successfully'));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while deleting project'));
    } finally {
        if (connection) connection.release();
    }
};

export const getStudentProjects = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleString()}] Incoming ${req.method}${req.originalUrl} Request from ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await pool.query(QUERY.SELECT_STUDENT_PROJECTS);
        if ((result[0] as Array<ResultSet>).length === 0) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'No student_projects found'));
        } else
            return res.status(Code.OK)
                .send(new HttpResponse(Code.OK, Status.OK, 'Student projects fetched successfully', result[0]));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while fetching student projects'));
    } finally {
        if (connection) connection.release();
    }
};

export const createStudentProject = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleString()}] Incoming ${req.method}${req.originalUrl} Request from ${req.rawHeaders[1]}`);
    let studentProject: StudentProject = { ...req.body };
    let projectNumber: number;
    let connection: any;
    try {
        connection = await pool.getConnection();
        const previousProjects: ResultSet = await pool.query(QUERY.SELECT_STUDENT_PROJECTS_BY_STUDENT_ID, [studentProject.student_id]);
        if ((previousProjects[0] as Array<ResultSet>).length === 0) {
            projectNumber = 1;
        } else {
            projectNumber = (previousProjects[0] as Array<ResultSet>).length + 1;
        }
        studentProject.project_number = projectNumber;
        const result: ResultSet = await pool.query(QUERY.CREATE_STUDENT_PROJECT, Object.values(studentProject));
        return res.status(Code.CREATED)
            .send(new HttpResponse(Code.CREATED, Status.CREATED, 'Student project created successfully', studentProject));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while creating student project'));
    } finally {
        if (connection) connection.release();
    }
};

export const addProjectNote = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleString()}] Incoming ${req.method}${req.originalUrl} Request from ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await pool.query(QUERY.INSERT_PROJECT_NOTE, [req.params.project_id, req.body.note, req.body.document_path, req.body.created_by]);
        return res.status(Code.CREATED)
            .send(new HttpResponse(Code.CREATED, Status.CREATED, 'Project note added successfully', req.body));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while adding project note'));
    } finally {
        if (connection) connection.release();
    }
};

export const getProjectNotes = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleString()}] Incoming ${req.method}${req.originalUrl} Request from ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await pool.query(QUERY.SELECT_PROJECT_NOTES, [req.params.project_id]);
        if ((result[0] as Array<ResultSet>).length === 0) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'No notes found'));
        } else
            return res.status(Code.OK)
                .send(new HttpResponse(Code.OK, Status.OK, 'Notes fetched successfully', result[0]));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while fetching notes'));
    } finally {
        if (connection) connection.release();
    }
};

export const deleteProjectNote = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleString()}] Incoming ${req.method}${req.originalUrl} Request from ${req.rawHeaders[1]}`);
    let connection: any;
    const { note_id, project_id } = req.params;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await pool.query(QUERY.DELETE_PROJECT_NOTE, [note_id, project_id]);
        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Note deleted successfully'));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while deleting note'));
    } finally {
        if (connection) connection.release();
    }
}
