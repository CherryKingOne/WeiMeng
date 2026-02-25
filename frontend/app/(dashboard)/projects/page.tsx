'use client';

import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const router = useRouter();

  const projects = [
    { id: '1', name: '品牌视觉设计', workflows: 3, time: '2 小时前', gradient: 'from-purple-100 to-pink-100' },
    { id: '2', name: '3D 产品展示', workflows: 5, time: '昨天', gradient: 'from-blue-100 to-cyan-100' },
    { id: '3', name: '社交媒体海报', workflows: 2, time: '3 天前', gradient: 'from-amber-100 to-orange-100' },
    { id: '4', name: '营销素材', workflows: 8, time: '1 周前', gradient: 'from-green-100 to-emerald-100' },
  ];

  const handleNewProject = () => {
    router.push('/teams?new=true');
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/teams?projectId=${projectId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">我的项目</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="搜索项目..." className="pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all w-64" />
          </div>
          <button 
            onClick={handleNewProject}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            新建项目
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <button 
          onClick={handleNewProject}
          className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/></svg>
          <span className="text-sm font-medium">新建项目</span>
        </button>

        {projects.map((project) => (
          <div 
            key={project.id}
            onClick={() => handleOpenProject(project.id)}
            className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer"
          >
            <div className={`aspect-video bg-gradient-to-br ${project.gradient}`}></div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{project.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{project.workflows} 个工作流 · {project.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
