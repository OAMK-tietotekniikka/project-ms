import axios from 'axios';
import { NewResource } from '../../interface/resource';
import { NewTeacher } from '../../interface/teacher';


const baseUrl = import.meta.env.VITE_API_URL

// Teachers API requests
export const getTeachers = async (authHeader: any) => {
    try {
        const response = await axios.get(`${baseUrl}/teachers`, authHeader);
        
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to write data:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
        }
    }
};

export const getTeachersByCompany = async (company_name: string, authHeader: any) => {
    try {
        const response = await axios.get(`${baseUrl}/teachers/company/${company_name}`, authHeader);
        if (response.data.statusCode === 200) {
            return response.data;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to write data:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
        }
    }
};

export const createTeacher = async (teacher: NewTeacher, authHeader: any) => {
    try {
        const response = await axios.post(`${baseUrl}/teachers`, teacher, authHeader);
        if (response.data.statusCode === 201) {
            return response.data;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to write data:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
        }
    }
};

export const getTeacher = async (email: string, authHeader: any) => {
    try {
        const response = await axios.get(`${baseUrl}/teachers/${email}`, authHeader);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to write data:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
        }
    }
};

// Resources API requests
export const getResources = async (authHeader: any) => {
    try {
        const response = await axios.get(`${baseUrl}/resources`, authHeader);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to write data:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
        }
    }
};

export const updateResource = async (resource_id: number, resource: NewResource, authHeader: any) => {
    try {
        const response = await axios.put(`${baseUrl}/resources/${resource_id}`, resource, authHeader);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to write data:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
        }
    }
};

export const createResource = async (resource: NewResource, authHeader: any) => {
    try {
        const response = await axios.post(`${baseUrl}/resources`, resource, authHeader);
        if (response.data.statusCode === 201) {
            alert('New resource created successfully.');
            return response.data;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to write data:', error.response?.data);
            return error.response?.data;
        } else {
            console.error('An unexpected error:', error);
        }
    }
};