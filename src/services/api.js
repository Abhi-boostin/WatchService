import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Don't redirect if it's a login attempt failure
            if (!error.config.url.includes('/auth/login')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/api/v1/auth/login', { username, password });
        return response.data;
    },
};

export const dashboardService = {
    getStatistics: async () => {
        const response = await api.get('/api/v1/jobs/dashboard/statistics');
        return response.data;
    },
};

export default api;
