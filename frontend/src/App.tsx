import { Route, Routes } from 'react-router-dom';
import AddNewProject from './views/AddNewProject';
import NavbarComponent from './components/Navbar';
import SidebarComponent from './components/Sidebar';
import TeacherDashboard from './views/TeacherDashboard';
import StudentDashboard from './views/StudentDashboard';
import Teachers from './views/Teachers';
import ModifyTeacher from './views/ModifyTeacher';
import StudentProjectDetails from './views/StudentProjectDetails';
import SignInPageWithEntra from './views/SignInPageWithEntra';
import { useUserContext } from './contexts/userContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Students from "./views/Students";

function App() {
  const { user } = useUserContext();

  return (
    <div>
        <NavbarComponent />
        <div style={{ display: 'flex', flexDirection: "column" }}>
          {(user !== "") ? <SidebarComponent /> : null}
          <hr style={{margin: "0px"}}/>
          <div>
            <Routes>
              <Route path="/" element={<SignInPageWithEntra />} />
              {user === "teacher" && <Route path="/teacher" element={<TeacherDashboard />} />}
              {user === "teacher" && <Route path="/modifyTeacher/:id" element={<ModifyTeacher />} />}
              <Route path="/form" element={<AddNewProject />} />
              {user === "student" && <Route path="/student" element={<StudentDashboard />} />}
              <Route path="/studentProject/:id" element={<StudentProjectDetails />} />
              {user === "teacher" && <Route path="/teachers" element={<Teachers />} />}
                {user === "teacher" && <Route path="/students" element={<Students />} />}
            </Routes>
          </div>
        </div>
    </div>
  );
};
export default App;