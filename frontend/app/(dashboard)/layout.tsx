'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { SettingsModal } from '@/components/features/settings';
import { useSettingsStore } from '@/stores';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, closeSettings } = useSettingsStore();

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans">
      <Sidebar />
      <SettingsModal isOpen={isOpen} onClose={closeSettings} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
