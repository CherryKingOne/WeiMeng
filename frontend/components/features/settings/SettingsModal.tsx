'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores';
import { getLocaleFromPath, type Locale, withLocale } from '@/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModelType = 'text' | 'image' | 'video';

interface ProviderModel {
  id: string;
  name: string;
  pricing: string;
  modelId: string;
  enabled: boolean;
  compatibleConfig?: {
    apiKey: string;
    baseUrl: string;
    maxTokens?: string;
  };
}

interface ProviderCardData {
  id: string;
  name: string;
  connected: boolean;
  key: string;
  statusText: string;
  activeType: ModelType;
  allowModelManagement: boolean;
  logoBgClass: string;
  logoText: string;
  baseUrl?: string;
  modelName?: string;
  maxTokens?: string;
  models: Record<ModelType, ProviderModel[]>;
}

interface CompatibleEditorState {
  providerId: string;
  modelType: ModelType;
  modelId: string;
  modelName: string;
  apiKey: string;
  baseUrl: string;
  maxTokens: string;
}

interface DeleteConfirmState {
  providerId: string;
  modelType: ModelType;
  modelId: string;
  modelName: string;
}

const initialProviderCards: ProviderCardData[] = [
  {
    id: 'ark',
    name: '火山引擎 Ark',
    connected: false,
    key: '',
    statusText: '未配置',
    activeType: 'text',
    allowModelManagement: false,
    logoBgClass: 'bg-orange-500',
    logoText: 'A',
    models: {
      text: [
        { id: 'ark-1', name: 'Doubao Seed 2.0 Pro', pricing: '输入 ¥3.2 / 输出 ¥1b', modelId: 'doubao-seed-2-0-pro-260215', enabled: true },
        { id: 'ark-2', name: 'Doubao Pro 32k', pricing: '输入 ¥2.4 / 输出 ¥3.2', modelId: 'doubao-pro-32k', enabled: true },
        { id: 'ark-3', name: 'Doubao Lite 4k', pricing: '输入 ¥0.8 / 输出 ¥0.8', modelId: 'doubao-lite-4k', enabled: true },
      ],
      image: [
        { id: 'ark-img-1', name: 'Seedream V3', pricing: '输入 ¥0.08 / 张', modelId: 'seedream-v3', enabled: true },
      ],
      video: [
        { id: 'ark-video-1', name: 'Volc Video 1.2', pricing: '输入 ¥0.45 / 秒', modelId: 'volc-video-1-2', enabled: false },
      ],
    },
  },
  {
    id: 'compatible',
    name: 'OpenAI-API-compatible',
    connected: true,
    key: '••••••••m7k9',
    statusText: '已连接',
    activeType: 'text',
    allowModelManagement: true,
    logoBgClass: 'bg-slate-900',
    logoText: 'C',
    baseUrl: 'https://api.example.com/v1',
    modelName: 'qwen-plus',
    maxTokens: '8192',
    models: {
      text: [
        {
          id: 'compat-1',
          name: 'qwen-plus',
          pricing: 'Max Tokens 8192',
          modelId: 'qwen-plus',
          enabled: true,
          compatibleConfig: {
            apiKey: '••••••••m7k9',
            baseUrl: 'https://api.example.com/v1',
            maxTokens: '8192',
          },
        },
        {
          id: 'compat-2',
          name: 'gpt-4o-mini',
          pricing: 'Max Tokens 4096',
          modelId: 'gpt-4o-mini',
          enabled: false,
          compatibleConfig: {
            apiKey: '••••••••m7k9',
            baseUrl: 'https://api.example.com/v1',
            maxTokens: '4096',
          },
        },
      ],
      image: [],
      video: [],
    },
  },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab, setActiveTab, theme, setTheme, setLanguage } = useSettingsStore();
  const currentLocale = getLocaleFromPath(pathname);
  const isEn = currentLocale === 'en';

  const tabs = [
    { id: 'general', label: isEn ? 'General' : '通用', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'account', label: isEn ? 'Account' : '账户', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'api', label: 'API', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { id: 'model-provider', label: isEn ? 'Providers' : '模型供应商', icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12l8.73-5.04M12 22V12' },
    { id: 'about', label: isEn ? 'About' : '关于', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const [providerCards, setProviderCards] = useState<ProviderCardData[]>(initialProviderCards);
  const [editingCompatible, setEditingCompatible] = useState<CompatibleEditorState | null>(null);
  const [compatError, setCompatError] = useState('');
  const [deletingModel, setDeletingModel] = useState<DeleteConfirmState | null>(null);
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});

  const switchProviderType = (providerId: string, type: ModelType) => {
    setProviderCards((prev) =>
      prev.map((provider) => (provider.id === providerId ? { ...provider, activeType: type } : provider)),
    );
  };

  const toggleProviderModel = (providerId: string, type: ModelType, modelId: string) => {
    setProviderCards((prev) =>
      prev.map((provider) => {
        if (provider.id !== providerId) return provider;
        if (!provider.connected || !provider.key) return provider;

        return {
          ...provider,
          models: {
            ...provider.models,
            [type]: provider.models[type].map((model) =>
              model.id === modelId ? { ...model, enabled: !model.enabled } : model,
            ),
          },
        };
      }),
    );
  };

  const openCompatibleEditor = (providerId: string, modelType: ModelType, model: ProviderModel) => {
    const provider = providerCards.find((p) => p.id === providerId);
    if (!provider) return;

    setCompatError('');
    setEditingCompatible({
      providerId,
      modelType,
      modelId: model.id,
      modelName: model.name,
      apiKey: model.compatibleConfig?.apiKey || provider.key || '',
      baseUrl: model.compatibleConfig?.baseUrl || provider.baseUrl || '',
      maxTokens: model.compatibleConfig?.maxTokens || provider.maxTokens || '',
    });
  };

  const closeCompatibleEditor = () => {
    setEditingCompatible(null);
    setCompatError('');
  };

  const saveCompatibleEditor = () => {
    if (!editingCompatible) return;

    const modelName = editingCompatible.modelName.trim();
    const apiKey = editingCompatible.apiKey.trim();
    const baseUrl = editingCompatible.baseUrl.trim();
    const maxTokens = editingCompatible.maxTokens.trim();

    if (!modelName || !apiKey || !baseUrl) {
      setCompatError(providerText.compatibleRequiredError);
      return;
    }

    setProviderCards((prev) =>
      prev.map((provider) => {
        if (provider.id !== editingCompatible.providerId) return provider;

        const nextModels = {
          ...provider.models,
          [editingCompatible.modelType]: provider.models[editingCompatible.modelType].map((model) =>
            model.id === editingCompatible.modelId
              ? {
                  ...model,
                  name: modelName,
                  modelId: modelName,
                  pricing: maxTokens ? `Max Tokens ${maxTokens}` : providerText.compatiblePricingFallback,
                  compatibleConfig: {
                    apiKey,
                    baseUrl,
                    maxTokens: maxTokens || undefined,
                  },
                }
              : model,
          ),
        };

        return {
          ...provider,
          connected: true,
          statusText: '已连接',
          key: apiKey,
          baseUrl,
          modelName,
          maxTokens,
          models: nextModels,
        };
      }),
    );

    closeCompatibleEditor();
  };

  const openDeleteConfirm = (providerId: string, modelType: ModelType, model: ProviderModel) => {
    setDeletingModel({
      providerId,
      modelType,
      modelId: model.id,
      modelName: model.name,
    });
  };

  const closeDeleteConfirm = () => {
    setDeletingModel(null);
  };

  const confirmDeleteModel = () => {
    if (!deletingModel) return;

    setProviderCards((prev) =>
      prev.map((provider) => {
        if (provider.id !== deletingModel.providerId) return provider;

        return {
          ...provider,
          models: {
            ...provider.models,
            [deletingModel.modelType]: provider.models[deletingModel.modelType].filter(
              (model) => model.id !== deletingModel.modelId,
            ),
          },
        };
      }),
    );

    setEditingCompatible((prev) => {
      if (!prev) return prev;
      if (
        prev.providerId === deletingModel.providerId &&
        prev.modelType === deletingModel.modelType &&
        prev.modelId === deletingModel.modelId
      ) {
        return null;
      }
      return prev;
    });
    setCompatError('');
    closeDeleteConfirm();
  };

  const toggleProviderExpand = (providerId: string) => {
    setExpandedProviders((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  const handleLanguageChange = (nextLanguage: Locale) => {
    setLanguage(nextLanguage);
    if (nextLanguage !== currentLocale) {
      router.push(withLocale(pathname, nextLanguage));
    }
  };

  const modelCountText = (count: number) => (isEn ? `${count} model${count === 1 ? '' : 's'}` : `${count}个模型`);

  const providerText = {
    setupGuide: isEn ? 'Setup Guide' : '开通教程',
    edit: isEn ? 'Edit' : '修改',
    notConfigured: isEn ? 'Not configured' : '未配置',
    configure: isEn ? 'Configure' : '去配置',
    add: isEn ? '+ Add' : '+ 添加',
    officialModelHint: isEn ? 'Official models only, custom add/edit/delete is disabled' : '官方模型，不支持自定义增删改',
    noModels: isEn ? 'No models' : '暂无模型',
    deleteAction: isEn ? 'Delete' : '删除',
    editAction: isEn ? 'Edit' : '编辑',
    editCompatibleTitle: isEn ? 'Edit Compatible Model' : '编辑兼容模型配置',
    modelName: isEn ? 'Model Name' : '模型名称',
    maxTokensOptional: isEn ? 'Max Tokens (Optional)' : 'Max Tokens（可选）',
    cancel: isEn ? 'Cancel' : '取消',
    save: isEn ? 'Save' : '保存',
    close: isEn ? 'Close' : '关闭',
    compatibleRequiredError: isEn ? 'Model Name, Key, and URL are required' : '模型名称、Key、URL 为必填项',
    compatiblePricingFallback: isEn ? 'Compatible model' : '兼容模型',
    confirmDeleteTitle: isEn ? 'Confirm Delete Model' : '确认删除模型',
    confirmDeletePrefix: isEn ? 'Are you sure you want to delete' : '确定删除',
    confirmDeleteSuffix: isEn ? '? This action cannot be undone.' : '吗？删除后不可恢复。',
    confirmDeleteButton: isEn ? 'Delete' : '确认删除',
  };

  const typeMeta: Record<ModelType, { label: string; iconPath: string }> = {
    text: { label: isEn ? 'Text' : '文本', iconPath: 'M4 6h16M4 12h16M4 18h7' },
    image: { label: isEn ? 'Image' : '图像', iconPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    video: { label: isEn ? 'Video' : '视频', iconPath: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m0-4v4m-10 4h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-3xl shadow-2xl w-[760px] max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">{isEn ? 'Settings' : '设置'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[500px]">
          <div className="w-48 bg-gray-50/50 border-r border-gray-100 p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-900">{isEn ? 'Theme' : '主题'}</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'light', label: isEn ? 'Light' : '浅色', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
                      { id: 'dark', label: isEn ? 'Dark' : '深色', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
                      { id: 'auto', label: isEn ? 'System' : '跟随系统', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                    ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as 'light' | 'dark' | 'auto')}
                          className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          theme === t.id
                            ? 'border-black bg-gray-50'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <svg className={`w-6 h-6 ${theme === t.id ? 'text-gray-900' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
                        </svg>
                        <span className={`text-xs font-medium ${theme === t.id ? 'text-gray-900' : 'text-gray-500'}`}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-900">{isEn ? 'Language' : '语言'}</label>
                  <div className="relative">
                    <select
                      value={currentLocale}
                      onChange={(e) => handleLanguageChange(e.target.value as Locale)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black focus:bg-white outline-none text-sm text-gray-900 appearance-none cursor-pointer"
                    >
                      <option value="zh">简体中文</option>
                      <option value="en">English</option>
                    </select>
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 flex items-center justify-center mb-4">
                    <img src="/logo/logo-Icon-light.png" alt="WeiMeng Logo" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">WeiMeng</h3>
                  <p className="text-sm text-gray-500 mt-1">{isEn ? 'Design made simple' : '让设计更简单'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{isEn ? 'Version' : '版本'}</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">v1.0.0</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{isEn ? 'Build' : '构建'}</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">2025.02</p>
                  </div>
                </div>

                <p className="text-xs text-gray-400">© 2025 WeiMeng. All rights reserved.</p>
              </div>
            )}

            {activeTab === 'model-provider' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{isEn ? 'Provider Pool' : '厂商资源池'}</h3>
                    <p className="mt-1 text-sm text-gray-500">{isEn ? 'Manage provider connections and model availability.' : '参考原型图的供应商管理视图，支持连接状态与模型启停。'}</p>
                  </div>
                  <button className="shrink-0 whitespace-nowrap rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors">
                    {isEn ? 'Add Provider' : '新增模型服务商'}
                  </button>
                </div>

                <div className="space-y-4">
                  {providerCards.map((provider) => {
                    const hasKey = Boolean(provider.key?.trim());
                    const hasCompatibleDetails =
                      provider.id !== 'compatible' ||
                      (Boolean(provider.baseUrl?.trim()) && Boolean(provider.modelName?.trim()));
                    const providerReady = provider.connected && hasKey && hasCompatibleDetails;
                    const currentModels = provider.models[provider.activeType];
                    const modelsExpanded = Boolean(expandedProviders[provider.id]);

                    return (
                      <article key={provider.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <header className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${provider.logoBgClass} text-white flex items-center justify-center text-sm font-bold`}>
                              {provider.logoText}
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className="truncate text-sm font-semibold text-gray-900">{provider.name}</h4>
                              <span className={`w-1.5 h-1.5 rounded-full ${providerReady ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            </div>
                          </div>
                          <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">{providerText.setupGuide}</button>
                        </header>

                        {provider.id !== 'compatible' && (
                          <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                            <span className="text-xs font-medium text-gray-600">API Key</span>
                            {providerReady ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-900">{provider.key}</span>
                                <button className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                                  {providerText.edit}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-amber-600">{providerText.notConfigured}</span>
                                <button className="rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-gray-800 transition-colors">
                                  {providerText.configure}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {providerReady && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleProviderExpand(provider.id)}
                              className="mt-3 flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                            >
                              <span>{modelCountText(currentModels.length)}</span>
                              <svg
                                className={`h-3.5 w-3.5 text-gray-500 transition-transform ${modelsExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>

                            {modelsExpanded && (
                              <>
                                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-1 flex gap-1">
                                  {(Object.keys(typeMeta) as ModelType[]).map((type) => (
                                    <button
                                      key={type}
                                      onClick={() => switchProviderType(provider.id, type)}
                                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                                        provider.activeType === type
                                          ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                          : 'text-gray-600 hover:bg-white/70'
                                      }`}
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={typeMeta[type].iconPath} />
                                      </svg>
                                      {typeMeta[type].label}
                                    </button>
                                  ))}
                                </div>

                                <section className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                                  <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                      <span>{typeMeta[provider.activeType].label}</span>
                                      <span className="inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-gray-200 text-[11px] font-bold">
                                        {currentModels.length}
                                      </span>
                                    </div>
                                    {provider.allowModelManagement ? (
                                      <button className="text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors">{providerText.add}</button>
                                    ) : (
                                      <span className="text-[11px] text-gray-500">{providerText.officialModelHint}</span>
                                    )}
                                  </div>

                                  <div className="max-h-44 overflow-y-auto divide-y divide-gray-200">
                                    {currentModels.length === 0 && (
                                      <div className="py-6 text-center text-xs text-gray-400">{providerText.noModels}</div>
                                    )}
                                    {currentModels.map((model) => (
                                      <div
                                        key={model.id}
                                        className={`flex items-center justify-between py-2 px-1 ${providerReady ? 'text-gray-900' : 'text-gray-400'}`}
                                      >
                                        <div className="min-w-0 pr-2">
                                          <p className={`truncate text-xs font-semibold ${providerReady ? 'text-gray-900' : 'text-gray-400'}`}>{model.name}</p>
                                          <p className="text-[11px] text-gray-500">{model.pricing}</p>
                                          <p className="truncate text-[11px] text-gray-400">{model.modelId}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {provider.allowModelManagement && (
                                            <div className="hidden sm:flex items-center gap-1 text-gray-400">
                                              <button
                                                type="button"
                                                onClick={() => openDeleteConfirm(provider.id, provider.activeType, model)}
                                                className="p-1 hover:text-red-500 transition-colors"
                                                title={providerText.deleteAction}
                                              >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => openCompatibleEditor(provider.id, provider.activeType, model)}
                                                className="p-1 hover:text-gray-700 transition-colors"
                                                title={providerText.editAction}
                                              >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                              </button>
                                            </div>
                                          )}
                                          <button
                                            onClick={() => toggleProviderModel(provider.id, provider.activeType, model.id)}
                                            disabled={!providerReady}
                                            className={`relative h-6 w-11 rounded-full border transition-colors ${
                                              !providerReady
                                                ? 'cursor-not-allowed border-[#c9d0dc] bg-[#d1d5db] opacity-60'
                                                : model.enabled
                                                  ? 'border-black bg-black'
                                                  : 'border-[#c9d0dc] bg-[#d9dfe8]'
                                            }`}
                                          >
                                            <span
                                              className={`absolute left-[1px] top-[1px] h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,0.22)] transition-transform ${
                                                providerReady && model.enabled ? 'translate-x-5' : 'translate-x-0'
                                              }`}
                                            />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              </>
                            )}
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {editingCompatible && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeCompatibleEditor();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{providerText.editCompatibleTitle}</h3>
              <button
                type="button"
                onClick={closeCompatibleEditor}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label={providerText.close}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">{providerText.modelName} <span className="text-red-500">*</span></label>
                <input
                  value={editingCompatible.modelName}
                  onChange={(e) => setEditingCompatible((prev) => (prev ? { ...prev, modelName: e.target.value } : prev))}
                  className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Key <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={editingCompatible.apiKey}
                  onChange={(e) => setEditingCompatible((prev) => (prev ? { ...prev, apiKey: e.target.value } : prev))}
                  className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">URL <span className="text-red-500">*</span></label>
                <input
                  value={editingCompatible.baseUrl}
                  onChange={(e) => setEditingCompatible((prev) => (prev ? { ...prev, baseUrl: e.target.value } : prev))}
                  className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{providerText.maxTokensOptional}</label>
                <input
                  type="number"
                  min={1}
                  value={editingCompatible.maxTokens}
                  onChange={(e) => setEditingCompatible((prev) => (prev ? { ...prev, maxTokens: e.target.value } : prev))}
                  className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                />
              </div>
              {compatError && <p className="text-xs text-red-500">{compatError}</p>}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCompatibleEditor}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {providerText.cancel}
              </button>
              <button
                type="button"
                onClick={saveCompatibleEditor}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                {providerText.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingModel && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeDeleteConfirm();
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900">{providerText.confirmDeleteTitle}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {providerText.confirmDeletePrefix}
              <span className="mx-1 font-semibold text-gray-900">“{deletingModel.modelName}”</span>
              {providerText.confirmDeleteSuffix}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {providerText.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDeleteModel}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                {providerText.confirmDeleteButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
