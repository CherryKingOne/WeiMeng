'use client';

import { Script } from '@/types';
import { ScriptCard } from './ScriptCard';

interface ScriptGridProps {
  scripts: Script[];
  onScriptClick?: (script: Script) => void;
}

export function ScriptGrid({ scripts, onScriptClick }: ScriptGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {scripts.map((script) => (
        <ScriptCard
          key={script.id}
          script={script}
          onClick={() => onScriptClick?.(script)}
        />
      ))}
    </div>
  );
}
