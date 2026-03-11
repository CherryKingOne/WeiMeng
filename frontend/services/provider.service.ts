import { api } from './api';

export interface SupportedProviderItem {
  provider: string;
  model_types: string[];
  configured: boolean;
}

export interface SupportedProvidersResponse {
  providers: SupportedProviderItem[];
}

export interface ProviderModelItem {
  provider: string;
  configured: boolean;
  model_types: string[];
  conversation_template?: string;
  default_model?: string;
  models: string[];
  selected_model?: string | null;
  selected_model_detail?: Record<string, unknown> | null;
}

export interface ProviderModelsResponse {
  providers: ProviderModelItem[];
}

export interface UpsertProviderConfigRequest {
  provider: string;
  api_key: string;
}

export interface UpsertProviderConfigResponse {
  provider: string;
  configured: boolean;
  created: boolean;
}

export const providerService = {
  getSupportedProviders: async (): Promise<SupportedProvidersResponse> => {
    const response = await api.get<SupportedProvidersResponse>('/models/providers');
    return response.data;
  },

  getProviderModels: async (params?: { provider?: string; model?: string }): Promise<ProviderModelsResponse> => {
    const response = await api.get<ProviderModelsResponse>('/models', { params });
    return response.data;
  },

  upsertProviderConfig: async (data: UpsertProviderConfigRequest): Promise<UpsertProviderConfigResponse> => {
    const response = await api.post<UpsertProviderConfigResponse>('/models/providers', data);
    return response.data;
  },
};
