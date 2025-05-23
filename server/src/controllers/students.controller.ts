import { Request, Response } from "express";
import { Student } from "../interface/student";
import pool from "../config/mysql.config";
import { Code } from "../enum/code.enum";
import { Status } from "../enum/status.enum";
import { HttpResponse } from "../domain/response";
import { ResultSetHeader, RowDataPacket, FieldPacket, OkPacket } from "mysql2";
import { QUERY } from "../query/students.query";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";


type ResultSet = [RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader, FieldPacket[]];

export const getStudents = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[0]} ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await pool.query(QUERY.SELECT_STUDENTS);
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
        const result: ResultSet = await pool.query(QUERY.SELECT_STUDENT_BY_EMAIL, [req.params.email]);
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
        
        // Make sure we have the required fields
        if (!student.email) {
            console.error('Missing required fields:', JSON.stringify(student));
            return res.status(Code.BAD_REQUEST)
                .send(new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, 'Email is required'));
        }
        
        // Split student_name into first_name and last_name if provided as combined field
        if (student.student_name && !student.first_name && !student.last_name) {
            const nameParts = student.student_name.split(' ');
            student.first_name = nameParts[0] || '';
            student.last_name = nameParts.slice(1).join(' ') || '';
        }
        
        // Ensure we have at least first_name (even if empty)
        if (!student.first_name) {
            student.first_name = '';
        }
        
        // Ensure we have at least last_name (even if empty)
        if (!student.last_name) {
            student.last_name = '';
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
                
                // Make sure class_code is string
                const classCode = student.class_code ? student.class_code.toString() : '';
                
                try {
                    const result = await connection.query(
                        QUERY.UPDATE_STUDENT,
                        [
                            student.first_name, 
                            student.last_name,
                            student.email, 
                            classCode, 
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
            
            // Set a default class_code if not provided
            if (!student.class_code) {
                student.class_code = '';
            } else {
                // Ensure class_code is a string
                student.class_code = student.class_code.toString();
            }
            
            // Set a default password if not provided
            if (!student.password) {
                student.password = '';  // Or generate a random password
            }
            
            console.log('Executing SQL query with parameters:', [
                student.first_name,
                student.last_name, 
                student.email, 
                student.class_code,
                student.password
            ]);
            
            // Execute the query with the correct parameters
            const result = await connection.query(
                'INSERT INTO students (first_name, last_name, email, class_code, password) VALUES (?, ?, ?, ?, ?)', 
                [
                    student.first_name,
                    student.last_name, 
                    student.email, 
                    student.class_code,
                    student.password
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
    let student: Student = { ...req.body };
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await pool.query(QUERY.SELECT_STUDENT, [req.params.student_id]);
        if ((result[0] as Array<ResultSet>).length > 0) {
            const result: ResultSet = await pool.query(QUERY.UPDATE_STUDENT, [...Object.values(student), req.params.student_id]);
            return res.status(Code.OK)
                .send(new HttpResponse(Code.OK, Status.OK, 'Student updated', { ...student, id: req.params.student_id }));
        } else {
            return res.status(Code.NOT_FOUND)
                .send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, 'Student not found'));
        }
    } catch (error: unknown) {
        console.error(`[${new Date().toLocaleDateString()}] ${error}`);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred while updating student'));

    }
};

//Function not in use yet
export const deleteStudent = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleDateString()}] Incoming ${req.method}${req.originalUrl} request from ${req.rawHeaders[0]} ${req.rawHeaders[1]}`);
    let connection: any;
    try {
        connection = await pool.getConnection();
        const result: ResultSet = await pool.query(QUERY.SELECT_STUDENT, [req.params.student_id]);
        if ((result[0] as Array<ResultSet>).length > 0) {
            const result: ResultSet = await pool.query(QUERY.DELETE_STUDENT, [req.params.student_id]);
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

