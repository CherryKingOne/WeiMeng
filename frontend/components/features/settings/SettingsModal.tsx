'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores';
import { getLocaleFromPath, type Locale, withLocale } from '@/constants';
import { providerService, type OpenAICompatibleModelItem, type ProviderModelItem } from '@/services/provider.service';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProviderModels?: ProviderModelItem[];
  hasInitialProviderModels?: boolean;
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
  originalModelName: string;
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

interface ProviderConfigEditorState {
  providerId: string;
  providerName: string;
  apiKey: string;
}

interface SystemModelFormData {
  providerId: string;
  modelName: string;
  note: string;
}

interface SystemModelSelectionData {
  providerId: string;
  modelName: string;
}

type SystemModelSelectionCache = Record<ModelType, SystemModelSelectionData>;

interface SystemModelSelectOption {
  value: string;
  label: string;
}

interface SystemModelSelectProps {
  value: string;
  placeholder: string;
  ariaLabel: string;
  options: SystemModelSelectOption[];
  onChange: (value: string) => void;
}

function SystemModelSelect({
  value,
  placeholder,
  ariaLabel,
  options,
  onChange,
}: SystemModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="relative mt-1" ref={rootRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 text-sm transition-colors focus:outline-none ${
          isOpen
            ? 'border-gray-900 text-gray-900'
            : 'border-gray-200 text-gray-900 hover:border-gray-300'
        }`}
      >
        <span
          className={selectedOption ? 'text-gray-900' : 'text-gray-400'}
          title={selectedOption?.label || placeholder}
        >
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-[0_12px_28px_rgba(15,23,42,0.14)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            const optionTone = isSelected
              ? 'bg-gray-900 text-white hover:bg-gray-900'
              : option.value === ''
                ? 'text-gray-400 hover:bg-gray-100'
                : 'text-gray-700 hover:bg-gray-100';

            return (
              <button
                key={`${ariaLabel}-${option.value || 'empty'}`}
                type="button"
                title={option.label}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${optionTone}`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? (
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const initialProviderCards: ProviderCardData[] = [
  {
    id: 'volcengine',
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

const providerLogoFallbackClasses = ['bg-slate-700', 'bg-emerald-600', 'bg-sky-600', 'bg-indigo-600', 'bg-rose-600'];
const PROVIDER_MODELS_CACHE_TTL_MS = 5 * 60 * 1000;
const PROVIDER_MODELS_STORAGE_KEY = 'provider_models_cache_v1';
const SYSTEM_MODEL_SELECTION_STORAGE_KEY = 'system_model_selection_cache_v1';

let providerModelsCache: ProviderModelItem[] | null = null;
let providerModelsCachedAt = 0;

type ProviderModelsCacheSnapshot = {
  providers: ProviderModelItem[];
  cachedAt: number;
};

type SystemModelSelectionCacheSnapshot = {
  selections: SystemModelSelectionCache;
  cachedAt: number;
};

function isProviderModelItem(value: unknown): value is ProviderModelItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ProviderModelItem>;
  return typeof candidate.provider === 'string'
    && typeof candidate.configured === 'boolean'
    && Array.isArray(candidate.model_types)
    && candidate.model_types.every((item) => typeof item === 'string')
    && Array.isArray(candidate.models)
    && candidate.models.every((item) => typeof item === 'string');
}

function readPersistedProviderModelsCache(): ProviderModelsCacheSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(PROVIDER_MODELS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ProviderModelsCacheSnapshot>;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.providers)) {
      return null;
    }

    if (!parsed.providers.every(isProviderModelItem)) {
      return null;
    }

    return {
      providers: parsed.providers,
      cachedAt: typeof parsed.cachedAt === 'number' && Number.isFinite(parsed.cachedAt) ? parsed.cachedAt : 0,
    };
  } catch {
    return null;
  }
}

function writePersistedProviderModelsCache(providers: ProviderModelItem[], cachedAt: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(PROVIDER_MODELS_STORAGE_KEY, JSON.stringify({ providers, cachedAt }));
  } catch {
    // Ignore storage write failures.
  }
}

function primeProviderModelsCache(providers: ProviderModelItem[], cachedAt = Date.now()): ProviderModelsCacheSnapshot {
  providerModelsCache = providers;
  providerModelsCachedAt = cachedAt;
  writePersistedProviderModelsCache(providers, cachedAt);

  return {
    providers,
    cachedAt,
  };
}

function getProviderModelsCacheSnapshot(): ProviderModelsCacheSnapshot | null {
  if (providerModelsCache) {
    return {
      providers: providerModelsCache,
      cachedAt: providerModelsCachedAt,
    };
  }

  const persisted = readPersistedProviderModelsCache();
  if (!persisted) {
    return null;
  }

  providerModelsCache = persisted.providers;
  providerModelsCachedAt = persisted.cachedAt;
  return persisted;
}

const providerMetaMap: Record<
  string,
  {
    nameZh: string;
    nameEn: string;
    logoBgClass: string;
    logoText: string;
  }
