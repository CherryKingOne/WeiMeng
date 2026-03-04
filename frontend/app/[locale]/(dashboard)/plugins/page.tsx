'use client';

import { useMemo, useState } from 'react';
import { useLocalePath } from '@/hooks/useLocalePath';

type PluginCategoryKey = 'model' | 'image' | 'tool' | 'workflow';
type PluginView = 'discover' | 'installed';
type PluginIconKey = 'bolt' | 'image' | 'edit' | 'grid' | 'sliders' | 'caption';
type PluginTagTone = 'blue' | 'purple' | 'amber' | 'emerald' | 'rose' | 'indigo';

type PluginDefinition = {
  id: string;
  name: string;
  category: PluginCategoryKey;
  rating: number;
  downloads: {
    zh: string;
    en: string;
  };
  installed: boolean;
  active: boolean;
  gradient: string;
  icon: PluginIconKey;
  tagTone: PluginTagTone;
  description: {
    zh: string;
    en: string;
  };
};

const iconPathByKey: Record<PluginIconKey, string> = {
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  grid: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  sliders: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  caption: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
};

const tagStyles: Record<PluginTagTone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

const plugins: PluginDefinition[] = [
  {
    id: 'lora-trainer',
    name: 'LoRA Trainer',
    category: 'model',
    rating: 4.9,
    downloads: { zh: '12.5k', en: '12.5K' },
    installed: true,
    active: true,
    gradient: 'from-blue-400 to-cyan-400',
    icon: 'bolt',
    tagTone: 'blue',
    description: {
      zh: '快速训练自定义 LoRA 模型，支持多种基础模型和参数调优。',
      en: 'Train custom LoRA models quickly with flexible base models and tuning controls.',
    },
  },
  {
    id: 'image-upscaler',
    name: 'Image Upscaler',
    category: 'image',
    rating: 4.8,
    downloads: { zh: '8.2k', en: '8.2K' },
    installed: false,
    active: false,
    gradient: 'from-purple-400 to-pink-400',
    icon: 'image',
    tagTone: 'purple',
    description: {
      zh: 'AI 驱动的图像超分辨率工具，可将图片放大 4 倍而不失真。',
      en: 'AI super-resolution utility that enlarges images up to 4x with clear details.',
    },
  },
  {
    id: 'prompt-enhancer',
    name: 'Prompt Enhancer',
    category: 'tool',
    rating: 4.7,
    downloads: { zh: '5.8k', en: '5.8K' },
    installed: true,
    active: true,
    gradient: 'from-amber-400 to-orange-400',
    icon: 'edit',
    tagTone: 'amber',
    description: {
      zh: '智能优化提示词结构，让生成结果更稳定并更贴合创作意图。',
      en: 'Refine prompt structure to improve consistency and creative controllability.',
    },
  },
  {
    id: 'batch-processor',
    name: 'Batch Processor',
    category: 'workflow',
    rating: 4.6,
    downloads: { zh: '3.4k', en: '3.4K' },
    installed: false,
    active: false,
    gradient: 'from-emerald-400 to-teal-400',
    icon: 'grid',
    tagTone: 'emerald',
    description: {
      zh: '支持批量重命名、格式转换和尺寸调整，适合大规模素材处理。',
      en: 'Run batch rename, format conversion, and resizing for large asset operations.',
    },
  },
  {
    id: 'style-transfer',
    name: 'Style Transfer',
    category: 'image',
    rating: 4.9,
    downloads: { zh: '15.2k', en: '15.2K' },
    installed: false,
    active: false,
    gradient: 'from-rose-400 to-red-400',
    icon: 'sliders',
    tagTone: 'rose',
    description: {
      zh: '将任意图像转换为指定艺术风格，支持多种写实与插画预设。',
      en: 'Convert any image into curated art styles with realistic and illustrative presets.',
    },
  },
  {
    id: 'auto-caption',
    name: 'Auto Caption',
    category: 'tool',
    rating: 4.5,
    downloads: { zh: '2.1k', en: '2.1K' },
    installed: true,
    active: true,
    gradient: 'from-indigo-400 to-blue-400',
    icon: 'caption',
    tagTone: 'indigo',
    description: {
      zh: '自动生成多语言图像描述，可用于检索、标注和素材归档。',
      en: 'Generate multilingual image captions for retrieval, labeling, and archival flows.',
    },
  },
];

