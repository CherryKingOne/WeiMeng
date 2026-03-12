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

export interface UpsertOpenAICompatibleConfigRequest {
  provider: 'openai-compatible';
  base_url: string;
  api_key: string;
  model: string;
  max_token?: number;
  temperature?: number;
}

export interface UpsertOpenAICompatibleConfigResponse {
  provider: 'openai-compatible';
  model: string;
  configured: boolean;
  created: boolean;
}

export interface OpenAICompatibleModelItem {
  provider: 'openai-compatible';
  base_url: string;
  model: string;
  max_token?: number | null;
  temperature?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ListOpenAICompatibleModelsResponse {
  models: OpenAICompatibleModelItem[];
}

export interface DeleteOpenAICompatibleConfigResponse {
  provider: 'openai-compatible';
  model: string;
  deleted: boolean;
}

export interface UpsertSystemModelConfigRequest {
  type: 'text' | 'image' | 'video';
  provider: string;
  model_name: string;
}

export interface UpsertSystemModelConfigResponse {
  configured: boolean;
  created: boolean;
  type: 'text' | 'image' | 'video';
  provider: string;
  model_name: string;
}

export interface GetSystemModelConfigResponse {
  configured: boolean;
  type?: 'text' | 'image' | 'video' | null;
  provider?: string | null;
  model_name?: string | null;
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

  createOpenAICompatibleConfig: async (
    data: UpsertOpenAICompatibleConfigRequest,
  ): Promise<UpsertOpenAICompatibleConfigResponse> => {
    const response = await api.post<UpsertOpenAICompatibleConfigResponse>('/models/providers/openai-compatible', data);
    return response.data;
  },

  updateOpenAICompatibleConfig: async (
    data: UpsertOpenAICompatibleConfigRequest,
  ): Promise<UpsertOpenAICompatibleConfigResponse> => {
    const response = await api.put<UpsertOpenAICompatibleConfigResponse>('/models/providers/openai-compatible', data);
    return response.data;
  },

  listOpenAICompatibleConfigs: async (): Promise<ListOpenAICompatibleModelsResponse> => {
    const response = await api.get<ListOpenAICompatibleModelsResponse>('/models/providers/openai-compatible');
    return response.data;
  },

  deleteOpenAICompatibleConfig: async (model: string): Promise<DeleteOpenAICompatibleConfigResponse> => {
    const response = await api.delete<DeleteOpenAICompatibleConfigResponse>('/models/providers/openai-compatible', {
      params: { model },
    });
    return response.data;
  },

  upsertSystemModelConfig: async (
    data: UpsertSystemModelConfigRequest,
  ): Promise<UpsertSystemModelConfigResponse> => {
    const response = await api.post<UpsertSystemModelConfigResponse>('/models/system', data);
    return response.data;
  },

  getSystemModelConfig: async (): Promise<GetSystemModelConfigResponse> => {
    const response = await api.get<GetSystemModelConfigResponse>('/models/system');
    return response.data;
  },
};
