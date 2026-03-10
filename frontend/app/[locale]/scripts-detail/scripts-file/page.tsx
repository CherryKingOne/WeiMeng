import ScriptFilePageClient, { type ScriptFilePageInitialData } from './ScriptFilePageClient';
import { fetchServerJson } from '@/lib/server-api';
import type { ScriptLibraryConfig, ScriptLibraryDetail, ScriptLibraryFile } from '@/types';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() || '';
  }

  return value?.trim() || '';
}

export default async function ScriptFilePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const libraryId = getSearchParamValue(resolvedSearchParams.library_id) || getSearchParamValue(resolvedSearchParams.libraryId);

  const initialData: ScriptFilePageInitialData = {
    files: [],
    hasInitialFiles: false,
    libraryConfig: null,
    hasInitialLibraryConfig: false,
    libraryProfile: null,
    hasInitialLibraryProfile: false,
  };

  if (libraryId) {
    const [files, libraryConfig, libraryProfile] = await Promise.all([
      fetchServerJson<ScriptLibraryFile[]>(`/scripts/libraries/${libraryId}/files`),
      fetchServerJson<ScriptLibraryConfig>(`/scripts/libraries/${libraryId}/config`),
      fetchServerJson<ScriptLibraryDetail>(`/scripts/libraries/${libraryId}`),
    ]);

    if (files) {
      initialData.files = files;
      initialData.hasInitialFiles = true;
    }

    if (libraryConfig) {
      initialData.libraryConfig = libraryConfig;
      initialData.hasInitialLibraryConfig = true;
    }

    if (libraryProfile) {
      initialData.libraryProfile = {
        name: libraryProfile.name,
        description: libraryProfile.description || '',
        avatarPath: libraryProfile.avatar_path || '',
      };
      initialData.hasInitialLibraryProfile = true;
    }
  }

  return <ScriptFilePageClient initialData={initialData} />;
}
