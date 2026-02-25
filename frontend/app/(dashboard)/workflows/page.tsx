'use client';

import Link from 'next/link';

export default function WorkflowsPage() {
  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">我的工作流</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="搜索工作流..." className="pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all w-64" />
          </div>
          <Link href="/workflow-editor" className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            新建工作流
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-full">全部</button>
        <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors">草稿</button>
        <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors">已发布</button>
        <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors">模板</button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Link href="/workflow-editor" className="aspect-[4/3] rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/></svg>
          </div>
          <span className="text-sm font-medium">新建工作流</span>
        </Link>

        <Link href="/workflow-editor" className="group bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-lg transition-all relative">
          <div className="h-44 bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-gray-700">运行中</span>
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 mb-2">3D 角色生成器</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">2 小时前编辑</span>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white" />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/workflow-editor" className="group bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-lg transition-all relative">
          <div className="h-44 bg-gradient-to-br from-blue-100 to-cyan-100 relative overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 bg-gray-100 rounded-full">
              <span className="text-xs font-medium text-gray-600">草稿</span>
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 mb-2">产品海报自动化</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">昨天编辑</span>
              <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
            </div>
          </div>
        </Link>

        <Link href="/workflow-editor" className="group bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-lg transition-all relative">
          <div className="h-44 bg-gradient-to-br from-green-100 to-emerald-100 relative overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 bg-blue-50 rounded-full">
              <span className="text-xs font-medium text-blue-600">已发布</span>
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 mb-2">社交媒体内容生成</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">3 天前编辑</span>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/workflow-editor" className="group bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-lg transition-all relative">
          <div className="h-44 bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 bg-amber-50 rounded-full">
              <span className="text-xs font-medium text-amber-600">模板</span>
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 mb-2">头像风格迁移</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">1 周前编辑</span>
              <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
