import { api } from './api';
import { Asset, PaginatedResponse, AssetFilter } from '@/types';

export const assetService = {
  getAll: async (filter?: AssetFilter, params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Asset>> => {
    const response = await api.get<PaginatedResponse<Asset>>('/assets', {
      params: { ...filter, ...params },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Asset> => {
    const response = await api.get<Asset>(`/assets/${id}`);
    return response.data;
  },

  create: async (data: Partial<Asset>): Promise<Asset> => {
    const response = await api.post<Asset>('/assets', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/assets/${id}`);
  },

  toggleFavorite: async (id: string): Promise<void> => {
    await api.post(`/assets/${id}/favorite`);
  },
};
