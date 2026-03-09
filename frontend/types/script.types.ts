export type ScriptStatus = 'draft' | 'reviewing' | 'published' | 'archived';

export interface Script {
  id: string;
  title: string;
  description?: string;
  status: ScriptStatus;
  wordCount: number;
  scenes: number;
  updatedAt: string;
  createdAt: string;
  tags?: string[];
}

export interface ScriptImport {
  title: string;
  content: string;
  format: 'txt' | 'pdf' | 'docx';
}

export interface ScriptFilter {
  status: ScriptStatus | 'all';
  search: string;
}

export interface ScriptLibrary {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface ScriptLibraryFile {
  id: string;
  library_id: string;
  original_name: string;
  file_extension: string;
  content_type: string;
  file_size: number;
  created_at: string;
}

export interface DeleteScriptLibraryFileResponse {
  message: string;
}

export interface CreateScriptLibraryRequest {
  name: string;
  description?: string;
}
