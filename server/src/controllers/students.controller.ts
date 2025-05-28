import { Request, Response } from "express";
import { Student } from "../interface/student";
import pool from "../config/mysql.config";
import { Code } from "../enum/code.enum";
import { Status } from "../enum/status.enum";
import { HttpResponse } from "../domain/response";
import { ResultSetHeader, RowDataPacket, FieldPacket, OkPacket } from "mysql2";
import { QUERY } from "../query/students.query";
import isEmail from 'validator/lib/isEmail';
// should be refactored

type ResultSet = [RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader, FieldPacket[]];


function isValidClassCode(code: any) {
    const format = /^[A-Za-z]+[0-9]+[A-Za-z]+$/;
    return (typeof code === "string" && format.test(code.trim())) ? code.trim().toLowerCase() : null;
}


function isValidEmail(email : any) {
    return (typeof email === "string" && isEmail(email)) ? email.toLowerCase() : "";
}

export const getStudents = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[0]} ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await connection.query(QUERY.SELECT_STUDENTS);
        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Students fetched successfully', result[0]));
    }
    catch (error: unknown) {
        console.error(`[${new Date().toLocaleDateString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while fetching students'));
    } finally {
        if (connection) connection.release();
    }
};

export const getStudent = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[0]} ${req.rawHeaders[1]}`);
    console.log(req.params.email);
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await connection.query(QUERY.SELECT_STUDENT_BY_EMAIL, [req.params.email]);
        if ((result[0] as Array<ResultSet>).length > 0) {
            console.log(result[0]);
            return res.status(Code.OK)
                .send(new HttpResponse(Code.OK, Status.OK, 'Student fetched successfully', result[0]));
        } else {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'Student not found'));
        }
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleDateString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while fetching students'));

    }
};


export const createStudent = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[0]} ${req.rawHeaders[1]}`);
    let student = { ...req.body };
    let connection: any;
    
    // Log the incoming data for debugging
    console.log('Creating student with data:', JSON.stringify(student));
    
    try {
        connection = await pool.getConnection();

        student.email = isValidEmail(student.email);

        if (!student.email) {
            console.error('Missing required fields:', JSON.stringify(student));
            return res.status(Code.BAD_REQUEST)
                .send(new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, 'Email is required'));
        }


        
        try {
            // Check if student already exists with this email
            const existingStudent = await connection.query(
                QUERY.SELECT_STUDENT_BY_EMAIL, 
                [student.email]
            );
            
            if (existingStudent[0] && Array.isArray(existingStudent[0]) && existingStudent[0].length > 0) {
                console.log('Student with email already exists:', student.email);
                // If you want to update instead of insert
                const existingStudentData = existingStudent[0][0];
                student.class_code = isValidClassCode(student.class_code) || existingStudentData.class_code;

                

                try {
                    const result = await connection.query(
                        QUERY.UPDATE_STUDENT,
                        [
                            student.student_name,
                            student.email,
                            student.class_code,
                            existingStudentData.student_id
                        ]
                    );
                    
                    console.log('Update result:', JSON.stringify(result));
                    
                    return res.status(Code.OK)
                        .send(new HttpResponse(Code.OK, Status.OK, 'Student updated successfully', {
                            ...student,
                            student_id: existingStudentData.student_id
                        }));
                } catch (updateError) {
                    console.error('Error updating existing student:', updateError);
                    throw updateError;
                }
            }

            
            console.log('Executing SQL query with parameters:', [
                student.student_name,
                student.email, 
                student.class_code,
            ]);
            
            // Execute the query with the correct parameters
            const result = await connection.query(
                'INSERT INTO students (student_name, email, class_code) VALUES (?, ?, ?)',
                [
                    student.student_name,
                    student.email, 
                    student.class_code,
                ]
            );
            
            console.log('Query result:', JSON.stringify(result));
            
            // Add the student_id to the student object for the response
            if (result && result[0] && (result[0] as ResultSetHeader).insertId) {
                student = { 
                    student_id: (result[0] as ResultSetHeader).insertId, 
                    ...student 
                };
                
                console.log('Sending success response with data:', JSON.stringify(student));
                
                return res.status(Code.CREATED)
                    .send(new HttpResponse(Code.CREATED, Status.CREATED, 'Student created successfully', student));
            } else {
                throw new Error('Invalid result from database insert');
            }
        } catch (queryError) {
            console.error('Database query error:', queryError);
            throw queryError;
        }
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleDateString()}] Create student error:`, error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while creating new student'));
    } finally {
        if (connection) {
            try {
                connection.release();
                console.log('Database connection released');
            } catch (releaseError) {
                console.error('Error releasing connection:', releaseError);
            }
        }
    }
};

export const updateStudent = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[0]} ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();

        const result: ResultSet = await connection.query(QUERY.SELECT_STUDENT, [req.params.student_id]);
        if ((result[0] as Array<Student>).length === 0) {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'Student not found'));
        }

        const existingStudent = (result[0] as Array<Student>)[0];
        const incoming : Student = {...req.body};

        const email = isValidEmail(incoming.email) || existingStudent.email;
        const class_code = isValidClassCode(incoming.class_code) || existingStudent.class_code;

        const student_name = typeof incoming.student_name === 'string' && incoming.student_name.trim() !== ''
            ? incoming.student_name.trim()
            : existingStudent.student_name;

        console.log('Updating student_id:', req.params.student_id);
        console.log('Existing student email:', existingStudent.email);
        console.log('Incoming email after validation:', email);
        await connection.query(
            QUERY.UPDATE_STUDENT,
            [student_name, email, class_code, req.params.student_id]
        );

        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Student updated', {
                student_id: req.params.student_id,
                student_name,
                email,
                class_code,
                created_at: existingStudent.created_at
            }));
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleDateString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while updating student'));
    } finally {
        if (connection) connection.release();
    }
};

//Function not in use yet
export const deleteStudent = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[0]} ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await connection.query(QUERY.SELECT_STUDENT, [req.params.student_id]);
        if ((result[0] as Array<ResultSet>).length > 0) {
            const result: ResultSet = await connection.query(QUERY.DELETE_STUDENT, [req.params.student_id]);
            return res.status(Code.OK)
                .send(new HttpResponse(Code.OK, Status.OK, 'Student deleted',));
        } else {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'Student not found'));
        }
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleDateString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while fetching students'));

    }
};

