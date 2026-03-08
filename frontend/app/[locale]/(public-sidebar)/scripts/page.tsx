'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, type KeyboardEvent, useState } from 'react';
import { useLocalePath } from '@/hooks/useLocalePath';

type ScriptCardMeta = {
  title: string;
  genre: string;
  subtitle: string;
  scenes: string;
  roles: string;
  words: string;
  tone: 'green' | 'blue' | 'red';
};

export default function ScriptsPage() {
  const router = useRouter();
  const { locale, withLocalePath } = useLocalePath();
  const isEn = locale === 'en';
  const scriptDetailPath = withLocalePath('/scripts-detail/scripts-file');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [scriptName, setScriptName] = useState('');
  const [scriptDescription, setScriptDescription] = useState('');
  const [scriptNameError, setScriptNameError] = useState(false);

  const text = {
    title: isEn ? 'Script Library' : '剧本库',
    searchPlaceholder: isEn ? 'Search scripts...' : '搜索剧本...',
    createScript: isEn ? 'Create Script' : '创建剧本',
    modal: {
      title: isEn ? 'Create Script' : '创建剧本',
      subtitle: isEn ? 'After creation, it will be added to your script library.' : '创建后将加入剧本库，可继续编辑内容',
      nameLabel: isEn ? 'Name' : '名称',
      namePlaceholder: isEn ? 'Enter script name' : '输入剧本名称',
      nameHint: isEn ? 'Up to 50 characters' : '最多 50 个字符',
      nameRequired: isEn ? 'Please enter a script name' : '请输入剧本名称',
      descriptionLabel: isEn ? 'Description' : '描述',
      descriptionPlaceholder: isEn ? 'Briefly describe the plot, style, or purpose' : '简要描述剧情内容、风格或用途',
      descriptionHint: isEn ? 'Optional, up to 300 characters' : '可选，最多 300 个字符',
      cancel: isEn ? 'Cancel' : '取消',
      submit: isEn ? 'Create Script' : '创建剧本',
    },
    filters: {
      all: isEn ? 'All' : '全部',
      draft: isEn ? 'Draft' : '草稿',
      reviewing: isEn ? 'Reviewing' : '审核中',
      published: isEn ? 'Published' : '已发布',
    },
    status: {
      draft: isEn ? 'Draft' : '草稿',
      reviewing: isEn ? 'Reviewing' : '审核中',
      published: isEn ? 'Published' : '已发布',
    },
    words: (count: number) => (isEn ? `${count} words` : `${count} 字`),
    scenes: (count: number) => (isEn ? `${count} scenes` : `${count} 场景`),
    updated: (days: number) => (isEn ? `Updated ${days} day${days === 1 ? '' : 's'} ago` : `更新于 ${days} 天前`),
  };

  const filters = [
    { id: 'all', label: text.filters.all },
    { id: 'draft', label: text.filters.draft },
    { id: 'reviewing', label: text.filters.reviewing },
    { id: 'published', label: text.filters.published },
  ];

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setScriptNameError(false);
  };

  const buildScriptDetailPath = (meta: ScriptCardMeta) => {
    const params = new URLSearchParams({
      title: meta.title,
      genre: meta.genre,
      subtitle: meta.subtitle,
      scenes: meta.scenes,
      roles: meta.roles,
      words: meta.words,
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

  const handleCreateScriptSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextScriptName = scriptName.trim();

    if (!nextScriptName) {
      setScriptNameError(true);
      return;
    }

    setScriptNameError(false);
    setIsCreateModalOpen(false);
    setScriptName('');
    setScriptDescription('');
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{text.title}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder={text.searchPlaceholder} className="pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all w-64" />
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

      <div className="flex items-center gap-2 mb-8">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              activeFilter === filter.id
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div
          className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all"
          {...getScriptCardProps({
            title: '黑客帝国',
            genre: '科幻',
            subtitle: '经典开场片段',
            scenes: '12',
            roles: '08',
            words: '2.3k',
            tone: 'green',
          })}
        >
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white">
              <div className="rhythm-line h-1.5 bg-black rounded-full w-full origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[90%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[75%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[85%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[60%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[50%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[80%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[70%] origin-left" />
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[80%] origin-left mt-2" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[65%] origin-left" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-medium text-green-700 tracking-wider">科幻</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">黑客帝国</h3>
                <p className="text-xs text-gray-400 mt-1">经典开场片段</p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-black">12</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-black">08</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">2.3k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div
          className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all"
          {...getScriptCardProps({
            title: '火星救援',
            genre: '冒险',
            subtitle: 'AI 分析中',
            scenes: '--',
            roles: '--',
            words: '4.8k',
            tone: 'blue',
          })}
        >
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white relative">
              <div className="absolute inset-0 bg-blue-50/30 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
              <div className="rhythm-line h-1.5 bg-gray-200 rounded-full w-full origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-200 rounded-full w-[85%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-200 rounded-full w-[70%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[55%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-200 rounded-full w-[75%] origin-left" />
              <div className="rhythm-line h-1.5 bg-gray-200 rounded-full w-[70%] origin-left mt-2" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-blue-100 rounded-full text-[10px] font-medium text-blue-700 tracking-wider">冒险</span>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">火星救援</h3>
                <p className="text-xs text-blue-600 mt-1 font-mono">
                  AI 分析中
                  <span className="loading-dots" aria-hidden="true" />
                </p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-gray-400">--</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-gray-400">--</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">4.8k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div
          className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all"
          {...getScriptCardProps({
            title: '星际穿越',
            genre: '剧情',
            subtitle: '逃生舱片段',
            scenes: '08',
            roles: '05',
            words: '1.5k',
            tone: 'green',
          })}
        >
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white">
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[90%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-full origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[80%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[70%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[55%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[65%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[75%] origin-left" />
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[85%] origin-left mt-2" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-medium text-green-700 tracking-wider">剧情</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">星际穿越</h3>
                <p className="text-xs text-gray-400 mt-1">逃生舱片段</p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-black">08</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-black">05</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">1.5k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div
          className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all"
          {...getScriptCardProps({
            title: '指环王',
            genre: '奇幻',
            subtitle: 'AI 解析失败',
            scenes: '--',
            roles: '--',
            words: '3.2k',
            tone: 'red',
          })}
        >
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white relative">
              <div className="absolute inset-0 bg-red-50/30 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-red-200 bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="rhythm-line h-1.5 bg-gray-200 rounded-full w-full origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-200 rounded-full w-[85%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-200 rounded-full w-[90%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-200 rounded-full w-[70%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[60%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-200 rounded-full w-[80%] origin-left" />
              <div className="rhythm-line h-1.5 bg-gray-200 rounded-full w-[75%] origin-left mt-2" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-red-100 rounded-full text-[10px] font-medium text-red-700 tracking-wider">奇幻</span>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">指环王</h3>
                <p className="text-xs text-red-600 mt-1 font-mono">AI 解析失败</p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-gray-400">--</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-gray-400">--</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">3.2k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div
          className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all"
          {...getScriptCardProps({
            title: '科学怪人',
            genre: '恐怖',
            subtitle: '创造',
            scenes: '06',
            roles: '04',
            words: '2.8k',
            tone: 'green',
          })}
        >
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white">
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[85%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[75%] origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[90%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[50%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[65%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[80%] origin-left" />
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[70%] origin-left mt-2" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-medium text-green-700 tracking-wider">恐怖</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">科学怪人</h3>
                <p className="text-xs text-gray-400 mt-1">创造</p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-black">06</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-black">04</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">2.8k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div
          className="script-card bg-white rounded-xl overflow-hidden cursor-pointer group border border-[#F3F4F6] hover:border-gray-200 transition-all"
          {...getScriptCardProps({
            title: '泰坦尼克号',
            genre: '爱情',
            subtitle: '甲板日落',
            scenes: '10',
            roles: '06',
            words: '4.1k',
            tone: 'green',
          })}
        >
          <div className="flex h-48">
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col justify-center gap-2 bg-white">
              <div className="rhythm-line h-1.5 bg-black rounded-full w-full origin-left" />
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[80%] origin-left" />
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[70%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[55%] origin-center" />
              </div>
              <div className="flex justify-center">
                <div className="rhythm-line h-0.5 bg-gray-400 rounded-full w-[60%] origin-center" />
              </div>
              <div className="rhythm-line h-0.5 bg-gray-300 rounded-full w-[85%] origin-left" />
              <div className="rhythm-line h-1.5 bg-black rounded-full w-[80%] origin-left mt-2" />
            </div>

            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-medium text-green-700 tracking-wider">爱情</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-black tracking-tight">泰坦尼克号</h3>
                <p className="text-xs text-gray-400 mt-1">甲板日落</p>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">场景</p>
                  <p className="text-sm font-medium font-mono text-black">10</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">角色</p>
                  <p className="text-sm font-medium font-mono text-black">06</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">字数</p>
                  <p className="text-sm font-medium font-mono text-black">4.1k</p>
                </div>
                <div className="flex-1" />
                <svg className="w-5 h-5 text-black opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
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
                  onChange={(event) => setScriptDescription(event.target.value)}
                  placeholder={text.modal.descriptionPlaceholder}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors resize-none focus:border-black focus:bg-white"
                />
                <p className="mt-2 text-xs text-gray-400">{text.modal.descriptionHint}</p>
              </div>

              <div className="pt-1 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  {text.modal.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  {text.modal.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes rhythm-pulse {
          0%,
          100% {
            transform: scaleX(1);
          }
          50% {
            transform: scaleX(0.95);
          }
        }

        .script-card:hover .rhythm-line {
          animation: rhythm-pulse 0.6s ease-in-out infinite;
        }

        .script-card:hover .rhythm-line:nth-child(2n) {
          animation-delay: 0.1s;
        }

        .script-card:hover .rhythm-line:nth-child(3n) {
          animation-delay: 0.2s;
        }

        .script-card:hover .rhythm-line:nth-child(4n) {
          animation-delay: 0.15s;
        }

        .loading-dots {
          display: inline-block;
          width: 1ch;
          overflow: hidden;
          vertical-align: bottom;
          animation: dots-loop 1.2s infinite;
        }

        .loading-dots::before {
          content: '...';
        }

        @keyframes dots-loop {
          0% {
            width: 1ch;
          }
          33% {
            width: 2ch;
          }
          66% {
            width: 3ch;
          }
          100% {
            width: 1ch;
          }
        }
      `}</style>
    </div>
  );
}
