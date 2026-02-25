import { create } from 'zustand';
import { NodeData, Connection } from '@/types';

interface WorkflowState {
  nodes: NodeData[];
  connections: Connection[];
  selectedNodeId: string | null;
  isRunning: boolean;
  hasResult: boolean;
  setNodes: (nodes: NodeData[]) => void;
  setConnections: (connections: Connection[]) => void;
  addNode: (node: NodeData) => void;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  setRunning: (running: boolean) => void;
  setHasResult: (hasResult: boolean) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: [],
  connections: [],
  selectedNodeId: null,
  isRunning: false,
  hasResult: false,
  setNodes: (nodes) => set({ nodes }),
  setConnections: (connections) => set({ connections }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter(
        (c) => c.sourceId !== id && c.targetId !== id
      ),
    })),
  selectNode: (id) => set({ selectedNodeId: id }),
  setRunning: (isRunning) => set({ isRunning }),
  setHasResult: (hasResult) => set({ hasResult }),
  reset: () =>
    set({
      nodes: [],
      connections: [],
      selectedNodeId: null,
      isRunning: false,
      hasResult: false,
    }),
}));
