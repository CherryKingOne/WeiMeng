'use client';

import type { ProviderModelItem } from '@/services/provider.service';
import { SettingsModal } from '@/components/features/settings';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSettingsStore } from '@/stores';

type PublicSidebarLayoutClientProps = {
  children: React.ReactNode;
  initialProviderModels: ProviderModelItem[];
  hasInitialProviderModels: boolean;
};

export default function PublicSidebarLayoutClient({
  children,
  initialProviderModels,
  hasInitialProviderModels,
}: PublicSidebarLayoutClientProps) {
  const { isOpen, closeSettings } = useSettingsStore();

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans">
      <Sidebar />
      <SettingsModal
        isOpen={isOpen}
        onClose={closeSettings}
        initialProviderModels={initialProviderModels}
        hasInitialProviderModels={hasInitialProviderModels}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
