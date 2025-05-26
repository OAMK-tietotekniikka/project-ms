import React , { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useProjectsContext } from '../../contexts/projectsContext';
import { useUserContext } from '../../contexts/userContext';
import 'bootstrap/dist/css/bootstrap.min.css';


interface ChangeProjectStatusProps {
    projectData: any;
}

const ChangeProjectStatus: React.FC<ChangeProjectStatusProps> = ({ projectData }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { modifyProject, fetchProjects } = useProjectsContext();
    const [projectStatus, setProjectStatus] = useState<string>(projectData?.project_status || '');
    const [initialStatus, setInitialStatus] = useState<string>(projectData?.project_status || '');
    const currentDate = new Date();
    const { user } = useUserContext();

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleStatusChange = (status: string) => {
        setProjectStatus(status);
    };

    const handleSave = () => {

        const updatedProject = {
            project_name: projectData?.project_name,
            project_desc: projectData?.project_desc,
            teacher_id: projectData?.teacher_id,
            company_id: projectData?.company_id,
            project_status: projectStatus,
            project_url: projectData?.project_url,
            start_date: projectData?.start_date,
            end_date: projectStatus === "completed" ? currentDate : projectData?.end_date,
        };
        modifyProject(updatedProject, projectData.project_id);
        user === "teacher" ? navigate('/teacher') : navigate('/student');
    };

    const isStatusChanged = projectStatus !== initialStatus;

    return (
        <Container>
            <Row>
                <Col className='radio-column'>
                    <Form>
                        <div >
                            <Form.Check
                                className='form-check'
                                type='radio'
                                label={<span><strong>{t('pending')}</strong> <span className='radio-span'> ({t('pendingRadio')}) </span></span>}
                                checked={projectStatus === 'pending'}
                                onChange={() => handleStatusChange('pending')}
                            />
                            <Form.Check
                                className='form-check'
                                type='radio'
                                label={<span><strong>{t('ongoing')}</strong> <span className='radio-span'> ({t('ongoingRadio')})</span></span>}
                                checked={projectStatus === 'ongoing'}
                                onChange={() => handleStatusChange('ongoing')}
                            />
                            {user === "teacher" &&
                                <Form.Check
                                    className='form-check'
                                    type='radio'
                                    label={<span><strong>{t('completed')}</strong> <span className='radio-span'> ({t('completedRadio')})</span></span>}
                                    checked={projectStatus === 'completed'}
                                    onChange={() => handleStatusChange('completed')}
                                />
                            }
                        </div>
                    </Form>
                    <Button
                        className="student-view-button"
                        type='button'
                        style={{ width: "100px", marginTop: "5px", alignSelf: "end" }}
                        onClick={() => handleSave()}
                        disabled={!isStatusChanged}
                    >
                        {t('save')}
                    </Button>
                </Col>
            </Row>
        </Container>
    )
};

export default ChangeProjectStatus;
