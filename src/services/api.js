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
        // Handle 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // Don't redirect if it's a login attempt failure
            if (!error.config.url.includes('/auth/login')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        
        // Handle 422 Validation Errors
        if (error.response && error.response.status === 422) {
            const validationError = error.response.data?.error;
            
            if (validationError && validationError.fields) {
                const fields = validationError.fields;
                const fieldErrors = Object.entries(fields);
                
                if (fieldErrors.length === 1) {
                    // Single error: just show the message
                    error.displayMessage = fieldErrors[0][1];
                } else if (fieldErrors.length > 0) {
                    // Multiple errors: show bulleted list (limit to first 5)
                    const maxErrors = 5;
                    const errorsToShow = fieldErrors.slice(0, maxErrors);
                    const remaining = fieldErrors.length - maxErrors;
                    
                    error.displayMessage = 'Validation errors:\n\n' + 
                        errorsToShow.map(([field, message]) => `• ${message}`).join('\n') +
                        (remaining > 0 ? `\n\n...and ${remaining} more error${remaining > 1 ? 's' : ''}` : '');
                }
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
