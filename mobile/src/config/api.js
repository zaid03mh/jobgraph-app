/**
 * JobGraph - API Configuration
 * Axios client with interceptors and error handling
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - change this to your backend URL
// For Android emulator: 'http://10.0.2.2:3000/api'
// For iOS simulator: 'http://localhost:3000/api'
// For physical device: 'http://YOUR_COMPUTER_IP:3000/api'
// For Expo web: 'http://localhost:3000/api'
const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.log('Error getting token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            // Navigation to login will be handled by AuthContext
        }

        // Format error message
        const message = error.response?.data?.message || error.message || 'An error occurred';
        const errorCode = error.response?.data?.errorCode || 'UNKNOWN_ERROR';

        return Promise.reject({ message, errorCode, status: error.response?.status });
    }
);

// API methods
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
};

export const userAPI = {
    getSkills: () => api.get('/users/skills'),
    addSkills: (skills) => api.post('/users/skills', { skills }),
    removeSkill: (skillName) => api.delete(`/users/skills/${encodeURIComponent(skillName)}`),
    getAllSkills: () => api.get('/users/all-skills'),
};

export const jobAPI = {
    getAll: (params) => api.get('/jobs', { params }),
    getById: (id) => api.get(`/jobs/${id}`),
    create: (data) => api.post('/jobs', data),
    update: (id, data) => api.put(`/jobs/${id}`, data),
    delete: (id) => api.delete(`/jobs/${id}`),
    getMyJobs: () => api.get('/jobs/my-jobs'),
};

export const applicationAPI = {
    apply: (jobId, data) => api.post(`/applications/${jobId}`, data),
    getHistory: () => api.get('/applications/history'),
    checkStatus: (jobId) => api.get(`/applications/check/${jobId}`),
    withdraw: (applicationId) => api.delete(`/applications/${applicationId}`),
    getApplicants: (jobId) => api.get(`/applications/job/${jobId}`),
    updateStatus: (applicationId, status) => api.put(`/applications/${applicationId}/status`, { status }),
};

export const recommendationAPI = {
    getRecommendations: (params) => api.get('/recommendations', { params }),
    getJobRecommendation: (jobId) => api.get(`/recommendations/${jobId}`),
};

export default api;
