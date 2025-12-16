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
    logout: () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    },
};

export const dashboardService = {
    getStatistics: async () => {
        const response = await api.get('/api/v1/jobs/dashboard/statistics');
        return response.data;
    },
};

export const auditService = {
    getJobAuditHistory: async (jobId, page = 1, pageSize = 20) => {
        const response = await api.get(`/api/v1/audit/jobs/${jobId}/history`, {
            params: { page, page_size: pageSize }
        });
        return response.data;
    },
    getIndentAuditHistory: async (indentId, page = 1, pageSize = 20) => {
        const response = await api.get(`/api/v1/audit/indents/${indentId}/history`, {
            params: { page, page_size: pageSize }
        });
        return response.data;
    },
    getUserAuditActions: async (userId, page = 1, pageSize = 20) => {
        const response = await api.get(`/api/v1/audit/users/${userId}/actions`, {
            params: { page, page_size: pageSize }
        });
        return response.data;
    },
};

export const sparePartsService = {
    getAll: async () => {
        const response = await api.get('/api/v1/spare-parts/all');
        return response.data;
    },
    getList: async (page = 1, pageSize = 20, search = '') => {
        const params = { page, page_size: pageSize };
        if (search) params.search = search;
        const response = await api.get('/api/v1/spare-parts', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/api/v1/spare-parts/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/api/v1/spare-parts', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/api/v1/spare-parts/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/api/v1/spare-parts/${id}`);
        return response.data;
    },
};

export const complaintNodesService = {
    getTree: async () => {
        const response = await api.get('/api/v1/complaints/nodes');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/api/v1/complaints/nodes/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/api/v1/complaints/nodes', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/api/v1/complaints/nodes/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/api/v1/complaints/nodes/${id}`);
        return response.data;
    },
};

export const watchComplaintsService = {
    getForWatch: async (watchId) => {
        const response = await api.get(`/api/v1/complaints/watch-complaints/watch/${watchId}`);
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/api/v1/complaints/watch-complaints/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/api/v1/complaints/watch-complaints', data);
        return response.data;
    },
    createBatch: async (watchId, complaintNodeIds, notes = '') => {
        const response = await api.post('/api/v1/complaints/watch-complaints/batch', {
            watch_id: watchId,
            complaint_node_ids: complaintNodeIds,
            notes: notes
        });
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/api/v1/complaints/watch-complaints/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/api/v1/complaints/watch-complaints/${id}`);
        return response.data;
    },
    getIndentSuggestions: async (watchId) => {
        const response = await api.get(`/api/v1/complaints/watch-complaints/watch/${watchId}/indent-suggestions`);
        return response.data;
    },
};

export const indentsService = {
    getById: async (id) => {
        const response = await api.get(`/api/v1/indents/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/api/v1/indents', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/api/v1/indents/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/api/v1/indents/${id}`);
        return response.data;
    },
    addPart: async (indentId, sparePartId, quantity) => {
        const response = await api.post(`/api/v1/indents/${indentId}/parts`, {
            spare_part_id: sparePartId,
            quantity: quantity
        });
        return response.data;
    },
    removePart: async (indentId, sparePartId) => {
        const response = await api.delete(`/api/v1/indents/${indentId}/parts/${sparePartId}`);
        return response.data;
    },
};

export const jobsService = {
    recalculatePricing: async (jobId, applyToJob = true) => {
        const response = await api.post(`/api/v1/jobs/${jobId}/recalculate-pricing`, {
            apply_to_job: applyToJob
        });
        return response.data;
    },
};

export const systemService = {
    // Worker Status
    getWorkerStatus: async () => {
        const response = await api.get('/api/v1/system/workers/status');
        return response.data;
    },
    
    // Cleanup Operations
    previewCleanup: async (retentionDays) => {
        const response = await api.post('/api/v1/system/cleanup/preview', {
            retention_days: retentionDays
        });
        return response.data;
    },
    runCleanup: async (retentionDays) => {
        const response = await api.post('/api/v1/system/cleanup/run', {
            retention_days: retentionDays
        });
        return response.data;
    },
    
    // Backup Operations
    createBackup: async (includeAttachments = false) => {
        const response = await api.post('/api/v1/system/backup/run', {
            include_attachments: includeAttachments
        });
        return response.data;
    },
    listBackups: async () => {
        const response = await api.get('/api/v1/system/backup/list');
        return response.data;
    },
    downloadBackup: async (filename) => {
        const response = await api.get(`/api/v1/system/backup/download/${filename}`, {
            responseType: 'blob'
        });
        return response;
    },
    deleteBackup: async (filename) => {
        const response = await api.delete(`/api/v1/system/backup/${filename}`);
        return response.data;
    },
};

export default api;
