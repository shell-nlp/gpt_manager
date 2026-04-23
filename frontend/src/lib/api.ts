const API_BASE = '/api';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Request failed');
  }

  return data;
}

export interface DockerInfo {
  containers_running: number;
  containers_total: number;
  images_total: number;
  driver: string;
  nvidia_version: string;
  memory_total: number;
}

export interface Backend {
  value: string;
  label: string;
}

export interface Images {
  sglang_image: string;
  vllm_image: string;
  gateway_image: string;
}

export interface Model {
  id: string;
  name: string;
  backend_type: string;
  model_path: string;
  served_model_name: string;
  host: string;
  port: number;
  tensor_parallel: number;
  gpu_ids: number[];
  image: string;
  status: string;
  container_name: string;
}

export interface Gateway {
  host: string;
  port: number;
  policy: string;
  image: string;
  worker_urls: string[];
  status: string;
}

export interface WorkerUrlStatus {
  url: string;
  status: 'healthy' | 'unhealthy';
  error?: string;
  models?: string[];
}

export const API = {
  getDockerInfo: () => apiRequest<DockerInfo>('/docker/info'),

  getBackends: () => apiRequest<{ backends: Backend[] }>('/config/backends'),

  getImages: () => apiRequest<Images>('/config/images'),

  updateImages: (data: Partial<Images>) =>
    apiRequest('/config/images', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listModels: () => apiRequest<{ models: Model[] }>('/models'),

  createModel: (data: Omit<Model, 'id' | 'status' | 'container_name'>) =>
    apiRequest<Model>('/models', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getModel: (id: string) => apiRequest<Model>(`/models/${id}`),

  startModel: (id: string) =>
    apiRequest(`/models/${id}/start`, { method: 'POST' }),

  stopModel: (id: string) =>
    apiRequest(`/models/${id}/stop`, { method: 'POST' }),

  restartModel: (id: string) =>
    apiRequest(`/models/${id}/restart`, { method: 'POST' }),

  deleteModel: (id: string) =>
    apiRequest(`/models/${id}`, { method: 'DELETE' }),

  getModelLogs: (id: string, tail = 100) =>
    apiRequest<{ logs: string }>(`/models/${id}/logs?tail=${tail}`),

  getGateway: () => apiRequest<Gateway>('/gateway'),

  startGateway: () =>
    apiRequest('/gateway/start', { method: 'POST' }),

  stopGateway: () =>
    apiRequest('/gateway/stop', { method: 'POST' }),

  restartGateway: () =>
    apiRequest('/gateway/restart', { method: 'POST' }),

  updateGateway: (data: Partial<Gateway>) =>
    apiRequest('/gateway', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getGatewayLogs: (tail = 100) =>
    apiRequest<{ logs: string }>(`/gateway/logs?tail=${tail}`),

  getWorkerUrls: () => apiRequest<{ worker_urls: string[] }>('/worker-urls'),

  checkWorkerUrls: () =>
    apiRequest<{ results: WorkerUrlStatus[] }>('/worker-urls/check'),

  syncWorkerUrls: () =>
    apiRequest('/gateway/worker-urls/sync', { method: 'POST' }),
};
