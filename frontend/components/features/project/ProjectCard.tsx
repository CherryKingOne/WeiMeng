'use client';

import { Project } from '@/types';
import { formatRelativeTime } from '@/utils';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group"
    >
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
        {project.name}
      </h3>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>更新于 {formatRelativeTime(project.updatedAt)}</span>
        {project.workflowCount !== undefined && (
          <span>{project.workflowCount} 个工作流</span>
        )}
      </div>
    </div>
  );
}

export function FolderCard({ project, onClick }: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group"
    >
      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
        {project.name}
      </h3>

      <div className="text-xs text-gray-400">
        <span>更新于 {formatRelativeTime(project.updatedAt)}</span>
      </div>
    </div>
  );
}
