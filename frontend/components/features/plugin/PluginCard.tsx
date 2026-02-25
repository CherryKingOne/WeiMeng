'use client';

import { Plugin, PluginCategory } from '@/types';
import { cn } from '@/utils';

interface PluginCardProps {
  plugin: Plugin;
  onInstall?: () => void;
  onToggle?: () => void;
}

const categoryColors: Record<PluginCategory, string> = {
  '模型训练': 'from-purple-500 to-pink-500',
  '图像生成': 'from-blue-500 to-cyan-500',
  '工具增强': 'from-green-500 to-emerald-500',
  '工作流': 'from-orange-500 to-red-500',
};

export function PluginCard({ plugin, onInstall, onToggle }: PluginCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
            categoryColors[plugin.category]
          )}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{plugin.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{plugin.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {plugin.rating}
          </span>
          <span>{plugin.downloads} 下载</span>
        </div>

        {plugin.installed ? (
          <button
            onClick={onToggle}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-xl transition-colors',
              plugin.active
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {plugin.active ? '已启用' : '已禁用'}
          </button>
        ) : (
          <button
            onClick={onInstall}
            className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            安装
          </button>
        )}
      </div>
    </div>
  );
}
