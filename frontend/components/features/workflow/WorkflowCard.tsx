'use client';

import { Workflow, WorkflowStatus } from '@/types';
import { Badge } from '@/components/ui';
import { formatRelativeTime } from '@/utils';

interface WorkflowCardProps {
  workflow: Workflow;
  onClick?: () => void;
}

const statusConfig: Record<WorkflowStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  draft: { label: '草稿', variant: 'default' },
  running: { label: '运行中', variant: 'info' },
  published: { label: '已发布', variant: 'success' },
  template: { label: '模板', variant: 'warning' },
};

export function WorkflowCard({ workflow, onClick }: WorkflowCardProps) {
  const status = statusConfig[workflow.status];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
        {workflow.name}
      </h3>

      {workflow.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{workflow.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>编辑于 {formatRelativeTime(workflow.lastEdited)}</span>
        {workflow.collaborators.length > 0 && (
          <div className="flex -space-x-2">
            {workflow.collaborators.slice(0, 3).map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
