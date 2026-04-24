const API_BASE = '/api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<any>> = {};
const CACHE_TTL = 3000;

function clearCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}, skipCache = false): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  if (!skipCache && options.method === undefined) {
    const cached = cache[url];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

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

  if (options.method === undefined) {
    cache[url] = { data, timestamp: Date.now() };
  } else {
    clearCache();
  }

  return data;
}

export interface DockerInfo {
  version?: string;
  containers_running: number;
  containers_total: number;
  containers_stopped?: number;
  images?: number;
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

export interface DockerConfig {
  pull_registry: string;
}

export interface ImageStatus {
  sglang_image: string;
  sglang_image_pulled: boolean;
  vllm_image: string;
  vllm_image_pulled: boolean;
  gateway_image: string;
  gateway_image_pulled: boolean;
}

export interface PullTask {
  id: string;
  image: string;
  status: 'pending' | 'pulling' | 'completed' | 'failed';
  progress: string;
  error?: string;
  started_at?: string;
  completed_at?: string;
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

export interface RoutedWorker {
  url: string;
  models: string[];
}

export interface RoutedModel {
  id: string;
  workers: string[];
}

export interface GatewayRoutes {
  gateway_url: string;
  models: RoutedModel[];
  workers: RoutedWorker[];
  error?: string;
}

export const API = {
  getDockerInfo: () => apiRequest<DockerInfo>('/docker/info'),

  getBackends: () => apiRequest<{ backends: Backend[] }>('/config/backends'),

  getImages: () => apiRequest<Images>('/config/images'),

  getImageStatus: () => apiRequest<ImageStatus>('/config/images/status'),

  pullImage: (image: string) =>
    apiRequest<{ task_id: string; message: string; image: string }>('/images/pull', {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),

  getPullTaskStatus: (taskId: string) =>
    apiRequest<PullTask>(`/images/pull/${taskId}`),

  listPullTasks: () =>
    apiRequest<{ tasks: PullTask[] }>('/images/pull'),

  updateImages: (data: Partial<Images>) =>
    apiRequest('/config/images', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getDockerConfig: () => apiRequest<DockerConfig>('/config/docker'),

  updateDockerConfig: (data: Partial<DockerConfig>) =>
    apiRequest('/config/docker', {
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

  getGatewayRoutes: () => apiRequest<GatewayRoutes>('/gateway/routes'),

  getWorkerUrls: () => apiRequest<{ worker_urls: string[] }>('/worker-urls'),

  checkWorkerUrls: () =>
    apiRequest<{ results: WorkerUrlStatus[] }>('/worker-urls/check'),

  syncWorkerUrls: () =>
    apiRequest('/gateway/worker-urls/sync', { method: 'POST' }),
};
