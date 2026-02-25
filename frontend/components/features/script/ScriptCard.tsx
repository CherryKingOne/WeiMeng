'use client';

import { Script, ScriptStatus } from '@/types';
import { Badge } from '@/components/ui';
import { formatRelativeTime } from '@/utils';

interface ScriptCardProps {
  script: Script;
  onClick?: () => void;
}

const statusConfig: Record<ScriptStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  draft: { label: '草稿', variant: 'default' },
  reviewing: { label: '审核中', variant: 'info' },
  published: { label: '已发布', variant: 'success' },
  archived: { label: '已归档', variant: 'warning' },
};

export function ScriptCard({ script, onClick }: ScriptCardProps) {
  const status = statusConfig[script.status];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
        {script.title}
      </h3>

      {script.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{script.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{script.wordCount} 字</span>
        <span>{script.scenes} 场景</span>
        <span>更新于 {formatRelativeTime(script.updatedAt)}</span>
      </div>
    </div>
  );
}
