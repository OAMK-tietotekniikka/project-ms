import { Request, Response } from "express";
import { Resource } from "../interface/resource";
import pool from "../config/mysql.config";
import { Code } from "../enum/code.enum";
import { Status } from "../enum/status.enum";
import { HttpResponse } from "../domain/response";
import { ResultSetHeader, RowDataPacket, FieldPacket, OkPacket } from "mysql2";
import { R_QUERY } from "../query/resources.query";
import { getStudyYear, formatDate } from "../utils/dateUtils";
import { Teacher } from "../interface/teacher";

type ResultSet = [RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader, FieldPacket[]];

export const getResources = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[0]} ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await pool.query(R_QUERY.SELECT_RESOURCES);
        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Resources fetched successfully', result[0]));
    }
    catch (error: unknown) {
        console.error(`[${new Date().toLocaleDateString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while fetching resources'));

    } finally {
        if (connection) connection.release();
    }
};

export const createResource = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[0]} ${req.rawHeaders[1]}`);
    let resource: Resource = { ...req.body };
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await pool.query(R_QUERY.CREATE_RESOURCE, Object.values(resource));
        resource = { resource_id: (result[0] as ResultSetHeader).insertId, ...req.body };
        return res.status(Code.CREATED)
            .send(new HttpResponse(Code.CREATED, Status.CREATED, 'Resource created successfully', resource));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleDateString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while creating resource'));
    } finally {
        if (connection) connection.release();
    }
};

export const updateResource = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[0]} ${req.rawHeaders[1]}`);
    let resource: Resource = { ...req.body };
    let connection: any;
    try {
        connection = await pool.getConnection();
        const findResource: ResultSet = await pool.query(R_QUERY.SELECT_RESOURCE, [req.params.resource_id]);
        if ((findResource[0] as RowDataPacket[]).length === 0) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'Resource not found for the provided id'));
        } else {
            const result: ResultSet = await pool.query(R_QUERY.UPDATE_RESOURCE, [
                resource.teacher_id,
                resource.total_resources,
                resource.used_resources,
                resource.study_year,
                req.params.resource_id
            ]);
            return res.status(Code.OK)
                .send(new HttpResponse(Code.OK, Status.OK, 'Resource updated successfully', resource));
        }
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleDateString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while updating resource'));
    }
};

// Add these new controller functions

/**
 * Allocates a teacher for a project based on resources and company preferences
 * prioritizes assigned teachers for continuity
 */
export const allocateTeacher = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request - Allocate Teacher`);
    const { companyName, startDate, studentId } = req.body; // Add studentId parameter
    let connection: any;
    
    if (!companyName || !startDate) {
        return res.status(Code.BAD_REQUEST)
            .send(new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, 'Company name and start date are required'));
    }
    
    try {
        // Get the study year from the start date
        const date = new Date(startDate);
        const studyYear = getStudyYear(date);
        
        connection = await pool.getConnection();
        
        // 0. If studentId is provided, check if student has previous projects
        let previousTeacherId = null;
        if (studentId) {
            // Find previous projects of this student
            const [studentProjects] = await connection.query(`
                SELECT p.teacher_id
                FROM projects p
                JOIN student_project sp ON p.project_id = sp.project_id
                WHERE sp.student_id = ?
                ORDER BY p.created_at DESC
            `, [studentId]);
            
            if (studentProjects && studentProjects.length > 0) {
                previousTeacherId = studentProjects[0].teacher_id;
                
                // Check if this teacher has resources available for this study year
                const [teacherResources] = await connection.query(`
                    SELECT r.*
                    FROM resources r
                    WHERE r.teacher_id = ? AND r.study_year = ? AND r.used_resources < r.total_resources
                `, [previousTeacherId, studyYear]);
                
                if (teacherResources && teacherResources.length > 0) {
                    // Return the previous teacher
                    const [teacherDetails] = await connection.query(`
                        SELECT r.*, t.teacher_name, t.email 
                        FROM resources r
                        JOIN teachers t ON r.teacher_id = t.teacher_id
                        WHERE r.teacher_id = ? AND r.study_year = ?
                    `, [previousTeacherId, studyYear]);
                    
                    if (teacherDetails && teacherDetails.length > 0) {
                        return res.status(Code.OK)
                            .send(new HttpResponse(Code.OK, Status.OK, 'Previous teacher allocated successfully', teacherDetails[0]));
                    }
                }
                // If previous teacher has no resources, continue with normal allocation
            }
        }
        
        // 1. Get all resources for the study year where used_resources < total_resources
        const [resourcesForYear] = await connection.query(R_QUERY.SELECT_RESOURCES_BY_STUDY_YEAR, [studyYear]);
        
        if (!resourcesForYear || resourcesForYear.length === 0) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 
                    `No teacher resources available for the academic year: ${studyYear}`));
        }
        
        // 2. Check if any teachers have this company as a favorite
        const [teachersWithFavorite] = await connection.query(
            R_QUERY.SELECT_TEACHERS_WITH_COMPANY_FAVORITE, 
            [companyName]
        );
        
        let selectedTeacher = null;
        
        // 3. If there are teachers with this company as favorite, select the one with least used resources
        if (teachersWithFavorite && teachersWithFavorite.length > 0) {
            const favoriteTeacherIds = teachersWithFavorite.map((t: Teacher) => t.teacher_id);
            
            // Find the first teacher who has resources and has the company as favorite
            for (const resource of resourcesForYear) {
                if (favoriteTeacherIds.includes(resource.teacher_id)) {
                    selectedTeacher = resource;
                    break;
                }
            }
        }
        
        // 4. If no teachers with this company as favorite, select the teacher with least used resources
        if (!selectedTeacher && resourcesForYear.length > 0) {
            selectedTeacher = resourcesForYear[0];
        }
        
        if (!selectedTeacher) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'Could not allocate a teacher'));
        }
        
        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Teacher allocated successfully', selectedTeacher));
    } catch (error) {
        console.error("Error allocating teacher:", error);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 
                'An error occurred while allocating teacher'));
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Increments the used_resources count for a teacher's resource entry
 */