> = {
  openai: { nameZh: 'OpenAI', nameEn: 'OpenAI', logoBgClass: 'bg-slate-900', logoText: 'O' },
  'openai-compatible': {
    nameZh: 'OpenAI Compatible',
    nameEn: 'OpenAI Compatible',
    logoBgClass: 'bg-slate-700',
    logoText: 'O',
  },
  qwen: { nameZh: '通义千问', nameEn: 'Qwen', logoBgClass: 'bg-green-600', logoText: 'Q' },
  volcengine: { nameZh: '火山引擎 Ark', nameEn: 'Volcengine Ark', logoBgClass: 'bg-orange-500', logoText: 'A' },
  grok: { nameZh: 'Grok', nameEn: 'Grok', logoBgClass: 'bg-zinc-900', logoText: 'G' },
  gemini: { nameZh: 'Gemini', nameEn: 'Gemini', logoBgClass: 'bg-blue-600', logoText: 'G' },
  anthropic: { nameZh: 'Anthropic', nameEn: 'Anthropic', logoBgClass: 'bg-amber-700', logoText: 'A' },
  kimi: { nameZh: 'Kimi', nameEn: 'Kimi', logoBgClass: 'bg-cyan-600', logoText: 'K' },
  glm: { nameZh: '智谱 GLM', nameEn: 'GLM', logoBgClass: 'bg-violet-600', logoText: 'G' },
  minimax: { nameZh: 'MiniMax', nameEn: 'MiniMax', logoBgClass: 'bg-pink-600', logoText: 'M' },
  deepseek: { nameZh: 'DeepSeek', nameEn: 'DeepSeek', logoBgClass: 'bg-indigo-700', logoText: 'D' },
};

const isCompatibleProviderId = (providerId: string): boolean =>
  providerId === 'compatible' || providerId === 'openai-compatible';

const normalizeSystemProviderId = (provider: string): string =>
  provider.trim().toLowerCase() === 'compatible' ? 'openai-compatible' : provider.trim().toLowerCase();

const stripMaskedApiKey = (value?: string): string => {
  const candidate = value?.trim() || '';
  if (!candidate) return '';
  return candidate.includes('•') ? '' : candidate;
};

const extractRequestErrorMessage = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const candidate = error as {
    response?: {
      data?: {
        detail?: unknown;
      };
    };
    message?: unknown;
  };

  const detail = candidate.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown } | undefined;
    if (typeof first?.msg === 'string' && first.msg.trim()) {
      return first.msg.trim();
    }
  }

  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message.trim();
  }

  return null;
};

const backendModelTypeToUiType = (backendType: string): ModelType | null => {
  const normalized = backendType.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('video')) return 'video';
  if (normalized.includes('image')) return 'image';
  if (normalized === 'llm') return 'text';
  return null;
};

const createEmptyModels = (): Record<ModelType, ProviderModel[]> => ({
  text: [],
  image: [],
  video: [],
});

const createEmptySystemModelForms = (): Record<ModelType, SystemModelFormData> => ({
  text: { providerId: '', modelName: '', note: '' },
  image: { providerId: '', modelName: '', note: '' },
  video: { providerId: '', modelName: '', note: '' },
});

const createEmptySystemModelSelections = (): SystemModelSelectionCache => ({
  text: { providerId: '', modelName: '' },
  image: { providerId: '', modelName: '' },
  video: { providerId: '', modelName: '' },
});

function readPersistedSystemModelSelectionCache(): SystemModelSelectionCacheSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(SYSTEM_MODEL_SELECTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SystemModelSelectionCacheSnapshot>;
    if (!parsed || typeof parsed !== 'object' || !parsed.selections || typeof parsed.selections !== 'object') {
      return null;
    }

    const nextSelections = createEmptySystemModelSelections();
    (['text', 'image', 'video'] as ModelType[]).forEach((type) => {
      const candidate = (parsed.selections as Partial<SystemModelSelectionCache>)[type];
      if (!candidate || typeof candidate !== 'object') return;

      nextSelections[type] = {
        providerId: typeof candidate.providerId === 'string' ? candidate.providerId : '',
        modelName: typeof candidate.modelName === 'string' ? candidate.modelName : '',
      };
    });

    return {
      selections: nextSelections,
      cachedAt: typeof parsed.cachedAt === 'number' && Number.isFinite(parsed.cachedAt) ? parsed.cachedAt : 0,
    };
  } catch {
    return null;
  }
}

function writePersistedSystemModelSelectionCache(selections: SystemModelSelectionCache, cachedAt: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(SYSTEM_MODEL_SELECTION_STORAGE_KEY, JSON.stringify({ selections, cachedAt }));
  } catch {
    // Ignore storage write failures.
  }
}

const applySelectionsToSystemModelForms = (
  forms: Record<ModelType, SystemModelFormData>,
  selections: SystemModelSelectionCache,
): Record<ModelType, SystemModelFormData> => {
  const nextForms: Record<ModelType, SystemModelFormData> = {
    text: { ...forms.text },
    image: { ...forms.image },
    video: { ...forms.video },
  };

  (['text', 'image', 'video'] as ModelType[]).forEach((type) => {
    const selection = selections[type];
    if (!selection.providerId.trim() || !selection.modelName.trim()) {
      return;
    }

    nextForms[type] = {
      ...nextForms[type],
      providerId: selection.providerId.trim(),
      modelName: selection.modelName.trim(),
    };
  });

  return nextForms;
};

