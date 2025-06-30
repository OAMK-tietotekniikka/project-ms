import { Route, Routes } from "react-router-dom";
import AddNewProject from "./views/AddNewProject";
import NavBar from "./components/Navbar";
import TeacherDashboard from "./views/TeacherDashboard";
import StudentDashboard from "./views/StudentDashboard";
import Teachers from "./views/Teachers";
import StudentProjectDetails from "./views/StudentProjectDetails";
import Students from "./views/Students";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import Projects from "@/components/TeacherUI/Projects";

function App() {
	let role = localStorage.getItem("role");
	if (!role) {
		localStorage.setItem("role", "student");
		role = "student";
	}

	return (
		<div>
			<NavBar />
			<div className="flex flex-col md:pr-20">
				<hr className="m-0" />
				<div className="pb-20 md:pb-0">
					<QueryClientProvider client={queryClient}>
						<Routes>
							{role === "teacher" && (
								<Route path="/" element={<TeacherDashboard />} />
							)}
							<Route path="/form" element={<AddNewProject />} />
							{role === "student" && (
								<Route path="/" element={<StudentDashboard />} />
							)}
							<Route
								path="/studentProject/:id"
								element={<StudentProjectDetails />}
							/>
							{role === "teacher" && (
								<Route path="/teachers" element={<Teachers />} />
							)}
							{role === "teacher" && (
								<Route path="/projects" element={<Projects />} />
							)}
							{role === "teacher" && (
								<Route path="/students" element={<Students />} />
							)}
						</Routes>
						<ReactQueryDevtools initialIsOpen={false} />
					</QueryClientProvider>
				</div>
			</div>
		</div>
	);
}
export default App;
