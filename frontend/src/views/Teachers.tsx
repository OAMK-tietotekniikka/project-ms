import React, { useState } from 'react';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import TeachersList from '../components/TeacherUI/TeachersList';
import ImportStudents from '../components/TeacherUI/ImportStudents';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

const Teachers: React.FC = () => {
    const { t } = useTranslation();
    const [showImportModal, setShowImportModal] = useState(false);

    return (
        <Container className='teacher-main-container'>
            <Row style={{ width: "100%" }}>
                <Col xs={12} md={12} lg={11}>
                    <h4>{t('teachersMain')}</h4>
                    <TeachersList />
                    
                    <div className='d-flex justify-content-between align-items-center mt-4'>
                        <div className='second-heading'>{t('studentManagement')}</div>
                        <Button 
                            className='addCompany-button'
                            onClick={() => setShowImportModal(true)}
                        >
                            {t('importStudents')}
                        </Button>
                    </div>
                    
                    <Modal
                        show={showImportModal}
                        onHide={() => setShowImportModal(false)}
                        size="lg"
                        aria-labelledby="import-students-modal"
                        centered
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>{t('importStudentsToClass')}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <ImportStudents handleClose={() => setShowImportModal(false)} />
                        </Modal.Body>
                    </Modal>
                </Col>
            </Row>
        </Container>
    );
};

export default Teachers;