import { api } from './api';
import {
  CreateScriptLibraryRequest,
  DeleteScriptLibraryFileResponse,
  PaginatedResponse,
  Script,
  ScriptChunk,
  ScriptFileContent,
  ScriptFilter,
  ScriptLibrary,
  ScriptLibraryDetail,
  ScriptLibraryConfig,
  ScriptLibraryFile,
  UpdateScriptLibraryRequest,
} from '@/types';

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

  createLibrary: async (data: CreateScriptLibraryRequest): Promise<ScriptLibrary> => {
    const response = await api.post<ScriptLibrary>('/scripts/libraries', data);
    return response.data;
  },

  listLibraries: async (): Promise<ScriptLibrary[]> => {
    const response = await api.get<ScriptLibrary[]>('/scripts/libraries');
    return response.data;
  },

  getLibrary: async (libraryId: string): Promise<ScriptLibraryDetail> => {
    const response = await api.get<ScriptLibraryDetail>(`/scripts/libraries/${libraryId}`);
    return response.data;
  },

  updateLibrary: async (libraryId: string, data: UpdateScriptLibraryRequest): Promise<ScriptLibrary> => {
    const response = await api.put<ScriptLibrary>(`/scripts/libraries/${libraryId}`, data);
    return response.data;
  },

  listLibraryFiles: async (libraryId: string): Promise<ScriptLibraryFile[]> => {
    const response = await api.get<ScriptLibraryFile[]>(`/scripts/libraries/${libraryId}/files`);
    return response.data;
  },

  deleteLibraryFile: async (libraryId: string, scriptId: string): Promise<DeleteScriptLibraryFileResponse> => {
    const response = await api.delete<DeleteScriptLibraryFileResponse>(`/scripts/libraries/${libraryId}/files/${scriptId}`);
    return response.data;
  },

  uploadLibraryFile: async (libraryId: string, file: File): Promise<ScriptLibraryFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ScriptLibraryFile>(`/scripts/libraries/${libraryId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadLibraryAvatar: async (libraryId: string, file: File): Promise<ScriptLibrary> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ScriptLibrary>(`/scripts/libraries/${libraryId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getLibraryFileContent: async (libraryId: string, scriptId: string): Promise<ScriptFileContent> => {
    const response = await api.get<ScriptFileContent>(`/scripts/libraries/${libraryId}/files/${scriptId}/content`);
    return response.data;
  },

  getLibraryFileChunks: async (libraryId: string, scriptId: string): Promise<ScriptChunk[]> => {
    const response = await api.get<ScriptChunk[]>(`/scripts/libraries/${libraryId}/files/${scriptId}/chunks`);
    return response.data;
  },

  executeLibraryFileChunks: async (libraryId: string, scriptId: string): Promise<ScriptChunk[]> => {
    const response = await api.post<ScriptChunk[]>(`/scripts/libraries/${libraryId}/files/${scriptId}/chunks`);
    return response.data;
  },

  getLibraryConfig: async (libraryId: string): Promise<ScriptLibraryConfig> => {
    const response = await api.get<ScriptLibraryConfig>(`/scripts/libraries/${libraryId}/config`);
    return response.data;
  },

  updateLibraryConfig: async (
    libraryId: string,
    data: { chunk_size: number; overlap: number },
  ): Promise<ScriptLibraryConfig> => {
    const response = await api.put<ScriptLibraryConfig>(`/scripts/libraries/${libraryId}/config`, data);
    return response.data;
  },
};
