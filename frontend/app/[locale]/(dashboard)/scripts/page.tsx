'use client';

import { useState } from 'react';
import { useLocalePath } from '@/hooks/useLocalePath';

export default function ScriptsPage() {
  const { locale } = useLocalePath();
  const isEn = locale === 'en';
  const [activeFilter, setActiveFilter] = useState('all');

  const text = {
    title: isEn ? 'Script Library' : '剧本库',
    searchPlaceholder: isEn ? 'Search scripts...' : '搜索剧本...',
    importScript: isEn ? 'Import Script' : '导入剧本',
    filters: {
      all: isEn ? 'All' : '全部',
      draft: isEn ? 'Draft' : '草稿',
      reviewing: isEn ? 'Reviewing' : '审核中',
      published: isEn ? 'Published' : '已发布',
    },
    status: {
      draft: isEn ? 'Draft' : '草稿',
      reviewing: isEn ? 'Reviewing' : '审核中',
      published: isEn ? 'Published' : '已发布',
    },
    words: (count: number) => (isEn ? `${count} words` : `${count} 字`),
    scenes: (count: number) => (isEn ? `${count} scenes` : `${count} 场景`),
    updated: (days: number) => (isEn ? `Updated ${days} day${days === 1 ? '' : 's'} ago` : `更新于 ${days} 天前`),
  };

  const filters = [
    { id: 'all', label: text.filters.all },
    { id: 'draft', label: text.filters.draft },
    { id: 'reviewing', label: text.filters.reviewing },
    { id: 'published', label: text.filters.published },
  ];

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{text.title}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder={text.searchPlaceholder} className="pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all w-64" />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            {text.importScript}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all">
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white">
              <div className="rhythm-line h-1.5 bg-black rounded-full w-full origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[90%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[75%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[85%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[60%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[50%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[80%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[70%] origin-left" />
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[80%] origin-left mt-2" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[65%] origin-left" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-medium text-green-700 tracking-wider">科幻</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">黑客帝国</h3>
                <p className="text-xs text-gray-400 mt-1">经典开场片段</p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-black">12</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-black">08</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">2.3k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all">
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white relative">
              <div className="absolute inset-0 bg-blue-50/30 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
              <div className="rhythm-line h-1.5 bg-gray-200 rounded-full w-full origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-200 rounded-full w-[85%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-200 rounded-full w-[70%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[55%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-200 rounded-full w-[75%] origin-left" />
              <div className="rhythm-line h-1.5 bg-gray-200 rounded-full w-[70%] origin-left mt-2" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-blue-100 rounded-full text-[10px] font-medium text-blue-700 tracking-wider">冒险</span>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">火星救援</h3>
                <p className="text-xs text-blue-600 mt-1 font-mono">
                  AI 分析中
                  <span className="loading-dots" aria-hidden="true" />
                </p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-gray-400">--</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-gray-400">--</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">4.8k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all">
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white">
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[90%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-full origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[80%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[70%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[55%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[65%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[75%] origin-left" />
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[85%] origin-left mt-2" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-medium text-green-700 tracking-wider">剧情</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">星际穿越</h3>
                <p className="text-xs text-gray-400 mt-1">逃生舱片段</p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-black">08</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-black">05</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">1.5k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all">
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white">
              <div className="rhythm-line h-1.5 bg-black rounded-full w-full origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[85%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[90%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[70%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[60%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[80%] origin-left" />
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[75%] origin-left mt-2" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-medium text-green-700 tracking-wider">奇幻</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">指环王</h3>
                <p className="text-xs text-gray-400 mt-1">森林之子</p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-black">15</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-black">12</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">3.2k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all">
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white">
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[85%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[75%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[90%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[50%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[65%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[80%] origin-left" />
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[70%] origin-left mt-2" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-medium text-green-700 tracking-wider">恐怖</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">科学怪人</h3>
                <p className="text-xs text-gray-400 mt-1">创造</p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-black">06</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-black">04</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">2.8k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all">
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white">
              <div className="rhythm-line h-1.5 bg-black rounded-full w-full origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[80%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[70%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[55%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[60%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[85%] origin-left" />
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[80%] origin-left mt-2" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-medium text-green-700 tracking-wider">爱情</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">泰坦尼克号</h3>
                <p className="text-xs text-gray-400 mt-1">甲板日落</p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-black">10</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-black">06</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">4.1k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes rhythm-pulse {
          0%,
          100% {
            transform: scaleX(1);
          }
          50% {
            transform: scaleX(0.95);
          }
        }

        .script-card:hover .rhythm-line {
          animation: rhythm-pulse 0.6s ease-in-out infinite;
        }

        .script-card:hover .rhythm-line:nth-child(2n) {
          animation-delay: 0.1s;
        }

        .script-card:hover .rhythm-line:nth-child(3n) {
          animation-delay: 0.2s;
        }

        .script-card:hover .rhythm-line:nth-child(4n) {
          animation-delay: 0.15s;
        }

        .loading-dots {
          display: inline-block;
          width: 1ch;
          overflow: hidden;
          vertical-align: bottom;
          animation: dots-loop 1.2s infinite;
        }

        .loading-dots::before {
          content: '...';
        }

        @keyframes dots-loop {
          0% {
            width: 1ch;
          }
          33% {
            width: 2ch;
          }
          66% {
            width: 3ch;
          }
          100% {
            width: 1ch;
          }
        }
      `}</style>
    </div>
  );
}
