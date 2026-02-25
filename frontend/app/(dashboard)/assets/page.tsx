'use client';

import { useState } from 'react';

export default function AssetsPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: '全部' },
    { id: 'image', label: '图片' },
    { id: '3d', label: '3D' },
    { id: 'video', label: '视频' },
    { id: 'favorite', label: '收藏' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">资产库</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="搜索资产..." className="pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all w-64" />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            上传资产
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group">
            <div
              className="aspect-square flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${
                  ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#a5f3fc', '#c7d2fe', '#f5d0fe'][
                    i % 7
                  ]
                }, ${
                  ['#fca5a5', '#fdba74', '#facc15', '#86efac', '#67e8f9', '#a5b4fc', '#e879f9'][
                    i % 7
                  ]
                })`,
              }}
            >
              <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-black transition-colors truncate">
                资产 {i + 1}
              </h3>
              <p className="text-xs text-gray-500 truncate">Creator</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
