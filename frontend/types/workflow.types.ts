export type WorkflowStatus = 'draft' | 'running' | 'published' | 'template';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  lastEdited: string;
  collaborators: string[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export type NodeType = 'media' | 'video' | 'text' | 'gen' | 'videogen' | 'post' | 'upscale' | 'controlnet';

export interface NodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label?: string;
  content?: string;
  image?: string;
  config?: Record<string, unknown>;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort?: string;
  targetPort?: string;
}

export interface WorkflowState {
  nodes: NodeData[];
  connections: Connection[];
  selectedNodeId: string | null;
}
