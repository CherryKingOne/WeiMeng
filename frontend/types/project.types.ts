export interface Project {
  id: string;
  name: string;
  type: 'folder' | 'project';
  updatedAt: string;
  thumbnail?: string;
  workflowCount?: number;
}

export interface Folder {
  id: string;
  name: string;
  type: 'folder';
  updatedAt: string;
  projectCount: number;
}

export interface ProjectStats {
  total: number;
  folders: number;
  recent: number;
}
