'use client';

import { useRouter } from 'next/navigation';
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocalePath } from '@/hooks/useLocalePath';
import { scriptService } from '@/services';
import type { ScriptLibrary } from '@/types';
import { localizeRequestError } from '@/utils';

type ScriptCardTone = 'green' | 'blue' | 'red';
type FetchMode = 'initial' | 'refresh' | 'silent';

type ScriptCardMeta = {
  libraryId: string;
  title: string;
  subtitle: string;
  createdAt: string;
  tone: ScriptCardTone;
};

const toneCycle: ScriptCardTone[] = ['green', 'blue', 'red'];

const toneClasses: Record<ScriptCardTone, { badge: string; dot: string }> = {
  green: {
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-emerald-500',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  red: {
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

export default function ScriptsPage() {
  const router = useRouter();
  const { locale, withLocalePath } = useLocalePath();
  const isEn = locale === 'en';
  const scriptDetailPath = withLocalePath('/scripts-detail/scripts-file');

  const [keyword, setKeyword] = useState('');
  const [libraries, setLibraries] = useState<ScriptLibrary[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [librariesError, setLibrariesError] = useState('');

  const librariesRef = useRef<ScriptLibrary[]>([]);
  useEffect(() => {
    librariesRef.current = libraries;
  }, [libraries]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [scriptName, setScriptName] = useState('');
  const [scriptDescription, setScriptDescription] = useState('');
  const [scriptNameError, setScriptNameError] = useState(false);
  const [createScriptError, setCreateScriptError] = useState('');
  const [isCreatingScript, setIsCreatingScript] = useState(false);

  const text = {
    title: isEn ? 'Script Library' : '剧本库',
    searchPlaceholder: isEn ? 'Search libraries...' : '搜索剧本库...',
    createScript: isEn ? 'Create Script' : '创建剧本',
    syncing: isEn ? 'Syncing...' : '同步中...',
    loadingLibraries: isEn ? 'Loading script libraries...' : '正在加载剧本库...',
    emptyLibraries: isEn ? 'No script libraries yet' : '暂无剧本库',
    noSearchResult: isEn ? 'No matching script libraries' : '没有匹配的剧本库',
    noDescription: isEn ? 'No description' : '暂无描述',
    retry: isEn ? 'Retry' : '重试',
    createdAt: (value: string) => (isEn ? `Created at ${value}` : `创建于 ${value}`),
    openLibrary: isEn ? 'Open library' : '进入剧本库',
    libraryTag: isEn ? 'Library' : '剧本库',
    modal: {
      title: isEn ? 'Create Script' : '创建剧本',
      subtitle: isEn
        ? 'After creation, it will be added to your script library.'
        : '创建后将加入剧本库，可继续编辑内容',
      nameLabel: isEn ? 'Name' : '名称',
      namePlaceholder: isEn ? 'Enter script name' : '输入剧本名称',
      nameHint: isEn ? 'Up to 50 characters' : '最多 50 个字符',
      nameRequired: isEn ? 'Please enter a script name' : '请输入剧本名称',
      descriptionLabel: isEn ? 'Description' : '描述',
      descriptionPlaceholder: isEn
        ? 'Briefly describe the plot, style, or purpose'
        : '简要描述剧情内容、风格或用途',
      descriptionHint: isEn ? 'Optional, up to 300 characters' : '可选，最多 300 个字符',
      cancel: isEn ? 'Cancel' : '取消',
      submit: isEn ? 'Create Script' : '创建剧本',
      submitLoading: isEn ? 'Creating...' : '创建中...',
    },
  };

  const formatCreatedAt = useCallback(
    (value: string) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return value;
      }

      return parsed.toLocaleString(isEn ? 'en-US' : 'zh-CN', {
        hour12: false,
      });
    },
    [isEn]
  );

  const resolveListError = useCallback(
    (error: unknown) => {
      return localizeRequestError({
        message: error instanceof Error ? error.message : '',
        routeLocale: locale,
        zhFallback: '获取剧本库列表失败',
        enFallback: 'Failed to load script libraries',
      });
    },
    [locale]
  );

  const loadLibraries = useCallback(
    async (mode: FetchMode = 'refresh') => {
      const hasExistingData = librariesRef.current.length > 0;

      if (mode === 'initial' && !hasExistingData) {
        setIsInitialLoading(true);
        setLibrariesError('');
      }

      if (mode === 'refresh') {
        setIsRefreshing(true);
      }

      try {
        const data = await scriptService.listLibraries();
        setLibraries(data);
        setLibrariesError('');
      } catch (error: unknown) {
        const message = resolveListError(error);
        setLibrariesError(message);
      } finally {
        if (mode === 'initial') {
          setIsInitialLoading(false);
        }

        if (mode === 'refresh') {
          setIsRefreshing(false);
        }
      }
    },
    [resolveListError]
  );

  useEffect(() => {
    void loadLibraries('initial');
  }, [loadLibraries]);

  const filteredLibraries = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return libraries;
    }

    return libraries.filter((library) => {
      const nameMatches = library.name.toLowerCase().includes(normalizedKeyword);
      const descriptionMatches = (library.description ?? '').toLowerCase().includes(normalizedKeyword);
      return nameMatches || descriptionMatches;
    });
  }, [libraries, keyword]);

  const closeCreateModal = () => {
    if (isCreatingScript) {
      return;
    }

    setIsCreateModalOpen(false);
    setScriptNameError(false);
    setCreateScriptError('');
  };

  const buildScriptDetailPath = (meta: ScriptCardMeta) => {
    const params = new URLSearchParams({
      library_id: meta.libraryId,
      title: meta.title,
      genre: text.libraryTag,
      subtitle: meta.subtitle,
      scenes: '--',
      roles: '--',
      words: '--',
      tone: meta.tone,
    });

    return `${scriptDetailPath}?${params.toString()}`;
  };

  const handleScriptCardClick = (meta: ScriptCardMeta) => {
    router.push(buildScriptDetailPath(meta));
  };

  const handleScriptCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, meta: ScriptCardMeta) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleScriptCardClick(meta);
    }
  };

  const getScriptCardProps = (meta: ScriptCardMeta) => ({
    role: 'button' as const,
    tabIndex: 0,
    onClick: () => handleScriptCardClick(meta),
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => handleScriptCardKeyDown(event, meta),
  });

  const resolveCreateScriptError = (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: unknown } }).response;
      const responseData = response?.data;

      if (typeof responseData === 'object' && responseData !== null) {
        const detail = (responseData as { detail?: unknown }).detail;
        if (typeof detail === 'string' && detail.trim()) {
          return detail;
        }

        const message = (responseData as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
    }

    return localizeRequestError({
      message: error instanceof Error ? error.message : '',
      routeLocale: locale,
      zhFallback: '创建剧本库失败',
      enFallback: 'Failed to create script library',
    });
  };

  const handleCreateScriptSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextScriptName = scriptName.trim();

    if (!nextScriptName) {
      setScriptNameError(true);
      return;
    }

    setScriptNameError(false);
    setCreateScriptError('');
    setIsCreatingScript(true);

    try {
      const createdLibrary = await scriptService.createLibrary({
        name: nextScriptName,
        description: scriptDescription.trim() || undefined,
      });

      setLibraries((prev) => [createdLibrary, ...prev.filter((item) => item.id !== createdLibrary.id)]);

      setIsCreateModalOpen(false);
      setScriptName('');
      setScriptDescription('');

      // Background sync to ensure final state consistency without blocking current view.
      void loadLibraries('silent');
    } catch (error: unknown) {
      setCreateScriptError(resolveCreateScriptError(error));
    } finally {
      setIsCreatingScript(false);
    }
  };

  const showBlockingError = librariesError && libraries.length === 0 && !isInitialLoading;
  const showNonBlockingError = librariesError && libraries.length > 0;
  const showEmpty = !isInitialLoading && !showBlockingError && filteredLibraries.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{text.title}</h1>
          {isRefreshing ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" />
              {text.syncing}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              type="text"
              placeholder={text.searchPlaceholder}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all w-64"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            {text.createScript}
          </button>
        </div>
      </div>

      {showNonBlockingError ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {librariesError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isInitialLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="rounded-2xl border border-gray-100 bg-white p-6 animate-pulse">
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
                <div className="mt-6 h-7 w-40 bg-gray-200 rounded" />
                <div className="mt-3 h-4 w-full bg-gray-100 rounded" />
                <div className="mt-2 h-4 w-5/6 bg-gray-100 rounded" />
                <div className="mt-8 h-4 w-32 bg-gray-100 rounded" />
              </div>
            ))
          : null}

        {showBlockingError ? (
          <div className="xl:col-span-2 rounded-2xl border border-red-100 bg-red-50 p-8">
            <p className="text-sm text-red-600">{librariesError}</p>
            <button
              className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-500 transition-colors"
              onClick={() => void loadLibraries('refresh')}
              type="button"
            >
              {text.retry}
            </button>
          </div>
        ) : null}

        {!isInitialLoading && !showBlockingError
          ? filteredLibraries.map((library, index) => {
              const tone = toneCycle[index % toneCycle.length];
              const cardMeta: ScriptCardMeta = {
                libraryId: library.id,
                title: library.name,
                subtitle: library.description?.trim() || text.noDescription,
                createdAt: formatCreatedAt(library.created_at),
                tone,
              };
              const toneClass = toneClasses[tone];

              return (
                <div
                  key={library.id}
                  className="script-card bg-white rounded-2xl border border-[#F3F4F6] hover:border-gray-200 transition-all cursor-pointer group"
                  {...getScriptCardProps(cardMeta)}
                >
                  <div className="p-6 flex flex-col h-full gap-6">
                    <div className="flex items-start justify-between">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-medium tracking-wider ${toneClass.badge}`}>
                        {text.libraryTag}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${toneClass.dot}`} />
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold text-black tracking-tight break-all">{cardMeta.title}</h3>
                      <p className="text-sm text-gray-500 mt-2 break-words">{cardMeta.subtitle}</p>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-400">{text.createdAt(cardMeta.createdAt)}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <span>{text.openLibrary}</span>
                        <svg className="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          : null}

        {showEmpty ? (
          <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-8 text-sm text-gray-500">
            {libraries.length === 0 ? text.emptyLibraries : text.noSearchResult}
          </div>
        ) : null}
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeCreateModal} />

          <div className="relative w-full max-w-[560px] bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 tracking-tight">{text.modal.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{text.modal.subtitle}</p>
              </div>
              <button
                onClick={closeCreateModal}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label={text.modal.cancel}
                disabled={isCreatingScript}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateScriptSubmit} className="p-8 space-y-6">
              <div>
                <label htmlFor="scriptName" className="block text-sm font-medium text-gray-700 mb-2">
                  {text.modal.nameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  id="scriptName"
                  name="scriptName"
                  type="text"
                  required
                  maxLength={50}
                  value={scriptName}
                  onChange={(event) => {
                    setScriptName(event.target.value);
                    if (event.target.value.trim()) {
                      setScriptNameError(false);
                    }
                    if (createScriptError) {
                      setCreateScriptError('');
                    }
                  }}
                  placeholder={text.modal.namePlaceholder}
                  className={`w-full px-4 py-3 bg-gray-50 rounded-xl border-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-black focus:bg-white ${
                    scriptNameError ? 'border-red-500' : 'border-transparent'
                  }`}
                />
                <p className="mt-2 text-xs text-gray-400">{text.modal.nameHint}</p>
                <p className={`${scriptNameError ? 'block' : 'hidden'} mt-1 text-xs text-red-500`}>{text.modal.nameRequired}</p>
              </div>

              <div>
                <label htmlFor="scriptDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  {text.modal.descriptionLabel}
                </label>
                <textarea
                  id="scriptDescription"
                  name="scriptDescription"
                  rows={5}
                  maxLength={300}
                  value={scriptDescription}
                  onChange={(event) => {
                    setScriptDescription(event.target.value);
                    if (createScriptError) {
                      setCreateScriptError('');
                    }
                  }}
                  placeholder={text.modal.descriptionPlaceholder}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors resize-none focus:border-black focus:bg-white"
                />
                <p className="mt-2 text-xs text-gray-400">{text.modal.descriptionHint}</p>
              </div>

              {createScriptError ? <p className="text-sm text-red-500">{createScriptError}</p> : null}

              <div className="pt-1 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                  disabled={isCreatingScript}
                >
                  {text.modal.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isCreatingScript}
                >
                  {isCreatingScript ? text.modal.submitLoading : text.modal.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .script-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
