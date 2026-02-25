import { api } from './api';
import { Script, PaginatedResponse, ScriptFilter } from '@/types';

export const scriptService = {
  getAll: async (filter?: ScriptFilter, params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Script>> => {
    const response = await api.get<PaginatedResponse<Script>>('/scripts', {
      params: { ...filter, ...params },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Script> => {
    const response = await api.get<Script>(`/scripts/${id}`);
    return response.data;
  },

  create: async (data: Partial<Script>): Promise<Script> => {
    const response = await api.post<Script>('/scripts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Script>): Promise<Script> => {
    const response = await api.put<Script>(`/scripts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/scripts/${id}`);
  },

  import: async (data: { title: string; content: string; format: string }): Promise<Script> => {
    const response = await api.post<Script>('/scripts/import', data);
    return response.data;
  },
};
