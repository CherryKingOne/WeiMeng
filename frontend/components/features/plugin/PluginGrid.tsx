'use client';

import { Plugin } from '@/types';
import { PluginCard } from './PluginCard';

interface PluginGridProps {
  plugins: Plugin[];
  onInstall?: (plugin: Plugin) => void;
  onToggle?: (plugin: Plugin) => void;
}

export function PluginGrid({ plugins, onInstall, onToggle }: PluginGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plugins.map((plugin) => (
        <PluginCard
          key={plugin.id}
          plugin={plugin}
          onInstall={() => onInstall?.(plugin)}
          onToggle={() => onToggle?.(plugin)}
        />
      ))}
    </div>
  );
}
