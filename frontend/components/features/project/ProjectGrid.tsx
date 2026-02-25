'use client';

import { Project } from '@/types';
import { ProjectCard, FolderCard } from './ProjectCard';

interface ProjectGridProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
}

export function ProjectGrid({ projects, onProjectClick }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => (
        project.type === 'folder' ? (
          <FolderCard
            key={project.id}
            project={project}
            onClick={() => onProjectClick?.(project)}
          />
        ) : (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onProjectClick?.(project)}
          />
        )
      ))}
    </div>
  );
}
