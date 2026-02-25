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
