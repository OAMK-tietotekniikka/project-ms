import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    // currently using private gmail, but need to be changed to department email or service like SendGrid
    // host: 'stmp.office365.com',
    // port: 587,
    // secure: false,
    service: 'gmail', 
    auth: {
        user: process.env.SERVER_EMAIL, 
        pass: process.env.SERVER_EMAIL_PASSWORD  
    },
    // tls: {
    //     rejectUnauthorized: false,
    //   },
});

export const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
    const mailOptions = {
        from: process.env.SERVER_EMAIL,
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email to ${to} sent successfully`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email sending failed');
    }
};
