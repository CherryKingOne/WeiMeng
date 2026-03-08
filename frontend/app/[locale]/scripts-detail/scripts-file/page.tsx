'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type KeyboardEvent, type MouseEvent, useMemo, useState } from 'react';
import { useLocalePath } from '@/hooks/useLocalePath';

type ScriptFile = {
  id: string;
  name: string;
  uploadedAt: string;
  chunks: number;
  parser: string;
  enabled: boolean;
  status: 'success' | 'processing' | 'failed';
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

const scriptFiles: ScriptFile[] = [
  {
    id: 'f1',
    name: '1772419691_导学课动作.docx',
    uploadedAt: '2026/02/03 10:48:11',
    chunks: 4,
    parser: 'general',
    enabled: true,
    status: 'success',
  },
  {
    id: 'f2',
    name: '1772419678_接量期常见问题.docx',
    uploadedAt: '2026/02/03 10:48:00',
    chunks: 14,
    parser: 'general',
    enabled: true,
    status: 'processing',
  },
  {
    id: 'f3',
    name: '1772419664_太极专业知识.docx',
    uploadedAt: '2026/02/03 10:47:46',
    chunks: 93,
    parser: 'general',
    enabled: true,
    status: 'failed',
  },
  {
    id: 'f4',
    name: '1772419642_通用——八段锦.docx',
    uploadedAt: '2026/02/03 10:47:23',
    chunks: 16,
    parser: 'general',
    enabled: true,
    status: 'processing',
  },
  {
    id: 'f5',
    name: '1772419628_异议处理.docx',
    uploadedAt: '2026/02/03 10:47:08',
    chunks: 17,
    parser: 'general',
    enabled: true,
    status: 'failed',
  },
  {
    id: 'f6',
    name: '1772419614_D12345专业(1).docx',
    uploadedAt: '2026/02/03 10:46:56',
    chunks: 63,
    parser: 'general',
    enabled: true,
    status: 'success',
  },
  {
    id: 'f7',
    name: '1772419576_P1-P3 先导课-二期.doc',
    uploadedAt: '2026/02/03 10:46:19',
    chunks: 5,
    parser: 'general',
    enabled: true,
    status: 'success',
  },
];

export default function ScriptFilePage() {
  const router = useRouter();
  const { locale, withLocalePath } = useLocalePath();
  const searchParams = useSearchParams();
  const isEn = locale === 'en';
  const docChunkPath = withLocalePath('/scripts-detail/doc_chunk');

  const [keyword, setKeyword] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() => {
    return Object.fromEntries(scriptFiles.map((file) => [file.id, file.enabled]));
  });

  const selectedScript = useMemo<SelectedScript>(() => {
    const toneParam = searchParams.get('tone');
    const tone: SelectedScript['tone'] = toneParam === 'blue' || toneParam === 'red' ? toneParam : 'green';

    return {
      title: searchParams.get('title')?.trim() || '黑客帝国',
      genre: searchParams.get('genre')?.trim() || '科幻',
      subtitle: searchParams.get('subtitle')?.trim() || '经典开场片段',
      scenes: searchParams.get('scenes')?.trim() || '12',
      roles: searchParams.get('roles')?.trim() || '08',
      words: searchParams.get('words')?.trim() || '2.3k',
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
    reprocess: isEn ? 'Reprocess' : '重新处理',
    status: {
      success: isEn ? 'Success' : '成功',
      processing: isEn ? 'Processing' : '处理中',
      failed: isEn ? 'Failed' : '失败',
    },
    edit: isEn ? 'Edit' : '编辑',
    view: isEn ? 'View' : '查看',
    download: isEn ? 'Download' : '下载',
    remove: isEn ? 'Delete' : '删除',
    total: (count: number) => (isEn ? `Total ${count} items` : `总共 ${count} 条`),
    empty: isEn ? 'No files found' : '未找到匹配文件',
    uploadModal: {
      title: isEn ? 'Add File' : '新增文件',
      subtitle: isEn ? 'Select files to upload and parse' : '选择要上传并解析的文件',
      dropTitle: isEn ? 'Drop files here or click to browse' : '将文件拖拽到此处，或点击上传',
      dropHint: isEn ? 'Supports DOC, DOCX, TXT, PDF' : '支持 DOC、DOCX、TXT、PDF',
      cancel: isEn ? 'Cancel' : '取消',
      confirm: isEn ? 'Start Upload' : '开始上传',
    },
  };

  const filteredFiles = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return scriptFiles;
    }

    return scriptFiles.filter((file) => file.name.toLowerCase().includes(normalizedKeyword));
  }, [keyword]);

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

  const buildDocChunkPath = (file: ScriptFile) => {
    const params = new URLSearchParams({
      fileName: file.name,
      uploadedAt: file.uploadedAt,
      chunks: String(file.chunks),
      parser: file.parser,
    });

    return `${docChunkPath}?${params.toString()}`;
  };

  const isRowActionClick = (target: EventTarget | null) => {
    return target instanceof HTMLElement && Boolean(target.closest('[data-row-action="true"]'));
  };

  const handleFileRowClick = (event: MouseEvent<HTMLDivElement>, file: ScriptFile) => {
    if (isRowActionClick(event.target)) {
      return;
    }
    router.push(buildDocChunkPath(file));
  };

  const handleFileRowKeyDown = (event: KeyboardEvent<HTMLDivElement>, file: ScriptFile) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if (isRowActionClick(event.target)) {
      return;
    }
    event.preventDefault();
    router.push(buildDocChunkPath(file));
  };

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
          </nav>

          <div className="p-3 border-t border-gray-100">
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
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-4">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{text.fileList}</h1>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={text.allFiles}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>

                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
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

            <div className="border border-gray-200 rounded-xl overflow-x-auto">
              <div className="min-w-[980px]">
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

                {filteredFiles.length > 0 ? (
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
                        <span className="truncate text-sm text-gray-900">{file.name}</span>
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
                            enabledMap[file.id] ? 'bg-black' : 'bg-gray-300'
                          }`}
                          aria-label={text.table.enabled}
                        >
                          <span
                            className={`block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              enabledMap[file.id] ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="w-20 shrink-0 text-center text-sm text-gray-600 font-mono">{file.chunks}</div>
                      <div className="w-20 shrink-0 text-center text-sm text-gray-500">{file.parser}</div>

                      <div className="w-52 shrink-0 flex items-center justify-center gap-3 text-gray-500">
                        <button type="button" data-row-action="true" className="hover:text-gray-900 transition-colors" aria-label={text.reprocess}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>

                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            file.status === 'success'
                              ? 'bg-emerald-500'
                              : file.status === 'processing'
                                ? 'bg-blue-500 animate-pulse'
                                : 'bg-red-500'
                          }`}
                          title={text.status[file.status]}
                        />

                        <div data-row-action="true" className="flex items-center gap-3 opacity-0 invisible pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto">
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

                          <button type="button" data-row-action="true" className="hover:text-red-600 transition-colors" aria-label={text.remove}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 7h12M9 7V5h6v2m-8 0l1 12h8l1-12M10 11v6m4-6v6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center text-sm text-gray-500">{text.empty}</div>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 px-8 py-3">
            <div className="flex items-center justify-end gap-4">
              <span className="text-sm text-gray-500">{text.total(filteredFiles.length)}</span>
              <div className="flex items-center gap-1">
                <button type="button" className="p-1.5 rounded text-gray-300 cursor-not-allowed" disabled aria-label="previous page">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-900 px-2">1</span>
                <button type="button" className="p-1.5 rounded text-gray-300 cursor-not-allowed" disabled aria-label="next page">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <select className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:border-gray-300 cursor-pointer">
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
            </div>
          </div>
        </main>
      </div>

      {isUploadModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setIsUploadModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{text.uploadModal.title}</h3>
                <p className="mt-0.5 text-sm text-gray-500">{text.uploadModal.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label={text.uploadModal.cancel}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <button
                type="button"
                className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-left hover:border-gray-400 hover:bg-gray-100/60 transition-colors"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 text-center">{text.uploadModal.dropTitle}</p>
                <p className="text-xs text-gray-500 mt-1 text-center">{text.uploadModal.dropHint}</p>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
              >
                {text.uploadModal.cancel}
              </button>
              <button
                type="button"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                {text.uploadModal.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
