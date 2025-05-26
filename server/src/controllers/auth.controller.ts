import { Request, Response } from 'express';
import { Code } from '../enum/code.enum';
import { Status } from '../enum/status.enum';
import { HttpResponse } from '../domain/response';
import pool from '../config/mysql.config';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response): Promise<Response<HttpResponse>> => {
    console.info(`[${new Date().toLocaleString()}] Incoming ${req.method}${req.originalUrl} Request - DB Login`);

    const { email, password, role } = req.body;

    if (!email || !role) {
        return res.status(Code.BAD_REQUEST)
            .send(new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, 'Email and role are required'));
    }

    let connection: any;

    try {
        connection = await pool.getConnection();

        // Determine which table to query based on role
        let table = '';
        let idField = '';

        if (role === 'teacher') {
            table = 'teachers';
            idField = 'teacher_id';
        } else if (role === 'student') {
            table = 'students';
            idField = 'student_id';
        } else {
            return res.status(Code.BAD_REQUEST)
                .send(new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, 'Invalid role'));
        }

        // Query for user with provided email
        const [users] = await connection.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);

        if (!users || users.length === 0) {
            console.log(`No ${role} found with email: ${email}`);
            return res.status(Code.UNAUTHORIZED)
                .send(new HttpResponse(Code.UNAUTHORIZED, Status.UNAUTHORIZED, 'Invalid credentials'));
        }

        const user = users[0];

        // By default, use 'password123' if password isn't in database
        const dbPassword = 'password123';

        // Check password
        if (password !== dbPassword) {
            return res.status(Code.UNAUTHORIZED)
                .send(new HttpResponse(Code.UNAUTHORIZED, Status.UNAUTHORIZED, 'Invalid credentials'));
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user[idField],
                email: user.email,
                role: role
            },
            process.env.JWT_SECRET || 'Y&2sLp4uZ*8vq@C#E6wN!9rF3gHJkMnQ',
            { expiresIn: '24h' }
        );

        return res.status(Code.OK)
            .send(new HttpResponse(Code.OK, Status.OK, 'Login successful', { token }));

    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Login error:`, error);
        return res.status(Code.INTERNAL_SERVER_ERROR)
            .send(new HttpResponse(Code.INTERNAL_SERVER_ERROR, Status.INTERNAL_SERVER_ERROR, 'An error occurred during login'));
    } finally {
        if (connection) connection.release();
    }
};