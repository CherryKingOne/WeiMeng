'use client';

import { isAxiosError } from 'axios';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocalePath } from '@/hooks/useLocalePath';
import { scriptService } from '@/services';
import type { ScriptLibraryFile } from '@/types';
import { localizeRequestError } from '@/utils';

type FileStatus = 'success';
type ChunkExecutionState = 'idle' | 'processing' | 'processed';

type UploadFile = {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'invalid';
  error?: string;
};

type ScriptFileRow = {
  id: string;
  name: string;
  uploadedAt: string;
  fileSizeLabel: string;
  chunks: string;
  parser: string;
  enabled: boolean;
  status: FileStatus;
  source: 'upload';
};

type SelectedScript = {
  title: string;
  genre: string;
  subtitle: string;
  scenes: string;
  roles: string;
  words: string;
  tone: 'green' | 'blue' | 'red';
};

function formatDateTime(value: string, locale: 'zh' | 'en'): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', {
    hour12: false,
  });
}

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

const ACCEPTED_FILE_TYPES = ['.md', '.docx', '.txt', '.pdf'];
const ACCEPTED_MIME_TYPES = [
  'text/markdown',
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_UPLOAD_TEXT_LENGTH = 10000;

type UploadModalProps = {
  isOpen: boolean;
  libraryId: string;
  locale: 'zh' | 'en';
  text: Record<string, unknown>;
  onClose: () => void;
  onUploadComplete: () => void;
};

function UploadModal({ isOpen, libraryId, locale, text, onClose, onUploadComplete }: UploadModalProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const t = text as {
    uploadModal: {
      title: string;
      subtitle: string;
      dropTitle: string;
      dropHint: string;
      limitHint: string;
      cancel: string;
      confirm: string;
      unsupportedType: string;
      overTextLimit: (limit: number) => string;
    };
    uploadStatus: { pending: string; uploading: string; success: string; error: string; invalid: string };
    uploadAll: string;
    clearCompleted: string;
    dropFilesHere: string;
  };

  const getFileExtension = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? `.${extension}` : '';
  };

  const isPlainTextFile = (extension: string) => extension === '.txt' || extension === '.md';

  const countCharacters = (value: string) => Array.from(value).length;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const nextFiles: UploadFile[] = [];

    for (const file of Array.from(files)) {
      const extension = getFileExtension(file.name);
      const isAccepted = ACCEPTED_FILE_TYPES.includes(extension) || ACCEPTED_MIME_TYPES.includes(file.type);

      if (!isAccepted) {
        nextFiles.push({
          file,
          status: 'invalid',
          error: t.uploadModal.unsupportedType,
        });
        continue;
      }

      if (isPlainTextFile(extension)) {
        const textContent = await file.text();
        if (countCharacters(textContent) > MAX_UPLOAD_TEXT_LENGTH) {
          nextFiles.push({
            file,
            status: 'invalid',
            error: t.uploadModal.overTextLimit(MAX_UPLOAD_TEXT_LENGTH),
          });
          continue;
        }
      }

      nextFiles.push({ file, status: 'pending' });
    }

    if (nextFiles.length > 0) {
      setUploadFiles((prev) => [...prev, ...nextFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUploadSingle = async (index: number) => {
    const uploadFile = uploadFiles[index];
    if (uploadFile.status !== 'pending' && uploadFile.status !== 'error') return;

    setUploadFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: 'uploading', error: undefined };
      return next;
    });

    try {
      await scriptService.uploadLibraryFile(libraryId, uploadFile.file);
      setUploadFiles((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status: 'success' };
        return next;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.uploadStatus.error;
      setUploadFiles((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status: 'error', error: errorMessage };
        return next;
      });
    }
  };

  const handleUploadAll = async () => {
    if (isUploading) return;
    setIsUploading(true);

    const pendingIndices = uploadFiles
      .map((f, i) => (f.status === 'pending' || f.status === 'error' ? i : -1))
      .filter((i) => i >= 0);

    for (const index of pendingIndices) {
      await handleUploadSingle(index);
    }

    setIsUploading(false);
    onUploadComplete();
  };

  const handleClearCompleted = () => {
    setUploadFiles((prev) => prev.filter((f) => f.status !== 'success'));
  };

  const handleRemoveFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (isUploading) return;
    setUploadFiles([]);
    onClose();
  };

  const hasPendingFiles = uploadFiles.some((f) => f.status === 'pending' || f.status === 'error');
  const hasCompletedFiles = uploadFiles.some((f) => f.status === 'success');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t.uploadModal.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{t.uploadModal.subtitle}</p>
        </div>

        <div className="p-6">
          <div
            className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragging ? 'border-gray-400 bg-gray-100' : 'border-gray-300 bg-gray-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                void handleFileSelect(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-800">{t.uploadModal.dropTitle}</p>
            <p className="mt-2 text-xs text-gray-500">{t.uploadModal.dropHint}</p>
            <p className="mt-1 text-xs text-gray-500">{t.uploadModal.limitHint}</p>
          </div>

          {uploadFiles.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
              {uploadFiles.map((uploadFile, index) => (
                <div
                  key={`${uploadFile.file.name}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{uploadFile.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size, locale)}</p>
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="mt-1 text-xs text-red-500">{uploadFile.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'pending' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleUploadSingle(index);
                        }}
                        disabled={isUploading}
                        className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        {t.uploadStatus.pending}
                      </button>
                    )}
                    {uploadFile.status === 'uploading' && (
                      <span className="text-xs text-blue-600 flex items-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                          <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 019 9h-2.2A6.8 6.8 0 0012 5.2V3z" />
                        </svg>
                        {t.uploadStatus.uploading}
                      </span>
                    )}
                    {uploadFile.status === 'success' && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {t.uploadStatus.success}
                      </span>
                    )}
                    {uploadFile.status === 'error' && (
                      <span className="text-xs text-red-600" title={uploadFile.error}>
                        {t.uploadStatus.error}
                      </span>
                    )}
                    {uploadFile.status === 'invalid' && (
                      <span className="text-xs text-red-600" title={uploadFile.error}>
                        {t.uploadStatus.invalid}
                      </span>
                    )}
                    {uploadFile.status !== 'uploading' && uploadFile.status !== 'success' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        disabled={isUploading}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            {hasCompletedFiles && (
              <button
                type="button"
                onClick={handleClearCompleted}
                disabled={isUploading}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {t.clearCompleted}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t.uploadModal.cancel}
            </button>
            {hasPendingFiles && (
              <button
                type="button"
                onClick={() => void handleUploadAll()}
                disabled={isUploading}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                    <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 019 9h-2.2A6.8 6.8 0 0012 5.2V3z" />
                  </svg>
                )}
                {t.uploadAll}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScriptFilePage() {
  const router = useRouter();
  const { locale, withLocalePath } = useLocalePath();
  const searchParams = useSearchParams();
  const isEn = locale === 'en';
  const docChunkPath = withLocalePath('/scripts-detail/doc_chunk');
  const libraryId = searchParams.get('library_id')?.trim() || searchParams.get('libraryId')?.trim() || '';

  const [keyword, setKeyword] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [files, setFiles] = useState<ScriptLibraryFile[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filesError, setFilesError] = useState('');
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<ScriptFileRow | null>(null);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [chunkCountMap, setChunkCountMap] = useState<Record<string, number>>({});
  const [chunkExecutionStateMap, setChunkExecutionStateMap] = useState<Record<string, ChunkExecutionState>>({});

  const selectedScript = useMemo<SelectedScript>(() => {
    const toneParam = searchParams.get('tone');
    const tone: SelectedScript['tone'] = toneParam === 'blue' || toneParam === 'red' ? toneParam : 'green';

    const fallbackScript = {
      title: '黑客帝国',
      genre: '科幻',
      subtitle: '经典开场片段',
    };

    return {
      title: searchParams.get('title')?.trim() || fallbackScript.title,
      genre: searchParams.get('genre')?.trim() || fallbackScript.genre,
      subtitle: searchParams.get('subtitle')?.trim() || fallbackScript.subtitle,
      scenes: searchParams.get('scenes')?.trim() || '--',
      roles: searchParams.get('roles')?.trim() || '--',
      words: searchParams.get('words')?.trim() || '--',
      tone,
    };
  }, [searchParams]);

  const selectedScriptAvatarClass = selectedScript.tone === 'blue'
    ? 'bg-blue-600'
    : selectedScript.tone === 'red'
      ? 'bg-red-600'
      : 'bg-gray-800';
  const selectedScriptBadgeClass = selectedScript.tone === 'blue'
    ? 'bg-blue-100 text-blue-700'
    : selectedScript.tone === 'red'
      ? 'bg-red-100 text-red-700'
      : 'bg-green-100 text-green-700';
  const selectedScriptDotClass = selectedScript.tone === 'blue'
    ? 'bg-blue-500'
    : selectedScript.tone === 'red'
      ? 'bg-red-500'
      : 'bg-emerald-500';
  const selectedScriptSubtitleClass = selectedScript.tone === 'blue'
    ? 'text-blue-600'
    : selectedScript.tone === 'red'
      ? 'text-red-600'
      : 'text-gray-400';
  const selectedScriptInitial = selectedScript.title.slice(0, 1).toUpperCase();
  const selectedScriptMeta = isEn
    ? `Scenes ${selectedScript.scenes} · Roles ${selectedScript.roles} · ${selectedScript.words} words`
    : `场景 ${selectedScript.scenes} · 角色 ${selectedScript.roles} · 字数 ${selectedScript.words}`;

  const text = {
    backToLibrary: isEn ? 'Back to Script Library' : '返回剧本库',
    fileList: isEn ? 'File List' : '文件列表',
    scenes: isEn ? 'Scenes' : '场景',
    roles: isEn ? 'Roles' : '角色',
    storyboard: isEn ? 'Storyboard' : '分镜',
    logs: isEn ? 'Logs' : '日志',
    settings: isEn ? 'Settings' : '配置',
    addFile: isEn ? 'Add File' : '新增文件',
    searchPlaceholder: isEn ? 'Search files...' : '搜索文件...',
    allFiles: isEn ? 'All files' : '全部文件',
    syncing: isEn ? 'Syncing...' : '同步中...',
    missingLibraryId: isEn ? 'Missing library id' : '缺少剧本库 ID',
    loadingFiles: isEn ? 'Loading files...' : '正在加载文件...',
    noFiles: isEn ? 'No files in this library yet' : '当前剧本库还没有文件',
    noSearchResult: isEn ? 'No matching files' : '没有匹配文件',
    retry: isEn ? 'Retry' : '重试',
    deleting: isEn ? 'Deleting...' : '删除中...',
    unavailableChunks: isEn ? '--' : '--',
    unknownParser: isEn ? 'Unknown' : '未知',
    uploadModalNote: isEn ? 'Upload flow is not connected yet.' : '上传流程暂未接入。',
    uploadStatus: {
      pending: isEn ? 'Pending' : '等待上传',
      uploading: isEn ? 'Uploading...' : '上传中...',
      success: isEn ? 'Uploaded' : '上传成功',
      error: isEn ? 'Upload failed' : '上传失败',
      invalid: isEn ? 'Invalid file' : '文件不符合要求',
    },
    uploadAll: isEn ? 'Upload All' : '全部上传',
    clearCompleted: isEn ? 'Clear Completed' : '清除已完成',
    dropFilesHere: isEn ? 'Drop files here' : '拖拽文件到此处',
    table: {
      name: isEn ? 'Name' : '名称',
      uploadedAt: isEn ? 'Upload Time' : '上传日期',
      source: isEn ? 'Source' : '来源',
      enabled: isEn ? 'Enabled' : '启用',
      chunks: isEn ? 'Chunks' : '分块数',
      parser: isEn ? 'Parser' : '解析',
      actions: isEn ? 'Actions' : '动作',
    },
    sourceUpload: isEn ? 'Upload' : '上传',
    viewChunks: isEn ? 'View Chunks' : '查看分块',
    reprocess: isEn ? 'Reprocess' : '重新解析',
    status: {
      success: isEn ? 'Loaded' : '已加载',
    },
    edit: isEn ? 'Edit' : '编辑',
    view: isEn ? 'View' : '查看',
    download: isEn ? 'Download' : '下载',
    remove: isEn ? 'Delete' : '删除',
    total: (count: number) => (isEn ? `Total ${count} items` : `总共 ${count} 条`),
    previousPage: isEn ? 'Previous page' : '上一页',
    nextPage: isEn ? 'Next page' : '下一页',
    perPageOption: (size: number) => (isEn ? `${size} / page` : `${size}条/页`),
    uploadModal: {
      title: isEn ? 'Add File' : '新增文件',
      subtitle: isEn ? 'Select files to upload and parse' : '选择要上传并解析的文件',
      dropTitle: isEn ? 'Drop files here or click to browse' : '将文件拖拽到此处，或点击上传',
      dropHint: isEn ? 'Supports .txt, .docx, .pdf, .md' : '支持 .txt、.docx、.pdf、.md',
      limitHint: isEn
        ? 'You can upload multiple files, but each file is limited to 10,000 characters of text.'
        : '可上传多个文件，但每个文件的文本内容单独限制 10000 字。',
      cancel: isEn ? 'Cancel' : '取消',
      confirm: isEn ? 'Start Upload' : '开始上传',
      unsupportedType: isEn ? 'Unsupported file type' : '文件类型不支持',
      overTextLimit: (limit: number) => (isEn
        ? `Each file must contain at most ${limit} characters of text.`
        : `每个文件的文本内容不能超过 ${limit} 字。`),
    },
    deleteModal: {
      title: isEn ? 'Delete File' : '删除文件',
      description: isEn
        ? 'Deleting this file will also remove related script, storyboard, character, and other linked information.'
        : '删除后，相关剧本、分镜、角色等信息将被删除',
      cancel: isEn ? 'Cancel' : '取消',
      confirm: isEn ? 'Delete' : '确认删除',
    },
  };

  const resolveFilesError = useCallback((error: unknown) => {
    if (!libraryId) {
      return text.missingLibraryId;
    }

    if (isAxiosError(error) && error.response?.status === 404) {
      return isEn ? 'Script library not found' : '剧本库不存在';
    }

    return localizeRequestError({
      message: error instanceof Error ? error.message : '',
      routeLocale: locale,
      zhFallback: '获取剧本文件失败',
      enFallback: 'Failed to load script files',
    });
  }, [isEn, libraryId, locale, text.missingLibraryId]);

  const loadFiles = useCallback(async (mode: 'initial' | 'refresh' = 'refresh') => {
    if (!libraryId) {
      setFiles([]);
      setFilesError(text.missingLibraryId);
      setIsInitialLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (mode === 'initial') {
      setIsInitialLoading(true);
      setFilesError('');
    }

    if (mode === 'refresh') {
      setIsRefreshing(true);
    }

    try {
      const data = await scriptService.listLibraryFiles(libraryId);
      setFiles(data);
      setFilesError('');
      setEnabledMap((prev) => {
        const nextEntries = data.map((file) => [file.id, prev[file.id] ?? true]);
        return Object.fromEntries(nextEntries);
      });
      setChunkCountMap(Object.fromEntries(
        data
          .filter((file) => file.chunk_count > 0)
          .map((file) => [file.id, file.chunk_count]),
      ));
      setChunkExecutionStateMap(Object.fromEntries(
        data
          .filter((file) => file.chunk_count > 0)
          .map((file) => [file.id, 'processed' as const]),
      ));
      setSelectedIds((prev) => prev.filter((id) => data.some((file) => file.id === id)));
    } catch (error: unknown) {
      setFilesError(resolveFilesError(error));
    } finally {
      if (mode === 'initial') {
        setIsInitialLoading(false);
      }
      if (mode === 'refresh') {
        setIsRefreshing(false);
      }
    }
  }, [libraryId, resolveFilesError, text.missingLibraryId]);

  useEffect(() => {
    void loadFiles('initial');
  }, [loadFiles]);

  const displayFiles = useMemo<ScriptFileRow[]>(() => {
    return files.map((file) => ({
      id: file.id,
      name: file.original_name,
      uploadedAt: formatDateTime(file.created_at, isEn ? 'en' : 'zh'),
      fileSizeLabel: formatFileSize(file.file_size, isEn ? 'en' : 'zh'),
      chunks: chunkCountMap[file.id] !== undefined ? String(chunkCountMap[file.id]) : text.unavailableChunks,
      parser: file.file_extension?.toUpperCase() || text.unknownParser,
      enabled: enabledMap[file.id] ?? true,
      status: 'success',
      source: 'upload',
    }));
  }, [chunkCountMap, enabledMap, files, isEn, text.unavailableChunks, text.unknownParser]);

  const filteredFiles = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return displayFiles;
    }

    return displayFiles.filter((file) => {
      return file.name.toLowerCase().includes(normalizedKeyword)
        || file.parser.toLowerCase().includes(normalizedKeyword)
        || file.uploadedAt.toLowerCase().includes(normalizedKeyword);
    });
  }, [displayFiles, keyword]);

  const visibleIds = filteredFiles.map((file) => file.id);
  const allVisibleChecked = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const handleSelectAll = () => {
    if (allVisibleChecked) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleToggleSelected = (fileId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
      }
      return [...prev, fileId];
    });
  };

  const handleToggleEnabled = (fileId: string) => {
    setEnabledMap((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  const getChunkExecutionState = useCallback((fileId: string): ChunkExecutionState => {
    return chunkExecutionStateMap[fileId] ?? (chunkCountMap[fileId] !== undefined ? 'processed' : 'idle');
  }, [chunkCountMap, chunkExecutionStateMap]);

  const handleExecuteChunks = useCallback(async (file: ScriptFileRow) => {
    if (!libraryId) {
      setFilesError(text.missingLibraryId);
      return;
    }

    const previousState = getChunkExecutionState(file.id);
    if (previousState === 'processing') {
      return;
    }

    setFilesError('');
    setChunkExecutionStateMap((prev) => ({
      ...prev,
      [file.id]: 'processing',
    }));

    try {
      const chunks = await scriptService.executeLibraryFileChunks(libraryId, file.id);
      setChunkCountMap((prev) => ({
        ...prev,
        [file.id]: chunks.length,
      }));
      setChunkExecutionStateMap((prev) => ({
        ...prev,
        [file.id]: 'processed',
      }));
    } catch (error: unknown) {
      setChunkExecutionStateMap((prev) => ({
        ...prev,
        [file.id]: previousState,
      }));

      if (isAxiosError(error) && error.response?.status === 404) {
        setFilesError(isEn ? 'File not found or already deleted' : '文件不存在或已删除');
        return;
      }

      setFilesError(localizeRequestError({
        message: error instanceof Error ? error.message : '',
        routeLocale: locale,
        zhFallback: '执行文本分块失败',
        enFallback: 'Failed to execute script chunks',
      }));
    }
  }, [getChunkExecutionState, isEn, libraryId, locale, text.missingLibraryId]);

  const handleOpenDeleteModal = useCallback((file: ScriptFileRow) => {
    if (deletingFileId) {
      return;
    }
    setPendingDeleteFile(file);
  }, [deletingFileId]);

  const handleDeleteFile = useCallback(async () => {
    if (!libraryId || !pendingDeleteFile || deletingFileId) {
      return;
    }

    setDeletingFileId(pendingDeleteFile.id);
    setFilesError('');

    try {
      await scriptService.deleteLibraryFile(libraryId, pendingDeleteFile.id);
      setFiles((prev) => prev.filter((item) => item.id !== pendingDeleteFile.id));
      setSelectedIds((prev) => prev.filter((id) => id !== pendingDeleteFile.id));
      setEnabledMap((prev) => {
        const next = { ...prev };
        delete next[pendingDeleteFile.id];
        return next;
      });
      setChunkCountMap((prev) => {
        const next = { ...prev };
        delete next[pendingDeleteFile.id];
        return next;
      });
      setChunkExecutionStateMap((prev) => {
        const next = { ...prev };
        delete next[pendingDeleteFile.id];
        return next;
      });
      setPendingDeleteFile(null);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setFilesError(isEn ? 'File not found or already deleted' : '文件不存在或已删除');
      } else {
        setFilesError(localizeRequestError({
          message: error instanceof Error ? error.message : '',
          routeLocale: locale,
          zhFallback: '删除剧本文件失败',
          enFallback: 'Failed to delete script file',
        }));
      }
    } finally {
      setDeletingFileId(null);
    }
  }, [deletingFileId, isEn, libraryId, locale, pendingDeleteFile]);

  const buildDocChunkPath = (file: ScriptFileRow) => {
    const params = new URLSearchParams({
      library_id: libraryId,
      file_id: file.id,
      file_name: file.name,
      uploaded_at: file.uploadedAt,
      chunks: file.chunks,
      parser: file.parser,
      file_size: file.fileSizeLabel,
    });

    return `${docChunkPath}?${params.toString()}`;
  };

  const isRowActionClick = (target: EventTarget | null) => {
    return target instanceof Element && Boolean(target.closest('[data-row-action="true"]'));
  };

  const handleFileRowClick = (event: MouseEvent<HTMLDivElement>, file: ScriptFileRow) => {
    if (isRowActionClick(event.target)) {
      return;
    }
    router.push(buildDocChunkPath(file));
  };

  const handleFileRowKeyDown = (event: KeyboardEvent<HTMLDivElement>, file: ScriptFileRow) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if (isRowActionClick(event.target)) {
      return;
    }
    event.preventDefault();
    router.push(buildDocChunkPath(file));
  };

  const showBlockingError = filesError && files.length === 0 && !isInitialLoading;
  const showNonBlockingError = filesError && files.length > 0;
  const showEmpty = !isInitialLoading && !showBlockingError && filteredFiles.length === 0;

  return (
    <div className="h-screen overflow-hidden bg-white text-gray-900">
      <div className="flex h-full">
        <aside className="w-64 shrink-0 border-r border-gray-100 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <Link
              href={withLocalePath('/scripts')}
              className="group inline-flex items-center gap-2 px-1 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white transition-all duration-200 group-hover:-translate-x-0.5 group-hover:border-gray-300 group-hover:shadow-sm">
                <svg className="h-3 w-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span>{text.backToLibrary}</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg text-white flex items-center justify-center text-lg font-bold ${selectedScriptAvatarClass}`}>
                {selectedScriptInitial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="truncate text-sm font-semibold text-gray-900">{selectedScript.title}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wider ${selectedScriptBadgeClass}`}>
                    {selectedScript.genre}
                  </span>
                  <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${selectedScriptDotClass}`} />
                </div>
                <p className="text-xs text-gray-400">{selectedScriptMeta}</p>
              </div>
            </div>

            <p className={`text-xs ${selectedScriptSubtitleClass}`}>{selectedScript.subtitle}</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            <div className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-900">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{text.fileList}</span>
            </div>
            {[text.scenes, text.roles, text.storyboard, text.logs].map((navText) => (
              <button
                key={navText}
                type="button"
                className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>{navText}</span>
              </button>
            ))}
            <button
              type="button"
              className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{text.settings}</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-4">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-gray-900">{text.fileList}</h1>
                  {isRefreshing ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-pulse" />
                      {text.syncing}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={text.allFiles} onClick={() => void loadFiles('refresh')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v4m0 0V4m0 4a8 8 0 108 8" />
                  </svg>
                </button>

                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setKeyword(event.target.value)}
                    placeholder={text.searchPlaceholder}
                    className="w-56 pl-9 pr-4 py-2 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:border-gray-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {text.addFile}
                </button>
              </div>
            </div>

            {showNonBlockingError ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {filesError}
              </div>
            ) : null}

            <div className="border border-gray-200 rounded-xl overflow-x-auto">
              <div className="w-max min-w-full">
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50/50 border-b border-gray-200 text-xs font-medium text-gray-500">
                  <div className="w-10 flex justify-center">
                    <input
                      type="checkbox"
                      checked={allVisibleChecked}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                  </div>
                  <div className="w-[420px] shrink-0">{text.table.name}</div>
                  <div className="w-44 shrink-0">{text.table.uploadedAt}</div>
                  <div className="w-20 shrink-0 text-center">{text.table.source}</div>
                  <div className="w-16 shrink-0 text-center">{text.table.enabled}</div>
                  <div className="w-20 shrink-0 text-center">{text.table.chunks}</div>
                  <div className="w-20 shrink-0 text-center">{text.table.parser}</div>
                  <div className="w-52 shrink-0 text-center">{text.table.actions}</div>
                </div>

                {isInitialLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={`file-skeleton-${index}`} className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-b-0 animate-pulse">
                      <div className="w-10 flex justify-center">
                        <div className="h-4 w-4 rounded bg-gray-200" />
                      </div>
                      <div className="w-[420px] h-4 rounded bg-gray-200" />
                      <div className="w-44 h-4 rounded bg-gray-100" />
                      <div className="w-20 h-4 rounded bg-gray-100" />
                      <div className="w-16 h-4 rounded bg-gray-100" />
                      <div className="w-20 h-4 rounded bg-gray-100" />
                      <div className="w-20 h-4 rounded bg-gray-100" />
                      <div className="w-52 h-4 rounded bg-gray-100" />
                    </div>
                  ))
                ) : null}

                {showBlockingError ? (
                  <div className="px-6 py-12 text-center text-sm text-red-500 space-y-4">
                    <p>{filesError}</p>
                    <button
                      type="button"
                      onClick={() => void loadFiles('refresh')}
                      className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                    >
                      {text.retry}
                    </button>
                  </div>
                ) : null}

                {!isInitialLoading && !showBlockingError && filteredFiles.length > 0 ? (
                  filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => handleFileRowClick(event, file)}
                      onKeyDown={(event) => handleFileRowKeyDown(event, file)}
                      className="group flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    >
                      <div className="w-10 flex justify-center">
                        <input
                          type="checkbox"
                          data-row-action="true"
                          checked={selectedIds.includes(file.id)}
                          onChange={() => handleToggleSelected(file.id)}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                      </div>

                      <div className="w-[420px] shrink-0 min-w-0 flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                          <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <div className="min-w-0">
                          <span className="block truncate text-sm text-gray-900">{file.name}</span>
                          <span className="block text-xs text-gray-400">{file.fileSizeLabel}</span>
                        </div>
                      </div>

                      <div className="w-44 shrink-0 text-sm text-gray-600 font-mono whitespace-nowrap">{file.uploadedAt}</div>

                      <div className="w-20 shrink-0 flex justify-center" title={text.sourceUpload}>
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>

                      <div className="w-16 shrink-0 flex justify-center">
                        <button
                          type="button"
                          data-row-action="true"
                          onClick={() => handleToggleEnabled(file.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                            file.enabled ? 'bg-black' : 'bg-gray-300'
                          }`}
                          aria-label={text.table.enabled}
                        >
                          <span
                            className={`block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              file.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="w-20 shrink-0 text-center text-sm text-gray-600 font-mono">{file.chunks}</div>
                      <div className="w-20 shrink-0 text-center text-sm text-gray-500">{file.parser}</div>

                      <div className="w-52 shrink-0 flex items-center justify-center gap-3 text-gray-500">
                        <button
                          type="button"
                          data-row-action="true"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleExecuteChunks(file);
                          }}
                          disabled={getChunkExecutionState(file.id) === 'processing'}
                          className={`transition-colors ${
                            getChunkExecutionState(file.id) === 'processing'
                              ? 'cursor-wait text-gray-900'
                              : 'hover:text-gray-900'
                          }`}
                          aria-label={text.reprocess}
                          title={text.reprocess}
                        >
                          {getChunkExecutionState(file.id) === 'processing' ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : getChunkExecutionState(file.id) === 'processed' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8.75 5.47c0-1.04 1.15-1.67 2.03-1.11l8.24 5.27c.82.52.82 1.72 0 2.24l-8.24 5.27c-.88.56-2.03-.07-2.03-1.11V5.47z" />
                            </svg>
                          )}
                        </button>

                        <span
                          className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                          title={text.status[file.status]}
                        />

                        <div className="flex items-center gap-3 opacity-0 invisible pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto">
                          <span className="h-5 w-px bg-gray-200" />

                          <button type="button" data-row-action="true" className="hover:text-gray-700 transition-colors" aria-label={text.edit}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16.862 4.487a2.25 2.25 0 113.182 3.182L8.25 19.5 3 21l1.5-5.25L16.862 4.487z" />
                            </svg>
                          </button>

                          <Link href={buildDocChunkPath(file)} data-row-action="true" className="hover:text-gray-700 transition-colors" aria-label={text.viewChunks}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </Link>

                          <button type="button" data-row-action="true" className="hover:text-gray-700 transition-colors" aria-label={text.download}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            data-row-action="true"
                            onClick={() => handleOpenDeleteModal(file)}
                            disabled={Boolean(deletingFileId)}
                            className={`transition-colors ${deletingFileId ? 'cursor-not-allowed text-gray-300' : 'hover:text-red-600'}`}
                            aria-label={deletingFileId === file.id ? text.deleting : text.remove}
                            title={deletingFileId === file.id ? text.deleting : text.remove}
                          >
                            {deletingFileId === file.id ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                                <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 019 9h-2.2A6.8 6.8 0 0012 5.2V3z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 7h12M9 7V5h6v2m-8 0l1 12h8l1-12M10 11v6m4-6v6" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : null}

                {showEmpty ? (
                  <div className="px-6 py-12 text-center text-sm text-gray-500">
                    {files.length === 0 ? text.noFiles : text.noSearchResult}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="shrink-0 px-8 py-3">
            <div className="flex items-center justify-end gap-4">
              <span className="text-sm text-gray-500">{text.total(filteredFiles.length)}</span>
              <div className="flex items-center gap-1">
                <button type="button" className="p-1.5 rounded text-gray-300 cursor-not-allowed" disabled aria-label={text.previousPage}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button type="button" className="h-8 min-w-[32px] rounded bg-black px-2 text-sm font-medium text-white">1</button>
                <button type="button" className="p-1.5 rounded text-gray-300 cursor-not-allowed" disabled aria-label={text.nextPage}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <button type="button" className="px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 bg-white">
                {text.perPageOption(20)}
              </button>
            </div>
          </div>
        </main>
      </div>

      {pendingDeleteFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{text.deleteModal.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{pendingDeleteFile.name}</p>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-600">{text.deleteModal.description}</p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setPendingDeleteFile(null)}
                disabled={Boolean(deletingFileId)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {text.deleteModal.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteFile()}
                disabled={Boolean(deletingFileId)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {deletingFileId === pendingDeleteFile.id ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                    <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 019 9h-2.2A6.8 6.8 0 0012 5.2V3z" />
                  </svg>
                ) : null}
                <span>{deletingFileId === pendingDeleteFile.id ? text.deleting : text.deleteModal.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isUploadModalOpen ? (
        <UploadModal
          isOpen={isUploadModalOpen}
          libraryId={libraryId}
          locale={isEn ? 'en' : 'zh'}
          text={text}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={() => {
            void loadFiles('refresh');
          }}
        />
      ) : null}
    </div>
  );
}