export const incrementResourceUsage = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request - Increment Resource Usage`);
    const { teacherId, studyYear } = req.body;
    let connection: any;

    if (!teacherId || !studyYear) {
        return res.status(Code.BAD_REQUEST)
            .send(new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, 'Teacher ID and study year are required'));
    }

    try {
        connection = await pool.getConnection();

        // Find the resource to increment
        const [resource] = await connection.query(
            `SELECT * FROM resources 
             WHERE teacher_id = ? AND study_year = ?`,
            [teacherId, studyYear]
        );

        if (!resource || resource.length === 0) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'Resource not found'));
        }

        // Check if incrementing would exceed total resources
        if (resource[0].used_resources >= resource[0].total_resources) {
            return res.status(Code.BAD_REQUEST)
                .send(new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST,
                    'Cannot increment: Teacher has reached maximum resource allocation'));
        }

        // Increment the used_resources
        const [result] = await connection.query(R_QUERY.INCREMENT_RESOURCE_USAGE, [teacherId, studyYear]);

        if (result.affectedRows === 0) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'Resource not found'));
        }

        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Resource usage incremented successfully'));
    } catch (error) {
        console.error("Error incrementing resource usage:", error);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR,
                'An error occurred while incrementing resource usage'));
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Decrements the used_resources count for a teacher's resource entry
 */
export const decrementResourceUsage = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request - Decrement Resource Usage`);
    const { teacherId, studyYear } = req.body;
    let connection: any;

    if (!teacherId || !studyYear) {
        return res.status(Code.BAD_REQUEST)
            .send(new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, 'Teacher ID and study year are required'));
    }

    try {
        connection = await pool.getConnection();

        // Decrement the used_resources only if > 0
        const [result] = await connection.query(R_QUERY.DECREMENT_RESOURCE_USAGE, [teacherId, studyYear]);

        if (result.affectedRows === 0) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND,
                    'Resource not found or used_resources already at 0'));
        }

        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Resource usage decremented successfully'));
    } catch (error) {
        console.error("Error decrementing resource usage:", error);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR,
                'An error occurred while decrementing resource usage'));
    } finally {
        if (connection) connection.release();
    }
};