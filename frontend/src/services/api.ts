import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }
  return config;
});

// Response interceptor: handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const documentApi = {
  getDocuments: async () => {
    const response = await api.get('/documents/');
    return response.data;
  },
  
  getDocument: async (id: string | number) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  
  getDocumentAudit: async (id: number) => {
    const response = await api.get(`/documents/${id}/audit`);
    return response.data;
  },
  triggerValidation: async (id: number) => {
    const response = await api.post(`/documents/${id}/validate`);
    return response.data;
  },
  sendToGuidewire: async (id: number) => {
    const response = await api.post(`/documents/${id}/send_guidewire`);
    return response.data;
  },
  bulkSendGuidewire: async (documentIds: number[]) => {
    const response = await api.post(`/documents/bulk_send_guidewire`, { document_ids: documentIds });
    return response.data;
  },
  exportExcelUrl: `${api.defaults.baseURL}/documents/export/excel`,

  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  updateExtractedData: async (id: string | number, data: Record<string, unknown>) => {
    const response = await api.put(`/documents/${id}/extracted_data`, data);
    return response.data;
  },

  deleteDocument: async (id: string | number) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  getAuditHistory: async (id: string | number) => {
    const response = await api.get(`/documents/${id}/audit`);
    return response.data;
  }
};

export const settingsApi = {
  getSettings: async () => {
    const response = await api.get('/settings/');
    return response.data;
  },
  updateSettings: async (sharepointUrl: string, openaiApiKey?: string, guidewireUrl?: string, guidewireApiKey?: string) => {
    const payload: any = { sharepoint_url: sharepointUrl };
    if (openaiApiKey) payload.openai_api_key = openaiApiKey;
    if (guidewireUrl) payload.guidewire_api_url = guidewireUrl;
    if (guidewireApiKey) payload.guidewire_api_key = guidewireApiKey;
    
    const response = await api.post('/settings/', payload);
    return response.data;
  },
  authenticateMicrosoft: async () => {
    const response = await api.post('/settings/auth');
    return response.data;
  },
  simulateSharepointUpload: async () => {
    const response = await api.post(`/settings/simulate_sharepoint_upload`);
    return response.data;
  },
  validateOpenai: async (apiKey: string) => {
    const response = await api.post(`/settings/validate_openai`, { api_key: apiKey });
    return response.data;
  },
  validateGuidewire: async (url: string, apiKey: string) => {
    const response = await api.post(`/settings/validate_guidewire`, { url, api_key: apiKey });
    return response.data;
  }
};

export default api;
