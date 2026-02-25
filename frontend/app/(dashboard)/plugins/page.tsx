'use client';

import { useState } from 'react';

export default function PluginsPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: '全部' },
    { id: 'installed', label: '已安装' },
    { id: 'model', label: '模型训练' },
    { id: 'image', label: '图像生成' },
    { id: 'tool', label: '工具增强' },
  ];

  const plugins = [
    { name: 'Stable Diffusion XL', category: '图像生成', rating: 4.8, downloads: '10K+', installed: true, active: true },
    { name: 'LoRA Trainer', category: '模型训练', rating: 4.5, downloads: '5K+', installed: true, active: false },
    { name: 'ControlNet', category: '图像生成', rating: 4.9, downloads: '20K+', installed: false, active: false },
    { name: 'Batch Processor', category: '工具增强', rating: 4.3, downloads: '3K+', installed: false, active: false },
  ];

  const categoryColors: Record<string, string> = {
    '模型训练': 'from-purple-500 to-pink-500',
    '图像生成': 'from-blue-500 to-cyan-500',
    '工具增强': 'from-green-500 to-emerald-500',
    '工作流': 'from-orange-500 to-red-500',
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">插件市场</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="搜索插件..." className="pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all w-64" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              activeFilter === filter.id
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plugins.map((plugin, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${categoryColors[plugin.category]}`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{plugin.name}</h3>
                <p className="text-sm text-gray-500">{plugin.category}</p>
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
                <button className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  plugin.active
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  {plugin.active ? '已启用' : '已禁用'}
                </button>
              ) : (
                <button className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors">
                  安装
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
