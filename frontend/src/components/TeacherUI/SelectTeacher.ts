import { allocateTeacher } from "../../contexts/apiRequests/resourcesApiRequests";
import { Resource } from "../../interface/resource";

export const selectTeacher = async (companyName: string, startDate: Date, studentId?: number): Promise<Resource | null> => {
    const token = localStorage.getItem('token');
    
    let authHeader: any = {};
    if (token) {
        authHeader = {
            headers: { Authorization: `Bearer ${token}` }
        };
    }
    
    try {
        const response = await allocateTeacher(companyName, startDate, studentId, authHeader);
        
        if (response && response.statusCode === 200) {
            return response.data;
        } else {
            console.error('Error allocating teacher:', response?.message || 'Unknown error');
            return null;
        }
    } catch (error) {
        console.error('Error allocating teacher:', error);
        return null;
    }
};