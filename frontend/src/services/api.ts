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
  exportExcel: async (documentIds: number[]) => {
    const response = await fetch(`${api.defaults.baseURL}/documents/export/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
      },
      body: JSON.stringify({ document_ids: documentIds }),
    });
    if (!response.ok) throw new Error('Failed to export excel');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documents_export.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  downloadSampleUrl: `${api.defaults.baseURL}/documents/sample/download`,

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
  updateSettings: async (sharepointUrl: string, openaiApiKey?: string, guidewireUrl?: string, guidewireApiKey?: string, azureClientId?: string, azureTenantId?: string) => {
    const payload: any = { sharepoint_url: sharepointUrl };
    if (openaiApiKey) payload.openai_api_key = openaiApiKey;
    if (guidewireUrl) payload.guidewire_api_url = guidewireUrl;
    if (guidewireApiKey) payload.guidewire_api_key = guidewireApiKey;
    if (azureClientId) payload.azure_client_id = azureClientId;
    if (azureTenantId) payload.azure_tenant_id = azureTenantId;
    
    const response = await api.post('/settings/', payload);
    return response.data;
  },
  authenticateMicrosoft: async () => {
    const response = await api.post('/settings/auth');
    return response.data;
  },
  signOutMicrosoft: async () => {
    const response = await api.post('/settings/auth/logout');
    return response.data;
  },
  testSharepoint: async (url: string, token: string) => {
    const response = await api.post(`/settings/test_sharepoint`, { url, token });
    return response.data;
  },
  toggleSync: async (enabled: boolean, token: string) => {
    const response = await api.post(`/settings/toggle_sync`, { enabled, token });
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
