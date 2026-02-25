import { api } from './api';
import { Workflow, PaginatedResponse } from '@/types';

export const workflowService = {
  getAll: async (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Workflow>> => {
    const response = await api.get<PaginatedResponse<Workflow>>('/workflows', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Workflow> => {
    const response = await api.get<Workflow>(`/workflows/${id}`);
    return response.data;
  },

  create: async (data: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.post<Workflow>('/workflows', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.put<Workflow>(`/workflows/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/workflows/${id}`);
  },

  duplicate: async (id: string): Promise<Workflow> => {
    const response = await api.post<Workflow>(`/workflows/${id}/duplicate`);
    return response.data;
  },
};
