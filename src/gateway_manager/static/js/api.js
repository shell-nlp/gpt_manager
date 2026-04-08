const API_BASE = '';

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

const API = {
    getDockerInfo: () => apiRequest('/api/docker/info'),

    listModels: () => apiRequest('/api/models'),

    createModel: (data) => apiRequest('/api/models', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getModel: (id) => apiRequest(`/api/models/${id}`),

    startModel: (id) => apiRequest(`/api/models/${id}/start`, { method: 'POST' }),

    stopModel: (id) => apiRequest(`/api/models/${id}/stop`, { method: 'POST' }),

    restartModel: (id) => apiRequest(`/api/models/${id}/restart`, { method: 'POST' }),

    deleteModel: (id) => apiRequest(`/api/models/${id}`, { method: 'DELETE' }),

    updateModel: (id, data) => apiRequest(`/api/models/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    getModelLogs: (id, tail = 100) => apiRequest(`/api/models/${id}/logs?tail=${tail}`),

    getGateway: () => apiRequest('/api/gateway'),

    startGateway: () => apiRequest('/api/gateway/start', { method: 'POST' }),

    stopGateway: () => apiRequest('/api/gateway/stop', { method: 'POST' }),

    restartGateway: () => apiRequest('/api/gateway/restart', { method: 'POST' }),

    updateGateway: (data) => apiRequest('/api/gateway', {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    getGatewayLogs: (tail = 100) => apiRequest(`/api/gateway/logs?tail=${tail}`),

    getGatewayWorkerUrls: () => apiRequest('/api/gateway/worker-urls'),

    syncWorkerUrls: () => apiRequest('/api/gateway/worker-urls/sync', { method: 'POST' }),

    getImages: () => apiRequest('/api/config/images'),

    updateImages: (data) => apiRequest('/api/config/images', {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    getWorkerUrls: () => apiRequest('/api/worker-urls'),

    checkWorkerUrls: () => apiRequest('/api/worker-urls/check'),

    getBackendTypes: () => apiRequest('/api/backend/types'),

    getPolicyTypes: () => apiRequest('/api/policy/types'),
};

window.API = API;
