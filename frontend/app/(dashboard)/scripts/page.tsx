'use client';

import { useState } from 'react';

export default function ScriptsPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: '全部' },
    { id: 'draft', label: '草稿' },
    { id: 'reviewing', label: '审核中' },
    { id: 'published', label: '已发布' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">剧本库</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="搜索剧本..." className="pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all w-64" />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            导入剧本
          </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                i === 0 ? 'bg-gray-100 text-gray-700' :
                i === 1 ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {i === 0 ? '草稿' : i === 1 ? '审核中' : '已发布'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
              剧本标题 {i + 1}
            </h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">这是剧本的描述内容，包含主要情节和角色设定...</p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{1000 + i * 500} 字</span>
              <span>{5 + i * 2} 场景</span>
              <span>更新于 {i + 1} 天前</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
