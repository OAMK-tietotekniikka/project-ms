import React, { useState, useEffect } from "react";
import { getStudents, updateStudent, getStudent, createStudent } from "./apiRequests/studentsApiRequests";
import { Student, UpdatedStudent, newStudent } from "../interface/student";
import { useUserContext } from "./userContext";
import axios from "axios";


interface StudentsContextType {
    students: Student[];
    signedInStudent: Student;
    setSignedInStudent: (student: Student | null) => void;
    modifyStudent: (student: UpdatedStudent, studentId: number) => void;
    getStudentByEmail: (email: string) => Promise<Student>;
    addNewStudent: (student: newStudent) => Promise<{ statusCode: number, data: Student}>;
}

const StudentsContext = React.createContext<StudentsContextType>({} as StudentsContextType);

const StudentsContextProvider = (props: any) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [signedInStudent, setSignedInStudentState] = useState<Student | null>(() => {
        const savedStudent = localStorage.getItem('signedInStudent');
        return savedStudent ? JSON.parse(savedStudent) : null;
    });
    const { studentId, token } = useUserContext();

    let authHeader: any = {};
    if (token) {
        authHeader = { headers: { Authorization: `Bearer ${token}` } };
    }

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const studentsList = await getStudents(authHeader);
                setStudents(studentsList.data);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        }
        if (token) {
            fetchStudents();
        } else {
            setStudents([]);
        }
    }, [token]);


    useEffect(() => {
        if (students?.length === 0 || studentId === 0) return;
        const student = students.find(s => s.student_id === studentId);
        if (student) {
            setSignedInStudent(student);
        }
    }, [students, studentId, token]);

    const setSignedInStudent = (student: Student | null) => {
        setSignedInStudentState(student);
        if (student) {
            localStorage.setItem('signedInStudent', JSON.stringify(student));
        } else {
            localStorage.removeItem('signedInStudent');
        }
    };

    const getStudentByEmail = async (email: string) => {
        try {
            const response = await getStudent(email, authHeader);
            if (response.statusCode === 200) {
                setSignedInStudent(response.data[0]);
                console.log("From context: ", response.data[0]);
                localStorage.setItem('signedInStudent', JSON.stringify(response.data[0]));
                localStorage.setItem('studentId', JSON.stringify(response.data[0].student_id));
                return response.data[0];
            } else {
                return null;
            }
        }
        catch (error) {
            console.error("Failed to get student by email:", error);
        }
    };
    // Alternative implementation using Axios
const addNewStudent = async (studentData: any) => {
  try {
    console.log('Adding new student with data:', JSON.stringify(studentData));
    
    // Make the API call with precise logging
    console.log('Making API request to:', `${import.meta.env.VITE_API_URL}/students`);
    
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/students`, 
      studentData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data));
    
    // Our server returns 201 (Created) for new students or 200 (OK) for updated ones
    if (response.status === 201 || response.status === 200) {
      // Access the student data based on the actual response structure
      let newStudent;
      
      if (response.data.data && typeof response.data.data === 'object') {
        newStudent = response.data.data;
      } else if (response.data.student && typeof response.data.student === 'object') {
        newStudent = response.data.student;
      } else {
        newStudent = response.data;
      }
      
      console.log('Extracted student data:', JSON.stringify(newStudent));
      
      // Only update state if we got a valid student object
      if (newStudent && (newStudent.student_id || response.status === 200)) {
        // Add to students list if it's a new student
        if (response.status === 201) {
          setStudents((prevStudents) => [...prevStudents, newStudent]);
        } else {
          // Update existing student in the list
          setStudents((prevStudents) => 
            prevStudents.map(s => 
              s.email === studentData.email ? { ...s, ...newStudent } : s
            )
          );
        }
        
        // Return the full response to distinguish between create and update
          return {
              statusCode: response.status,
              data: newStudent
          };

      } else {
        console.error('Invalid student data in response:', JSON.stringify(response.data));
        throw new Error('Invalid student data returned from server');
      }
    } else {
      console.error('Unexpected response status:', response.status);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error adding student:', error.message);
      console.error('Error details:', JSON.stringify(error.response?.data || {}));
      console.error('Error status:', error.response?.status);
      
      // Re-throw a more informative error
      throw new Error(`API Error: ${error.message} - ${JSON.stringify(error.response?.data || {})}`);
    } else {
      console.error('Non-Axios error adding student:', error);
      throw error;
    }
  }
};

    const modifyStudent = async (student: UpdatedStudent, studentId: number) => {
        try {
            const response = await updateStudent(student, studentId, authHeader);
            if (response.statusCode === 200) {
                setStudents((prevStudents) => prevStudents.filter(s => s.student_id !== studentId).concat(response.data));
            }
        }
        catch (error) {
            console.error("Failed to update student:", error
            );
        }
    };

    let value = {
        students,
        signedInStudent,
        setSignedInStudent,
        modifyStudent,
        getStudentByEmail,
        addNewStudent
    };

    return (
        <StudentsContext.Provider value={value}>
            {props.children}
        </StudentsContext.Provider>
    );
};

export const useStudentsContext = () => {
    const context = React.useContext(StudentsContext);
    if (!context) {
        throw new Error("usestudentsContext must be used within a StudentsContextProvider");
    }
    return context;
};

export default StudentsContextProvider;


