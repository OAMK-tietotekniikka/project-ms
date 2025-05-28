import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ProjectForm from '../components/StudentUI/ProjectForm';
import { useTranslation } from 'react-i18next';
import { ProjectFormData } from '../interface/formData';
import { useTeachersContext } from '../contexts/teachersContext';
import { useProjectsContext } from '../contexts/projectsContext';
import { useStudentsContext } from '../contexts/studentsContext';
import { sendEmail } from '../components/SendEmail';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css'


const AddNewProject: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { teachers } = useTeachersContext();
    const { addNewProject } = useProjectsContext();
    const { signedInStudent } = useStudentsContext();
    
    const handleFormSubmit = async (
        formData: ProjectFormData,
        companyId: number,
        teacherId: number,
        companyName: string): Promise<{ statusCode: number } | undefined> => {
        // add company_id and teacher_id to formData
        formData.company_id = companyId;
        formData.teacher_id = teacherId;
        const formattedStartDate = new Date(formData.start_date).toISOString().split('T')[0];
        const student = signedInStudent ? signedInStudent.student_name : 'Student';

        try {
            if (!signedInStudent) {
                alert(t('studentNotLoggedIn'));
                return;
            }
            const studentId = signedInStudent.student_id;

            const response = await addNewProject(formData, studentId);
            if (response.statusCode === 201) {
                const selectedTeacher = teachers.find((teacher) => teacher.teacher_id === teacherId);
                
                if (selectedTeacher) {
                    const emailResponse = await sendEmail(
                        selectedTeacher.email, // when testing/developing, replace with some actual hardcoded email address
                        student,
                        formData.project_name,
                        companyName,
                        formattedStartDate
                        );
                    if (emailResponse) {
                        console.log('Email sent successfully');
                    } else {
                        alert(t('emailNotSent'));
                    }
                }
                alert(t('projCreated'));
                navigate('/student');
            } else {
                alert(t('projNotCreated'));
                return response;

            }
        } catch (error) {
            console.error("Failed to add project:", error);
            alert(t('projNotCreated'));
            return undefined;
        }
    };

    return (
        <Container>
            <Row className="justify-content-center">
                <Col xs={11} md={8} lg={7}>
                    <ProjectForm onSubmit={handleFormSubmit} />
                </Col>
            </Row>
        </Container>
    );
};

export default AddNewProject;
