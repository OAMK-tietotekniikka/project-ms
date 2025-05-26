import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Form, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../contexts/userContext';
import { useTeachersContext } from '../contexts/teachersContext';
import { useStudentsContext } from '../contexts/studentsContext';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from "../authConfig";
import { NewTeacher } from '../interface/teacher';
import { newStudent } from '../interface/student';
import { loginWithDbCredentials } from '../contexts/apiRequests/authApiRequests';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

const SignInPageWithEntra: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, setUser, token, setToken } = useUserContext();
    const { getTeacherByEmail, addNewTeacher } = useTeachersContext();
    const { getStudentByEmail, addNewStudent } = useStudentsContext();
    const { instance, accounts } = useMsal();

    // Add state for database login
    const current_env = import.meta.env.VITE_RUNNING_ENV;
    const showDbLogin = current_env !== 'production';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Existing useEffect for MSAL login
    useEffect(() => {
        if (token && user) {
            navigate(user === "teacher" ? "/teacher" : "/student", { replace: true });
            return;
        }

        const fetchAccessToken = async () => {
            if (accounts.length > 0) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0],
                    });

                    const accessToken = response.accessToken;
                    setToken(accessToken);
                    localStorage.setItem('token', accessToken);

                    const account = accounts[0];
                    const idToken = account.idTokenClaims;

                    const userRole = idToken?.groups[0];
                    const userEmail = idToken?.email?.toString();

                    if (idToken && userRole === "10073ee5-6b85-4701-ada7-e6bad5c4718d") {
                        setUser("teacher");
                        localStorage.setItem('user', "teacher");

                        const teacher = await getTeacherByEmail(userEmail);
                        if (teacher) {
                            navigate("/teacher", { replace: true });
                        } else {
                            const newTeacherData: NewTeacher = {
                                teacher_name: idToken.name,
                                email: userEmail,
                            };
                            const response = await addNewTeacher(newTeacherData);
                            if (response.teacher_id) {
                                navigate("/teacher", { replace: true });
                            } else {
                                alert("Failed to add new teacher, please try again.");
                            }
                        }
                    } else if (idToken && userRole === "559e9aa0-84e4-49ac-b339-b41ae22740fa") {
                        setUser("student");
                        localStorage.setItem('user', "student");

                        const student = await getStudentByEmail(userEmail);
                        if (student) {
                            navigate("/student", { replace: true });
                        } else {
                            const newStudentData: newStudent = {
                                student_name: idToken.name,
                                email: userEmail,
                                class_code: null,
                            };
                            const response = await addNewStudent(newStudentData);
                            if (response.student_id) {
                                navigate("/student", { replace: true });
                            } else {
                                alert("Failed to add new student, please try again.");
                            }
                        }
                    } else {
                        alert("User role not recognized.");
                    }
                } catch (error) {
                    console.error("Failed to acquire access token:", error);
                }
            }
        };

        fetchAccessToken();
    }, [accounts]);

    // Existing MSAL login handler
    const handleLogin = () => {
        instance.loginRedirect(loginRequest).catch((e) => {
            console.error(e);
        });
    };

    // Add database login handler
    const handleDbLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Call the database login endpoint
            const response = await loginWithDbCredentials(email, password, role);

            if (response && response.statusCode === 200 && response.data?.token) {
                // Set token
                const token = response.data.token;
                setToken(token);
                localStorage.setItem('token', token);

                // Set user role
                setUser(role);
                localStorage.setItem('user', role);

                // Navigate based on role
                if (role === 'teacher') {
                    await getTeacherByEmail(email);
                    navigate('/teacher', { replace: true });
                } else {
                    await getStudentByEmail(email);
                    navigate('/student', { replace: true });
                }
            } else {
                setError(response?.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="main-container2">
            <Row className="d-flex justify-content-center">
                <Col md={12} lg={8}>
                    <h5>{t('welcome')}</h5>
                    <h6 style={{ marginTop: "6%" }}>{t('enter')}:</h6>

                    {/* MSAL Login Button */}
                    <Button className='resources-button' onClick={handleLogin}>
                        {t('login')} (Entra ID)
                    </Button>

                    {/* Toggle Database Login Form */}
                    <h6 style={{ marginTop: "6%" }}>Test login</h6>


                    {/* Database Login Form */}
                    {showDbLogin && (
                        <div className="mt-4 p-3 border rounded">
                            <h6>Database User Login (For Testing)</h6>
                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleDbLogin}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email"
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Example: teacher1@mail.com (teacher) or john@mail.com (student)
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Default test password: password123
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Role</Form.Label>
                                    <Form.Select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                    </Form.Select>
                                </Form.Group>

                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Logging in...' : 'Test Login'}
                                </Button>
                            </Form>
                        </div>
                    )}

                    <h6 style={{ marginTop: "6%" }}>{t('furtherNote')}</h6>
                </Col>
            </Row>
        </Container>
    );
};

export default SignInPageWithEntra;