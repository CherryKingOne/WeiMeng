'use client';

import { Workflow } from '@/types';
import { WorkflowCard } from './WorkflowCard';

interface WorkflowGridProps {
  workflows: Workflow[];
  onWorkflowClick?: (workflow: Workflow) => void;
}

export function WorkflowGrid({ workflows, onWorkflowClick }: WorkflowGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          onClick={() => onWorkflowClick?.(workflow)}
        />
      ))}
    </div>
  );
}
