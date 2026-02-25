import { api } from './api';
import { Project, PaginatedResponse } from '@/types';

export const projectService = {
  getAll: async (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Project>> => {
    const response = await api.get<PaginatedResponse<Project>>('/projects', { params });
    return response.data;
  },

  create: async (data: Partial<Project>): Promise<Project> => {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};
