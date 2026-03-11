import type { ProviderModelItem } from '@/services/provider.service';
import { fetchServerJson } from '@/lib/server-api';
import PublicSidebarLayoutClient from './PublicSidebarLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const providersResponse = await fetchServerJson<{ providers: ProviderModelItem[] }>('/models');
  const initialProviderModels = providersResponse?.providers || [];
  const hasInitialProviderModels = Array.isArray(providersResponse?.providers);

  return (
    <PublicSidebarLayoutClient
      initialProviderModels={initialProviderModels}
      hasInitialProviderModels={hasInitialProviderModels}
    >
      {children}
    </PublicSidebarLayoutClient>
  );
}
