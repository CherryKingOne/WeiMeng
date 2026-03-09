'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalePath } from '@/hooks/useLocalePath';
import { scriptService } from '@/services';
import type { ScriptFileContent } from '@/types';
import { localizeRequestError } from '@/utils';

type SliceItem = {
  id: string;
  text: string;
};

function formatFileSize(bytes: number, locale: 'zh' | 'en'): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return locale === 'en' ? '0 B' : '0 B';
  }

  const units = locale === 'en'
    ? ['B', 'KB', 'MB', 'GB', 'TB']
    : ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const digits = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(digits)} ${units[unitIndex]}`;
}

function splitContentToSlices(content: string, maxSliceLength: number = 500): SliceItem[] {
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());
  const slices: SliceItem[] = [];
  let currentSlice = '';
  let sliceIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    if (currentSlice.length + trimmed.length + 2 > maxSliceLength) {
      if (currentSlice) {
        slices.push({ id: `s${sliceIndex++}`, text: currentSlice.trim() });
        currentSlice = '';
      }
      if (trimmed.length > maxSliceLength) {
        const chunks = trimmed.match(new RegExp(`.{1,${maxSliceLength}}`, 'g')) || [];
        for (const chunk of chunks) {
          slices.push({ id: `s${sliceIndex++}`, text: chunk.trim() });
        }
      } else {
        currentSlice = trimmed;
      }
    } else {
      currentSlice = currentSlice ? `${currentSlice}\n\n${trimmed}` : trimmed;
    }
  }

  if (currentSlice.trim()) {
    slices.push({ id: `s${sliceIndex}`, text: currentSlice.trim() });
  }

  return slices;
}

export default function DocChunkPage() {
  const router = useRouter();
  const { locale, withLocalePath } = useLocalePath();
  const searchParams = useSearchParams();
  const isEn = locale === 'en';

  const libraryId = searchParams.get('libraryId')?.trim() || '';
  const fileId = searchParams.get('fileId')?.trim() || '';
  const fileNameFromParams = searchParams.get('fileName')?.trim() || '';
  const uploadedAtFromParams = searchParams.get('uploadedAt')?.trim() || '';
  const parserFromParams = searchParams.get('parser')?.trim() || '';
  const fileSizeFromParams = searchParams.get('fileSize')?.trim() || '';

  const [fileContent, setFileContent] = useState<ScriptFileContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');
  const [keyword, setKeyword] = useState('');
  const [selectedSliceIds, setSelectedSliceIds] = useState<string[]>([]);
  const [enabledSliceIds, setEnabledSliceIds] = useState<string[]>([]);
  const fallbackPath = withLocalePath('/scripts-detail/scripts-file');

  const text = {
    back: isEn ? 'Back' : '返回上级',
    size: isEn ? 'Size' : '大小',
    uploadedTime: isEn ? 'Uploaded Time' : '上传时间',
    parser: isEn ? 'Parser' : '解析器',
    sliceResultTitle: isEn ? 'Slice Result' : '切片结果',
    sliceResultSubtitle: isEn ? 'Review slices used for embedding and retrieval.' : '查看用于嵌入和召回的切片段落。',
    full: isEn ? 'Full' : '全文',
    compact: isEn ? 'Compact' : '省略',
    selectAll: isEn ? 'Select All' : '选择所有',
    searchPlaceholder: isEn ? 'Search' : '搜索',
    switchLayout: isEn ? 'Switch layout' : '切换布局',
    addSlice: isEn ? 'Add slice' : '新增切片',
    disableSlice: isEn ? 'Disable slice' : '禁用切片',
    enableSlice: isEn ? 'Enable slice' : '启用切片',
    total: (count: number) => (isEn ? `Total ${count} items` : `总共 ${count} 条`),
    perPageLabel: (size: number) => (isEn ? `${size} / page` : `${size}条/页`),
    loading: isEn ? 'Loading...' : '加载中...',
    missingParams: isEn ? 'Missing required parameters' : '缺少必要参数',
    loadFailed: isEn ? 'Failed to load file content' : '加载文件内容失败',
    retry: isEn ? 'Retry' : '重试',
    noContent: isEn ? 'No content available' : '暂无内容',
  };

  const resolveError = useCallback((err: unknown) => {
    return localizeRequestError({
      message: err instanceof Error ? err.message : '',
      routeLocale: locale,
      zhFallback: '加载文件内容失败',
      enFallback: 'Failed to load file content',
    });
  }, [locale]);

  const loadFileContent = useCallback(async (mode: 'initial' | 'retry' = 'initial') => {
    if (!libraryId || !fileId) {
      setError(text.missingParams);
      setIsLoading(false);
      return;
    }

    if (mode === 'initial') {
      setIsLoading(true);
    }
    setError('');

    try {
      const data = await scriptService.getLibraryFileContent(libraryId, fileId);
      setFileContent(data);
      const slices = splitContentToSlices(data.content);
      setEnabledSliceIds(slices.map((s) => s.id));
    } catch (err) {
      setError(resolveError(err));
    } finally {
      setIsLoading(false);
    }
  }, [libraryId, fileId, resolveError, text.missingParams]);

  useEffect(() => {
    void loadFileContent('initial');
  }, [loadFileContent]);

  const slices = useMemo(() => {
    if (!fileContent?.content) return [];
    return splitContentToSlices(fileContent.content);
  }, [fileContent]);

  const filteredSlices = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return slices;
    }
    return slices.filter((slice) => slice.text.toLowerCase().includes(normalized));
  }, [slices, keyword]);

  const visibleSliceIds = filteredSlices.map((slice) => slice.id);
  const allVisibleSelected = visibleSliceIds.length > 0 && visibleSliceIds.every((id) => selectedSliceIds.includes(id));

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedSliceIds((prev) => prev.filter((id) => !visibleSliceIds.includes(id)));
      return;
    }
    setSelectedSliceIds((prev) => Array.from(new Set([...prev, ...visibleSliceIds])));
  };

  const handleToggleSliceSelected = (sliceId: string) => {
    setSelectedSliceIds((prev) => {
      if (prev.includes(sliceId)) {
        return prev.filter((id) => id !== sliceId);
      }
      return [...prev, sliceId];
    });
  };

  const handleToggleSliceEnabled = (sliceId: string) => {
    setEnabledSliceIds((prev) => {
      if (prev.includes(sliceId)) {
        return prev.filter((id) => id !== sliceId);
      }
      return [...prev, sliceId];
    });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackPath);
  };

  const displayFileName = fileContent?.original_name || fileNameFromParams || 'Unknown';
  const displayUploadedAt = uploadedAtFromParams || (fileContent ? new Date().toLocaleString(isEn ? 'en-US' : 'zh-CN', { hour12: false }) : '--');
  const displayParser = parserFromParams || fileContent?.file_extension?.toUpperCase() || '--';
  const displayFileSize = fileSizeFromParams || (fileContent?.content_length ? formatFileSize(fileContent.content_length, isEn ? 'en' : 'zh') : '--');

  return (
    <div className="h-screen overflow-hidden bg-gray-50 text-gray-900">
      <div className="flex h-full">
        <section className="flex-1 bg-white p-6 flex flex-col overflow-hidden">
          <header className="mb-5">
            <button
              type="button"
              onClick={handleBack}
              className="group mb-4 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white transition-all duration-200 group-hover:-translate-x-0.5 group-hover:border-gray-300 group-hover:shadow-sm">
                <svg className="h-3 w-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </span>
              <span>{text.back}</span>
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{displayFileName}</h1>
            <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
              <span>{text.size}: {displayFileSize}</span>
              <span>{text.uploadedTime}: {displayUploadedAt}</span>
              <span>{text.parser}: {displayParser}</span>
            </div>
          </header>

          <div className="mt-4 flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white px-6 py-5 text-[15px] leading-8 text-gray-700">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                    <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 019 9h-2.2A6.8 6.8 0 0012 5.2V3z" />
                  </svg>
                  <span>{text.loading}</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-red-500">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadFileContent('retry')}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  {text.retry}
                </button>
              </div>
            ) : fileContent?.content ? (
              <pre className="whitespace-pre-wrap font-sans">{fileContent.content}</pre>
            ) : (
              <p className="text-gray-500 text-center">{text.noContent}</p>
            )}
          </div>
        </section>

        <aside className="w-[45%] min-w-[500px] bg-white flex flex-col">
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{text.sliceResultTitle}</h2>
            <p className="text-sm text-gray-500">{text.sliceResultSubtitle}</p>
          </div>

          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex rounded bg-gray-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  className={`px-3 py-1 text-xs rounded ${viewMode === 'full' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {text.full}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  className={`px-3 py-1 text-xs rounded ${viewMode === 'compact' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {text.compact}
                </button>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={handleToggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span>{text.selectAll}</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder={text.searchPlaceholder}
                  className="w-52 rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white"
                />
              </div>

              <button
                type="button"
                className="h-8 w-8 rounded border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-colors flex items-center justify-center"
                aria-label={text.switchLayout}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>

              <button
                type="button"
                className="h-8 w-8 rounded border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-colors"
                aria-label={text.addSlice}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? null : filteredSlices.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {keyword ? text.noContent : (isEn ? 'No slices available' : '暂无切片')}
              </div>
            ) : (
              filteredSlices.map((slice) => {
                const isSelected = selectedSliceIds.includes(slice.id);
                const isEnabled = enabledSliceIds.includes(slice.id);
                const content = viewMode === 'compact' ? `${slice.text.slice(0, 150)}...` : slice.text;

                return (
                  <div key={slice.id} className="mb-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-[0_8px_16px_rgba(17,24,39,0.06)] flex gap-3">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSliceSelected(slice.id)}
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                    </div>

                    <div className="flex-1 text-[13px] leading-6 text-gray-600">
                      {content}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSliceEnabled(slice.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${isEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      aria-label={isEnabled ? text.disableSlice : text.enableSlice}
                    >
                      <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <footer className="px-6 py-3 flex items-center justify-end text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>{text.total(filteredSlices.length)}</span>
              <button type="button" disabled className="h-7 w-7 rounded border border-gray-200 text-gray-300 cursor-not-allowed">&lt;</button>
              <span className="px-2 text-gray-900">1</span>
              <button type="button" disabled className="h-7 w-7 rounded border border-gray-200 text-gray-300 cursor-not-allowed">&gt;</button>
              <span className="ml-2">{text.perPageLabel(50)}</span>
              <select className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-600 focus:outline-none focus:border-gray-300">
                <option>{text.perPageLabel(10)}</option>
                <option>{text.perPageLabel(20)}</option>
                <option>{text.perPageLabel(50)}</option>
                <option>{text.perPageLabel(100)}</option>
              </select>
            </div>
          </footer>
        </aside>
      </div>
    </div>
  );
}
