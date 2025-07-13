import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resourcesService, studentService } from "@/shared/services";

type batchStudents = {
	data: any;
};

type updateStudent = {
	studentId: number;
	data: any;
};

export const useGetAllStudents = () => {
	return useQuery({
		queryKey: ["students", "list"],
		queryFn: () => studentService.getAllStudents().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useBatchStudents = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ data }: batchStudents) =>
			studentService.createStudentBatch(data).then((res) => res.data.data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["students", "list"] });
		},
	});
};

export const useUpdateStudent = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ studentId, data }: updateStudent) =>
			studentService.updateStudent(studentId, data).then((res) => res.data.data),
		onSuccess: (updatedStudent, { studentId }) => {


			// Update in students list
			queryClient.setQueryData(["students", "list"], (oldData: any[]) => {
				return oldData?.map(student =>
					student.student_id === studentId ? { ...student,
					student_name: updatedStudent.student_name || student.student_name,
					class_code: updatedStudent.class_code || student.class_code} : student
				) || [];
			});
		},
		onError: (error) => {
			console.error("Failed to update student:", error);
		},
	});
};

export const useStudentProfile = () => {
	return useQuery({
		queryKey: ["student", "profile"],
		queryFn: () =>
			studentService.getStudentProfile().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

