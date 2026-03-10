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
  chunk_count: number;
}

export interface DeleteScriptLibraryFileResponse {
  message: string;
}

export interface CreateScriptLibraryRequest {
  name: string;
  description?: string;
}

export interface ScriptFileContent {
  id: string;
  library_id: string;
  original_name: string;
  file_extension: string;
  content: string;
  content_length: number;
}

export interface ScriptChunk {
  chunk_index: number;
  content: string;
  start_index: number;
  end_index: number;
  chunk_size: number;
}
