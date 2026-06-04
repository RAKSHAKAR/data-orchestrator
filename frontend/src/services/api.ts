import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const state = localStorage.getItem('auth-storage');
  if (state) {
    const parsed = JSON.parse(state);
    const token = parsed?.state?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const documentApi = {
  getDocuments: async () => {
    const response = await api.get('/documents/');
    return response.data;
  },
  
  getDocument: async (id: string | number) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  
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
  
  updateExtractedData: async (id: string | number, data: any) => {
    const response = await api.put(`/documents/${id}/extracted_data`, data);
    return response.data;
  }
};

export default api;
