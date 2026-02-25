import { api } from './api';
import { Plugin, PaginatedResponse, PluginFilter } from '@/types';

export const pluginService = {
  getAll: async (filter?: PluginFilter, params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Plugin>> => {
    const response = await api.get<PaginatedResponse<Plugin>>('/plugins', {
      params: { ...filter, ...params },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Plugin> => {
    const response = await api.get<Plugin>(`/plugins/${id}`);
    return response.data;
  },

  install: async (id: string): Promise<void> => {
    await api.post(`/plugins/${id}/install`);
  },

  uninstall: async (id: string): Promise<void> => {
    await api.post(`/plugins/${id}/uninstall`);
  },

  toggleActive: async (id: string, active: boolean): Promise<void> => {
    await api.post(`/plugins/${id}/toggle`, { active });
  },

  updateConfig: async (id: string, config: Record<string, unknown>): Promise<void> => {
    await api.put(`/plugins/${id}/config`, config);
  },
};