const buildSystemModelFormsFromProviders = (
  providers: ProviderCardData[],
): Record<ModelType, SystemModelFormData> => {
  const forms = createEmptySystemModelForms();

  (['text', 'image', 'video'] as ModelType[]).forEach((type) => {
    const configuredProviders = providers.filter((provider) => provider.connected && provider.models[type].length > 0);
    const anyProviders = providers.filter((provider) => provider.models[type].length > 0);
    const selectedProvider = configuredProviders[0] || anyProviders[0];

    if (!selectedProvider) return;

    forms[type].providerId = selectedProvider.id;
    forms[type].modelName = selectedProvider.models[type][0]?.modelId || selectedProvider.models[type][0]?.name || '';
  });

  return forms;
};

const mapProviderModelsToCards = (
  providers: ProviderModelItem[],
  isEn: boolean,
  openAICompatibleModels: OpenAICompatibleModelItem[] = [],
): ProviderCardData[] =>
  providers.map((provider, index) => {
    const meta = providerMetaMap[provider.provider];
    const providerKey = provider.provider.toLowerCase();
    const providerLabel = provider.provider
      .split(/[-_]/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
    const models = createEmptyModels();
    const activeTypeSet = new Set<ModelType>();

    provider.model_types.forEach((backendType) => {
      const uiType = backendModelTypeToUiType(backendType);
      if (!uiType) return;
      activeTypeSet.add(uiType);
    });

    const compatibleModelsById = isCompatibleProviderId(providerKey)
      ? new Map(openAICompatibleModels.map((item) => [item.model.trim().toLowerCase(), item]))
      : null;
    const fallbackModelNames = compatibleModelsById ? openAICompatibleModels.map((item) => item.model) : [];
    const modelNames = ((provider.models && provider.models.length > 0) ? provider.models : fallbackModelNames)
      .filter((modelName) => modelName.trim().length > 0);
    const targetType = Array.from(activeTypeSet)[0] || 'text';

    if (modelNames.length > 0) {
      models[targetType] = modelNames.map((modelName, modelIndex) => {
        const normalizedModelName = modelName.trim().toLowerCase();
        const compatibleDetail = compatibleModelsById?.get(normalizedModelName);
        const compatibleMaxToken = compatibleDetail?.max_token;

        return {
          id: `${providerKey}-${targetType}-${modelIndex}-${modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: modelName,
          pricing:
            compatibleDetail
              ? compatibleMaxToken
                ? `Max Tokens ${compatibleMaxToken}`
                : (isEn ? 'Compatible model' : '兼容模型')
              : (isEn ? 'Official model' : '官方模型'),
          modelId: modelName,
          enabled: provider.configured,
          compatibleConfig: compatibleDetail
            ? {
                apiKey: '',
                baseUrl: compatibleDetail.base_url || '',
                maxTokens: compatibleDetail.max_token ? String(compatibleDetail.max_token) : '',
              }
            : undefined,
        };
      });
    } else {
      provider.model_types.forEach((backendType) => {
        const uiType = backendModelTypeToUiType(backendType);
        if (!uiType) return;
        models[uiType].push({
          id: `${providerKey}-${backendType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: backendType,
          pricing: isEn ? 'Capability' : '能力类型',
          modelId: backendType,
          enabled: provider.configured,
        });
      });
    }

    const activeTypes = Array.from(activeTypeSet);
    const activeType = activeTypes[0] || 'text';

    const firstCompatibleModel = compatibleModelsById ? openAICompatibleModels[0] : undefined;

    return {
      id: providerKey,
      name: isEn ? meta?.nameEn || providerLabel : meta?.nameZh || providerLabel,
      connected: provider.configured,
      key: provider.configured ? '••••••••' : '',
      statusText: provider.configured ? (isEn ? 'Connected' : '已连接') : (isEn ? 'Not configured' : '未配置'),
      activeType,
      allowModelManagement: isCompatibleProviderId(providerKey),
      logoBgClass: meta?.logoBgClass || providerLogoFallbackClasses[index % providerLogoFallbackClasses.length],
      logoText: meta?.logoText || provider.provider.charAt(0).toUpperCase() || 'P',
      baseUrl: firstCompatibleModel?.base_url || undefined,
      modelName: firstCompatibleModel?.model || undefined,
      maxTokens: firstCompatibleModel?.max_token ? String(firstCompatibleModel.max_token) : undefined,
      models,
    };
  });

export function SettingsModal({
  isOpen,
  onClose,
  initialProviderModels = [],
  hasInitialProviderModels = false,
}: SettingsModalProps) {
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

  const [providerCards, setProviderCards] = useState<ProviderCardData[]>(() => {
    const snapshot = hasInitialProviderModels
      ? primeProviderModelsCache(initialProviderModels)
      : getProviderModelsCacheSnapshot();
    return snapshot ? mapProviderModelsToCards(snapshot.providers, isEn) : [];
  });
  const [editingCompatible, setEditingCompatible] = useState<CompatibleEditorState | null>(null);
  const [compatError, setCompatError] = useState('');
  const [savingCompatible, setSavingCompatible] = useState(false);
  const [deletingCompatible, setDeletingCompatible] = useState(false);
  const [deletingModel, setDeletingModel] = useState<DeleteConfirmState | null>(null);
  const [editingProviderConfig, setEditingProviderConfig] = useState<ProviderConfigEditorState | null>(null);
  const [providerConfigError, setProviderConfigError] = useState('');
  const [savingProviderConfig, setSavingProviderConfig] = useState(false);
  const [showProviderApiKey, setShowProviderApiKey] = useState(false);
  const [showCompatibleApiKey, setShowCompatibleApiKey] = useState(false);
  const [showSystemModelConfigModal, setShowSystemModelConfigModal] = useState(false);
  const [systemModelForms, setSystemModelForms] = useState<Record<ModelType, SystemModelFormData>>(
    createEmptySystemModelForms,
  );
  const [systemModelFormError, setSystemModelFormError] = useState('');
  const [savingSystemModel, setSavingSystemModel] = useState(false);
  const [systemModelSelections, setSystemModelSelections] = useState<SystemModelSelectionCache>(() => {
    const persisted = readPersistedSystemModelSelectionCache();
    return persisted?.selections || createEmptySystemModelSelections();
  });
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerLoadError, setProviderLoadError] = useState('');
  const [hasResolvedProviders, setHasResolvedProviders] = useState(() => {
    if (hasInitialProviderModels) {
      return true;
    }

    return Boolean(getProviderModelsCacheSnapshot());
  });

  const loadOpenAICompatibleConfigs = async (): Promise<OpenAICompatibleModelItem[]> => {
    try {
      const response = await providerService.listOpenAICompatibleConfigs();
      return response.models || [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!hasInitialProviderModels) {
      const snapshot = getProviderModelsCacheSnapshot();
      if (snapshot) {
        setProviderCards(mapProviderModelsToCards(snapshot.providers, isEn));
        setHasResolvedProviders(true);
      }
      return;
    }

    const snapshot = primeProviderModelsCache(initialProviderModels);
    setProviderCards(mapProviderModelsToCards(snapshot.providers, isEn));
    setHasResolvedProviders(true);
    setLoadingProviders(false);
    setProviderLoadError('');
  }, [hasInitialProviderModels, initialProviderModels, isEn]);

  const switchProviderType = (providerId: string, type: ModelType) => {
    setProviderCards((prev) =>
      prev.map((provider) => (provider.id === providerId ? { ...provider, activeType: type } : provider)),
    );
  };

  const toggleProviderModel = (providerId: string, type: ModelType, modelId: string) => {
    setProviderCards((prev) =>
      prev.map((provider) => {
        if (provider.id !== providerId) return provider;
        if (!provider.connected) return provider;

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
    setShowCompatibleApiKey(false);
    const resolvedModelApiKey = stripMaskedApiKey(model.compatibleConfig?.apiKey);
    const resolvedProviderApiKey = stripMaskedApiKey(provider.key);
    setEditingCompatible({
      providerId,
      modelType,
      modelId: model.id,
      originalModelName: model.modelId || model.name,
      modelName: model.name,
      apiKey: resolvedModelApiKey || resolvedProviderApiKey,
      baseUrl: model.compatibleConfig?.baseUrl || provider.baseUrl || '',
      maxTokens: model.compatibleConfig?.maxTokens || provider.maxTokens || '',
    });
  };

  const openCreateCompatibleEditor = (providerId: string, modelType: ModelType) => {
    const provider = providerCards.find((p) => p.id === providerId);
    if (!provider) return;

    setCompatError('');
    setShowCompatibleApiKey(false);
    setEditingCompatible({
      providerId,
      modelType,
      modelId: '',
      originalModelName: '',
      modelName: '',
      apiKey: stripMaskedApiKey(provider.key),
      baseUrl: provider.baseUrl || '',
      maxTokens: provider.maxTokens || '',
    });
  };

  const closeCompatibleEditor = () => {
    if (savingCompatible) return;
    setEditingCompatible(null);
    setCompatError('');
    setShowCompatibleApiKey(false);
  };

  const saveCompatibleEditor = async () => {
    if (!editingCompatible || savingCompatible) return;

    const modelName = editingCompatible.modelName.trim();
    const apiKey = editingCompatible.apiKey.trim();
    const baseUrl = editingCompatible.baseUrl.trim();
    const maxTokens = editingCompatible.maxTokens.trim();

    if (!modelName || !apiKey || !baseUrl) {
      setCompatError(providerText.compatibleRequiredError);
      return;
    }

    const parsedMaxToken = maxTokens ? Number(maxTokens) : undefined;
    if (typeof parsedMaxToken === 'number' && (!Number.isFinite(parsedMaxToken) || parsedMaxToken <= 0)) {
      setCompatError(isEn ? 'Max Tokens must be a positive number' : 'Max Tokens 必须为正整数');
      return;
    }

    setSavingCompatible(true);
    setCompatError('');

    const payload = {
      provider: 'openai-compatible' as const,
      base_url: baseUrl,
      api_key: apiKey,
      model: modelName,
      max_token: parsedMaxToken ? Math.floor(parsedMaxToken) : undefined,
      temperature: 0.7,
    };

    try {
      const isCreating = editingCompatible.modelId === '';
      const originalModelName = editingCompatible.originalModelName.trim();

      if (isCreating) {
        await providerService.createOpenAICompatibleConfig(payload);
      } else if (originalModelName && originalModelName !== modelName) {
        await providerService.createOpenAICompatibleConfig(payload);
        await providerService.deleteOpenAICompatibleConfig(originalModelName);
      } else {
        await providerService.updateOpenAICompatibleConfig(payload);
      }

      const [response, compatibleResponse] = await Promise.all([
        providerService.getProviderModels(),
        providerService.listOpenAICompatibleConfigs().catch(() => ({ models: [] })),
      ]);
      const nextProviders = response.providers || [];
      const compatibleModels = compatibleResponse.models || [];
      primeProviderModelsCache(nextProviders);
      setProviderCards(mapProviderModelsToCards(nextProviders, isEn, compatibleModels));
      setHasResolvedProviders(true);
      closeCompatibleEditor();
    } catch (error) {
      const message = extractRequestErrorMessage(error);
      setCompatError(message || (isEn ? 'Failed to save compatible model config' : '保存兼容模型配置失败'));
    } finally {
      setSavingCompatible(false);
    }
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

  const confirmDeleteModel = async () => {
    if (!deletingModel || deletingCompatible) return;

    const providerCard = providerCards.find((provider) => provider.id === deletingModel.providerId);
    const deletingTarget = providerCard?.models[deletingModel.modelType].find((model) => model.id === deletingModel.modelId);

    if (providerCard && isCompatibleProviderId(providerCard.id) && deletingTarget?.modelId) {
      setDeletingCompatible(true);
      setCompatError('');
      try {
        await providerService.deleteOpenAICompatibleConfig(deletingTarget.modelId);
        const [response, compatibleResponse] = await Promise.all([
          providerService.getProviderModels(),
          providerService.listOpenAICompatibleConfigs().catch(() => ({ models: [] })),
        ]);
        const nextProviders = response.providers || [];
        const compatibleModels = compatibleResponse.models || [];
        primeProviderModelsCache(nextProviders);
        setProviderCards(mapProviderModelsToCards(nextProviders, isEn, compatibleModels));
        setHasResolvedProviders(true);
      } catch (error) {
        const message = extractRequestErrorMessage(error);
        setCompatError(message || (isEn ? 'Failed to delete compatible model' : '删除兼容模型失败'));
        return;
      } finally {
        setDeletingCompatible(false);
      }
    } else {
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
    }

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
    closeDeleteConfirm();
  };

  const toggleProviderExpand = (providerId: string) => {
    setExpandedProviders((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  const refreshSystemModelSelectionsFromServer = useCallback(async () => {
    try {
      const systemConfig = await providerService.getSystemModelConfig();
      if (!systemConfig.configured || !systemConfig.provider || !systemConfig.model_name) {
        return;
      }

      const normalizedType = systemConfig.type === 'image' || systemConfig.type === 'video'
        ? systemConfig.type
        : 'text';
      const normalizedProviderId = normalizeSystemProviderId(systemConfig.provider);
      const modelName = systemConfig.model_name.trim();
      if (!normalizedProviderId || !modelName) {
        return;
      }

      setSystemModelSelections((prev) => {
        const nextSelections: SystemModelSelectionCache = {
          text: { ...prev.text },
          image: { ...prev.image },
          video: { ...prev.video },
          [normalizedType]: {
            providerId: normalizedProviderId,
            modelName,
          },
        };
        writePersistedSystemModelSelectionCache(nextSelections, Date.now());
        return nextSelections;
      });
    } catch {
      // Keep cache-first selections when remote config fetch fails.
    }
  }, []);

  const openSystemModelConfigModal = () => {
    setSystemModelFormError('');
    const formsFromProviders = buildSystemModelFormsFromProviders(providerCards);
    setSystemModelForms(applySelectionsToSystemModelForms(formsFromProviders, systemModelSelections));
    setShowSystemModelConfigModal(true);
    void refreshSystemModelSelectionsFromServer();
  };

  const closeSystemModelConfigModal = () => {
    if (savingSystemModel) return;
    setShowSystemModelConfigModal(false);
    setSystemModelFormError('');
  };

  const updateSystemModelForm = (
    type: ModelType,
    patch: Partial<SystemModelFormData>,
  ) => {
    setSystemModelForms((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...patch,
      },
    }));
  };

  const handleSystemModelProviderChange = (type: ModelType, providerId: string) => {
    const provider = providerCards.find((card) => card.id === providerId);
    const firstModelName = provider?.models[type][0]?.modelId || provider?.models[type][0]?.name || '';

    updateSystemModelForm(type, {
      providerId,
      modelName: firstModelName,
    });
  };

  const saveSystemModelForms = async () => {
    if (savingSystemModel) return;

    const allTypes: ModelType[] = ['text', 'image', 'video'];
    const partialType = allTypes.find((type) => {
      const form = systemModelForms[type];
      const hasProvider = Boolean(form.providerId.trim());
      const hasModel = Boolean(form.modelName.trim());
      return (hasProvider && !hasModel) || (!hasProvider && hasModel);
    });

    if (partialType) {
      setSystemModelFormError(
        isEn
          ? 'For each type, provider and model should be both filled or both empty.'
          : '每个类型下，供应商和模型需要同时填写或同时留空。',
      );
      return;
    }

    const completedTypes = allTypes.filter((type) => {
      const form = systemModelForms[type];
      return Boolean(form.providerId.trim()) && Boolean(form.modelName.trim());
    });

    if (completedTypes.length === 0) {
      setSystemModelFormError(
        isEn
          ? 'Please complete at least one type before saving.'
          : '请至少填写一个类型后再保存。',
      );
      return;
    }

    setSavingSystemModel(true);
    setSystemModelFormError('');
    try {
      await Promise.all(
        completedTypes.map((type) => {
          const form = systemModelForms[type];
          const providerId = form.providerId.trim();
          const provider = (providerId === 'compatible' || providerId === 'openai-compatible')
            ? 'openai-compatible'
            : providerId;

          return providerService.upsertSystemModelConfig({
            type,
            provider,
            model_name: form.modelName.trim(),
          });
        }),
      );
      setSystemModelSelections((prev) => {
        const nextSelections: SystemModelSelectionCache = {
          text: { ...prev.text },
          image: { ...prev.image },
          video: { ...prev.video },
        };

        completedTypes.forEach((type) => {
          const form = systemModelForms[type];
          nextSelections[type] = {
            providerId: normalizeSystemProviderId(form.providerId),
            modelName: form.modelName.trim(),
          };
        });
        writePersistedSystemModelSelectionCache(nextSelections, Date.now());
        return nextSelections;
      });
      setShowSystemModelConfigModal(false);
      setSystemModelFormError('');
    } catch (error) {
      const message = extractRequestErrorMessage(error);
      setSystemModelFormError(
        message || (isEn ? 'Failed to save system model config.' : '保存系统模型配置失败。'),
      );
    } finally {
      setSavingSystemModel(false);
    }
  };

  const openProviderConfigEditor = (providerId: string) => {
    const provider = providerCards.find((item) => item.id === providerId);
    if (!provider) return;
    setProviderConfigError('');
    setShowProviderApiKey(false);
    setEditingProviderConfig({
      providerId,
      providerName: provider.name,
      apiKey: '',
    });
  };

  const closeProviderConfigEditor = () => {
    if (savingProviderConfig) return;
    setEditingProviderConfig(null);
    setProviderConfigError('');
    setShowProviderApiKey(false);
  };

  const saveProviderConfig = async () => {
    if (!editingProviderConfig || savingProviderConfig) return;
    const apiKey = editingProviderConfig.apiKey.trim();
    if (!apiKey) {
      setProviderConfigError(providerText.providerApiKeyRequiredError);
      return;
    }

    setSavingProviderConfig(true);
    setProviderConfigError('');

    try {
      await providerService.upsertProviderConfig({
        provider: editingProviderConfig.providerId,
        api_key: apiKey,
      });

      setProviderCards((prev) =>
        prev.map((provider) =>
          provider.id === editingProviderConfig.providerId
            ? {
                ...provider,
                connected: true,
                key: '••••••••',
                statusText: isEn ? 'Connected' : '已连接',
              }
            : provider,
        ),
      );

      if (providerModelsCache) {
        const exists = providerModelsCache.some((provider) => provider.provider === editingProviderConfig.providerId);
        if (exists) {
          primeProviderModelsCache(providerModelsCache.map((provider) =>
            provider.provider === editingProviderConfig.providerId ? { ...provider, configured: true } : provider,
          ), providerModelsCachedAt || Date.now());
        }
      }

      try {
        const [response, compatibleResponse] = await Promise.all([
          providerService.getProviderModels(),
          providerService.listOpenAICompatibleConfigs().catch(() => ({ models: [] })),
        ]);
        const nextProviders = response.providers || [];
        const compatibleModels = compatibleResponse.models || [];
        primeProviderModelsCache(nextProviders);
        setProviderCards(mapProviderModelsToCards(nextProviders, isEn, compatibleModels));
      } catch {
        if (providerModelsCache) {
          writePersistedProviderModelsCache(providerModelsCache, Date.now());
          providerModelsCachedAt = Date.now();
        }
      }

      setEditingProviderConfig(null);
      setShowProviderApiKey(false);
    } catch {
      setProviderConfigError(providerText.providerConfigSaveError);
    } finally {
      setSavingProviderConfig(false);
    }
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'model-provider') return;

    let disposed = false;

    const loadProviders = async () => {
      const snapshot = hasInitialProviderModels
        ? primeProviderModelsCache(initialProviderModels, providerModelsCachedAt || Date.now())
        : getProviderModelsCacheSnapshot();
      const hasCache = Boolean(snapshot);
      const isCacheFresh = snapshot ? Date.now() - snapshot.cachedAt < PROVIDER_MODELS_CACHE_TTL_MS : false;

      if (!hasCache) {
        setHasResolvedProviders(false);
      }

      if (snapshot) {
        setProviderCards(mapProviderModelsToCards(snapshot.providers, isEn));
        setHasResolvedProviders(true);
        setLoadingProviders(false);
      }

      if (isCacheFresh) {
        if (snapshot) {
          const compatibleModels = await loadOpenAICompatibleConfigs();
          if (!disposed) {
            setProviderCards(mapProviderModelsToCards(snapshot.providers, isEn, compatibleModels));
          }
        }
        setLoadingProviders(false);
        setProviderLoadError('');
        setHasResolvedProviders(true);
        return;
      }

      if (!hasCache) {
        setLoadingProviders(true);
      }
      setProviderLoadError('');
      try {
        const [response, compatibleResponse] = await Promise.all([
          providerService.getProviderModels(),
          providerService.listOpenAICompatibleConfigs().catch(() => ({ models: [] })),
        ]);
        if (disposed) return;
        const nextProviders = response.providers || [];
        const compatibleModels = compatibleResponse.models || [];
        primeProviderModelsCache(nextProviders);
        setProviderCards(mapProviderModelsToCards(nextProviders, isEn, compatibleModels));
      } catch {
        if (disposed) return;
        if (!hasCache) {
          setProviderLoadError(
            isEn ? 'Failed to load providers. Showing default list.' : '加载供应商失败，已展示默认列表。',
          );
          setProviderCards(initialProviderCards);
        }
      } finally {
        if (!disposed) {
          setLoadingProviders(false);
          setHasResolvedProviders(true);
        }
      }
    };

    void loadProviders();

    return () => {
      disposed = true;
    };
  }, [activeTab, hasInitialProviderModels, initialProviderModels, isEn, isOpen]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'model-provider') return;
    void refreshSystemModelSelectionsFromServer();
  }, [activeTab, isOpen, refreshSystemModelSelectionsFromServer]);

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
    configured: isEn ? 'Configured' : '已配置',
    configure: isEn ? 'Configure' : '去配置',
    add: isEn ? '+ Add' : '+ 添加',
    addModel: isEn ? 'Add model' : '添加模型',
    officialModelHint: isEn ? 'Official models only, custom add/edit/delete is disabled' : '官方模型，不支持自定义增删改',
    noModels: isEn ? 'No models' : '暂无模型',
    noProviders: isEn ? 'No providers available' : '暂无供应商',
    loadingProviders: isEn ? 'Loading providers...' : '正在加载供应商...',
    deleteAction: isEn ? 'Delete' : '删除',
    editAction: isEn ? 'Edit' : '编辑',
    editCompatibleTitle: isEn ? 'Edit Compatible Model' : '编辑兼容模型配置',
    editProviderConfigTitle: isEn ? 'Configure Provider Key' : '配置供应商 Key',
    providerApiKeyLabel: isEn ? 'API Key' : 'API Key',
    providerApiKeyPlaceholder: isEn ? 'Enter provider API key' : '请输入供应商 API Key',
    showApiKey: isEn ? 'Show key' : '显示 Key',
    hideApiKey: isEn ? 'Hide key' : '隐藏 Key',
    providerApiKeyRequiredError: isEn ? 'API Key is required' : '请填写 API Key',
    providerConfigSaveError: isEn ? 'Failed to save provider config' : '保存供应商配置失败',
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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl flex flex-col w-[1040px] max-w-[calc(100vw-2rem)] h-[min(2040px,calc(100vh-1rem))] overflow-hidden animate-in zoom-in-95 duration-200">
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

        <div className="flex flex-1 min-h-0">
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
                  <p className="text-sm text-gray-500 mt-1">{isEn ? 'Creation made simple' : '让创作更简单'}</p>
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
                  <button
                    type="button"
                    onClick={openSystemModelConfigModal}
                    className="shrink-0 whitespace-nowrap rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
                  >
                    {isEn ? 'Configure System Model' : '配置系统模型'}
                  </button>
                </div>

                <div className="space-y-4">
                  {loadingProviders && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                      {providerText.loadingProviders}
                    </div>
                  )}

                  {providerLoadError && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      {providerLoadError}
                    </div>
                  )}

                  {hasResolvedProviders && !loadingProviders && providerCards.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center text-xs text-gray-500">
                      {providerText.noProviders}
                    </div>
                  )}

                  {providerCards.map((provider) => {
                    const isCompatibleProvider = isCompatibleProviderId(provider.id);
                    const compatibleModelCount = provider.models.text.length + provider.models.image.length + provider.models.video.length;
                    const hasKey = provider.connected || Boolean(provider.key?.trim());
                    const hasCompatibleDetails =
                      !isCompatibleProvider ||
                      compatibleModelCount > 0 ||
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

                        {isCompatibleProvider ? (
                          <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                            <span className="text-xs font-medium text-gray-600">{providerText.addModel}</span>
                            <button
                              type="button"
                              onClick={() => openCreateCompatibleEditor(provider.id, provider.activeType)}
                              className="rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-gray-800 transition-colors"
                            >
                              {providerText.add}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                            <span className="text-xs font-medium text-gray-600">API Key</span>
                            {providerReady ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-900">{provider.key || providerText.configured}</span>
                                <button
                                  type="button"
                                  onClick={() => openProviderConfigEditor(provider.id)}
                                  className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                  {providerText.edit}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-amber-600">{providerText.notConfigured}</span>
                                <button
                                  type="button"
                                  onClick={() => openProviderConfigEditor(provider.id)}
                                  className="rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-gray-800 transition-colors"
                                >
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
                                      <button
                                        type="button"
                                        onClick={() => openCreateCompatibleEditor(provider.id, provider.activeType)}
                                        className="text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                                      >
                                        {providerText.add}
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-gray-500">{providerText.officialModelHint}</span>
                                    )}
                                  </div>

                                  <div className="divide-y divide-gray-200">
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

      {showSystemModelConfigModal && (
        <div
          className="fixed inset-0 z-[56] flex items-center justify-center bg-black/35 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeSystemModelConfigModal();
            }
          }}
        >
          <div className="w-full max-w-6xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{isEn ? 'Configure System Model' : '配置系统模型'}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {isEn
                    ? 'Configure defaults for text, image, and video generation.'
                    : '为文本、图像、视频三类能力分别配置默认模型。'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSystemModelConfigModal}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label={providerText.close}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(['text', 'image', 'video'] as ModelType[]).map((type) => {
                const form = systemModelForms[type];
                const providersForType = providerCards.filter((provider) => provider.models[type].length > 0);
                const selectedProvider = providersForType.find((provider) => provider.id === form.providerId);
                const modelsForType = selectedProvider?.models[type] || [];

                return (
                  <section key={type} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={typeMeta[type].iconPath} />
                          </svg>
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{typeMeta[type].label}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">{isEn ? 'Provider' : '供应商'}</label>
                        <SystemModelSelect
                          value={form.providerId}
                          placeholder={isEn ? 'Select provider' : '选择供应商'}
                          ariaLabel={`${type}-${isEn ? 'provider' : '供应商'}`}
                          options={[
                            { value: '', label: isEn ? 'Select provider' : '选择供应商' },
                            ...providersForType.map((provider) => ({
                              value: provider.id,
                              label: provider.name,
                            })),
                          ]}
                          onChange={(value) => handleSystemModelProviderChange(type, value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">{isEn ? 'Model' : '模型'}</label>
                        {modelsForType.length > 0 ? (
                          <SystemModelSelect
                            value={form.modelName}
                            placeholder={isEn ? 'Select model' : '选择模型'}
                            ariaLabel={`${type}-${isEn ? 'model' : '模型'}`}
                            options={[
                              { value: '', label: isEn ? 'Select model' : '选择模型' },
                              ...modelsForType.map((model) => ({
                                value: model.modelId || model.name,
                                label: model.name,
                              })),
                            ]}
                            onChange={(value) => updateSystemModelForm(type, { modelName: value })}
                          />
                        ) : (
                          <input
                            value={form.modelName}
                            onChange={(e) => updateSystemModelForm(type, { modelName: e.target.value })}
                            placeholder={isEn ? 'Enter model name' : '输入模型名称'}
                            className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">{isEn ? 'Notes (Optional)' : '备注（可选）'}</label>
                        <textarea
                          rows={3}
                          value={form.note}
                          onChange={(e) => updateSystemModelForm(type, { note: e.target.value })}
                          placeholder={isEn ? 'Scenario, quality target, or constraints.' : '填写场景、质量目标或约束。'}
                          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            {systemModelFormError && (
              <p className="mt-4 text-xs text-red-500">{systemModelFormError}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeSystemModelConfigModal}
                disabled={savingSystemModel}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {providerText.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  void saveSystemModelForms();
                }}
                disabled={savingSystemModel}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingSystemModel ? (isEn ? 'Saving...' : '保存中...') : providerText.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProviderConfig && (
        <div
          className="fixed inset-0 z-[58] flex items-center justify-center bg-black/35 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeProviderConfigEditor();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{providerText.editProviderConfigTitle}</h3>
                <p className="mt-1 text-xs text-gray-500">{editingProviderConfig.providerName}</p>
              </div>
              <button
                type="button"
                onClick={closeProviderConfigEditor}
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
                <label className="block text-sm font-medium text-gray-700">{providerText.providerApiKeyLabel} <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <input
                    type={showProviderApiKey ? 'text' : 'password'}
                    value={editingProviderConfig.apiKey}
                    onChange={(e) =>
                      setEditingProviderConfig((prev) => (prev ? { ...prev, apiKey: e.target.value } : prev))
                    }
                    placeholder={providerText.providerApiKeyPlaceholder}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProviderApiKey((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    aria-label={showProviderApiKey ? providerText.hideApiKey : providerText.showApiKey}
                    title={showProviderApiKey ? providerText.hideApiKey : providerText.showApiKey}
                  >
                    {showProviderApiKey ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-3-11-7 1.057-2.113 2.607-3.78 4.4-4.96M9.9 4.24A9.75 9.75 0 0112 4c5 0 9 3 11 7a11.18 11.18 0 01-4.25 4.79M15 12a3 3 0 00-4.08-2.8M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.27 2.943 9.542 7-1.272 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {providerConfigError && <p className="text-xs text-red-500">{providerConfigError}</p>}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeProviderConfigEditor}
                disabled={savingProviderConfig}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {providerText.cancel}
              </button>
              <button
                type="button"
                onClick={saveProviderConfig}
                disabled={savingProviderConfig}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingProviderConfig ? (isEn ? 'Saving...' : '保存中...') : providerText.save}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <div className="relative mt-1">
                    <input
                      type={showCompatibleApiKey ? 'text' : 'password'}
                      value={editingCompatible.apiKey}
                      onChange={(e) => setEditingCompatible((prev) => (prev ? { ...prev, apiKey: e.target.value } : prev))}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCompatibleApiKey((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      aria-label={showCompatibleApiKey ? providerText.hideApiKey : providerText.showApiKey}
                      title={showCompatibleApiKey ? providerText.hideApiKey : providerText.showApiKey}
                    >
                      {showCompatibleApiKey ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-3-11-7 1.057-2.113 2.607-3.78 4.4-4.96M9.9 4.24A9.75 9.75 0 0112 4c5 0 9 3 11 7a11.18 11.18 0 01-4.25 4.79M15 12a3 3 0 00-4.08-2.8M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.27 2.943 9.542 7-1.272 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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
                disabled={savingCompatible}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {providerText.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  void saveCompatibleEditor();
                }}
                disabled={savingCompatible}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingCompatible ? (isEn ? 'Saving...' : '保存中...') : providerText.save}
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
                disabled={deletingCompatible}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {providerText.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmDeleteModel();
                }}
                disabled={deletingCompatible}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingCompatible ? (isEn ? 'Deleting...' : '删除中...') : providerText.confirmDeleteButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