export default function PluginsPage() {
  const { locale } = useLocalePath();
  const isEn = locale === 'en';
  const [activeView, setActiveView] = useState<PluginView>('discover');
  const [activeCategory, setActiveCategory] = useState<'all' | PluginCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const text = {
    title: isEn ? 'Plugin Center' : '插件中心',
    tabs: {
      discover: isEn ? 'Discover' : '发现',
      installed: isEn ? 'Installed' : '已安装',
    },
    searchPlaceholder: isEn ? 'Search plugins...' : '搜索插件...',
    featured: {
      badge: isEn ? 'Editor Pick' : '编辑推荐',
      title: 'ControlNet Pro',
      description: isEn
        ? 'Advanced pose and structure control for image generation with OpenPose, Canny, and Depth preprocessors.'
        : '强大的姿态控制与图像生成插件，支持 OpenPose、Canny、Depth 等多种预处理器，让 AI 创作更加精准可控。',
      install: isEn ? 'Install Now' : '立即安装',
      learnMore: isEn ? 'Learn More' : '了解更多',
    },
    categories: {
      all: isEn ? 'All' : '全部',
      image: isEn ? 'Image Generation' : '图像生成',
      tool: isEn ? 'Tooling' : '工具增强',
      model: isEn ? 'Model Training' : '模型训练',
      workflow: isEn ? 'Workflow' : '工作流',
    },
    categoryLabel: {
      model: isEn ? 'Model Training' : '模型训练',
      image: isEn ? 'Image Generation' : '图像生成',
      tool: isEn ? 'Tooling' : '工具增强',
      workflow: isEn ? 'Workflow' : '工作流',
    },
    configure: isEn ? 'Configure' : '配置',
    get: isEn ? 'Get' : '获取',
    active: 'Active',
    inactive: isEn ? 'Inactive' : '未启用',
    empty: isEn ? 'No plugin matches current filters.' : '当前筛选条件下没有匹配的插件。',
  };

  const tabs: Array<{ id: PluginView; label: string }> = [
    { id: 'discover', label: text.tabs.discover },
    { id: 'installed', label: text.tabs.installed },
  ];

  const categories: Array<{ id: 'all' | PluginCategoryKey; label: string }> = [
    { id: 'all', label: text.categories.all },
    { id: 'image', label: text.categories.image },
    { id: 'tool', label: text.categories.tool },
    { id: 'model', label: text.categories.model },
    { id: 'workflow', label: text.categories.workflow },
  ];

  const filteredPlugins = useMemo(
    () =>
      plugins.filter((plugin) => {
        if (activeView === 'installed' && !plugin.installed) {
          return false;
        }

        if (activeCategory !== 'all' && plugin.category !== activeCategory) {
          return false;
        }

        const keyword = searchQuery.trim().toLowerCase();
        if (!keyword) {
          return true;
        }

        const description = isEn ? plugin.description.en : plugin.description.zh;
        return (
          plugin.name.toLowerCase().includes(keyword) ||
          description.toLowerCase().includes(keyword)
        );
      }),
    [activeCategory, activeView, isEn, searchQuery]
  );

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{text.title}</h1>
      </div>

      <div className="mb-8 border-b border-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeView === tab.id
                    ? 'border-black text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative mb-3 w-full md:w-auto">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={text.searchPlaceholder}
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="mb-10 rounded-3xl bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50 p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <span className="inline-block px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-purple-600 mb-4">
            {text.featured.badge}
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{text.featured.title}</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{text.featured.description}</p>
          <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
              {text.featured.install}
            </button>
            <button className="px-6 py-2.5 bg-white/80 backdrop-blur-sm text-gray-900 text-sm font-medium rounded-xl hover:bg-white transition-colors">
              {text.featured.learnMore}
            </button>
          </div>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-64 h-64 hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-200/50 to-pink-200/50 rounded-full blur-3xl" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl rotate-12 shadow-2xl" />
            <div className="absolute w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl -rotate-6 shadow-xl" />
            <div className="absolute w-12 h-12 bg-white rounded-lg shadow-lg" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${
              activeCategory === category.id
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {filteredPlugins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPlugins.map((plugin) => {
            const description = isEn ? plugin.description.en : plugin.description.zh;
            return (
              <div
                key={plugin.id}
                className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${plugin.gradient} rounded-xl flex items-center justify-center`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPathByKey[plugin.icon]} />
                    </svg>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {plugin.installed ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                          plugin.active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            plugin.active ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {plugin.active ? text.active : text.inactive}
                      </span>
                    ) : null}

                    <button
                      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        plugin.installed
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {plugin.installed ? text.configure : text.get}
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{plugin.name}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed min-h-[40px]">{description}</p>

                <div className="flex items-center justify-between gap-3">
                  <span className={`px-2.5 py-1 text-xs rounded-lg ${tagStyles[plugin.tagTone]}`}>
                    {text.categoryLabel[plugin.category]}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-gray-400 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {plugin.rating}
                    </span>
                    <span>{isEn ? plugin.downloads.en : plugin.downloads.zh}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">
          {text.empty}
        </div>
      )}
    </div>
  );
}
