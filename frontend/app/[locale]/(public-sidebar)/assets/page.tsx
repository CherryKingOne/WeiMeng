'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Asset, AssetType } from '@/types';
import { AssetGrid } from '@/components/features';
import { Drawer, Modal } from '@/components/ui';
import { useLocalePath } from '@/hooks/useLocalePath';

export default function AssetsPage() {
  const { locale } = useLocalePath();
  const isEn = locale === 'en';
  const [activeFilter, setActiveFilter] = useState<AssetType | 'all'>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState('');
  const [editingParam, setEditingParam] = useState<keyof Asset['params'] | null>(null);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const [paramDrafts, setParamDrafts] = useState({
    model: '',
    seed: '',
    steps: '',
    cfgScale: '',
  });

  const text = {
    title: isEn ? 'Asset Library' : '资产库',
    searchPlaceholder: isEn ? 'Search assets...' : '搜索资产...',
    uploadAsset: isEn ? 'Upload Assets' : '上传资产',
    assetDetail: isEn ? 'Asset Detail' : '资产详情',
    creator: isEn ? 'Creator' : '创作者',
    date: isEn ? 'Date' : '日期',
    type: isEn ? 'Type' : '类型',
    prompt: isEn ? 'Prompt' : '提示词',
    params: isEn ? 'Parameters' : '参数',
    model: isEn ? 'Model' : '模型',
    seed: isEn ? 'Seed' : '种子',
    steps: isEn ? 'Steps' : '步数',
    cfgScale: isEn ? 'CFG Scale' : 'CFG 强度',
    useAsset: isEn ? 'Use This Asset' : '使用此资产',
    save: isEn ? 'Save' : '保存',
    copyParams: isEn ? 'Copy Params' : '复制参数',
    copied: isEn ? 'Copied' : '已复制',
    saveChanges: isEn ? 'Save Changes' : '保存修改',
    saveConfirmTitle: isEn ? 'Confirm Save' : '确认保存',
    saveConfirmDesc: isEn
      ? 'Save edits to this asset now?'
      : '是否确认保存当前资产修改？',
    cancel: isEn ? 'Cancel' : '取消',
    empty: isEn ? 'No assets in this filter' : '当前筛选下暂无资产',
    filters: {
      all: isEn ? 'All' : '全部',
      image: isEn ? 'Images' : '图片',
      video: isEn ? 'Video' : '视频',
      favorite: isEn ? 'Favorites' : '收藏',
    },
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  const filters = [
    { id: 'all', label: text.filters.all },
    { id: 'image', label: text.filters.image },
    { id: '3d', label: '3D' },
    { id: 'video', label: text.filters.video },
    { id: 'favorite', label: text.filters.favorite },
  ];

  const [assets, setAssets] = useState<Asset[]>(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: String(i + 1),
        // User-generated content should not be translated by locale switch.
        title: `Asset ${i + 1}`,
        creator: 'Creator',
        type: (['image', '3d', 'video'] as AssetType[])[i % 3],
        date: `2026-03-${String((i % 9) + 1).padStart(2, '0')}`,
        prompt: `Stylized concept art asset #${i + 1}`,
        imageGradient: `linear-gradient(135deg, ${
          ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#a5f3fc', '#c7d2fe', '#f5d0fe'][i % 7]
        }, ${
          ['#fca5a5', '#fdba74', '#facc15', '#86efac', '#67e8f9', '#a5b4fc', '#e879f9'][i % 7]
        })`,
        params: {
          model: 'flux-dev',
          seed: String(100000 + i),
          steps: '28',
          cfgScale: '7.0',
        },
        isFavorite: i % 4 === 0,
      }))
  );

  const filteredAssets = useMemo(() => {
    if (activeFilter === 'all') return assets;
    if (activeFilter === 'favorite') return assets.filter((asset) => asset.isFavorite);
    return assets.filter((asset) => asset.type === activeFilter);
  }, [activeFilter, assets]);

  const selectedAsset = useMemo(
    () => (selectedAssetId ? assets.find((asset) => asset.id === selectedAssetId) ?? null : null),
    [assets, selectedAssetId]
  );

  useEffect(() => {
    if (selectedAssetId && !selectedAsset) {
      setSelectedAssetId(null);
    }
  }, [selectedAsset, selectedAssetId]);

  useEffect(() => {
    setCopied(false);
  }, [locale, selectedAssetId]);

  useEffect(() => {
    if (selectedAsset) {
      setTitleDraft(selectedAsset.title);
      setPromptDraft(selectedAsset.prompt);
      setParamDrafts({
        model: selectedAsset.params.model,
        seed: selectedAsset.params.seed,
        steps: selectedAsset.params.steps,
        cfgScale: selectedAsset.params.cfgScale,
      });
    } else {
      setTitleDraft('');
      setPromptDraft('');
      setParamDrafts({
        model: '',
        seed: '',
        steps: '',
        cfgScale: '',
      });
    }
    setIsEditingTitle(false);
    setIsEditingPrompt(false);
    setEditingParam(null);
    setIsConfirmSaveOpen(false);
  }, [selectedAssetId, selectedAsset]);

  const hasPendingChanges = useMemo(() => {
    if (!selectedAsset) return false;
    return (
      titleDraft.trim() !== selectedAsset.title ||
      promptDraft.trim() !== selectedAsset.prompt ||
      paramDrafts.model.trim() !== selectedAsset.params.model ||
      paramDrafts.seed.trim() !== selectedAsset.params.seed ||
      paramDrafts.steps.trim() !== selectedAsset.params.steps ||
      paramDrafts.cfgScale.trim() !== selectedAsset.params.cfgScale
    );
  }, [selectedAsset, titleDraft, promptDraft, paramDrafts]);

  const applyDraftChanges = () => {
    if (!selectedAsset) return;

    const nextTitle = titleDraft.trim() || selectedAsset.title;
    const nextPrompt = promptDraft.trim() || selectedAsset.prompt;
    const nextParams = {
      model: paramDrafts.model.trim() || selectedAsset.params.model,
      seed: paramDrafts.seed.trim() || selectedAsset.params.seed,
      steps: paramDrafts.steps.trim() || selectedAsset.params.steps,
      cfgScale: paramDrafts.cfgScale.trim() || selectedAsset.params.cfgScale,
    };

    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === selectedAsset.id
          ? {
              ...asset,
              title: nextTitle,
              prompt: nextPrompt,
              params: nextParams,
            }
          : asset
      )
    );
    setIsEditingTitle(false);
    setIsEditingPrompt(false);
    setEditingParam(null);
    setIsConfirmSaveOpen(false);
  };

  const handleCopyParams = async () => {
    if (!selectedAsset) return;

    try {
      await navigator.clipboard.writeText(
        `Model: ${selectedAsset.params.model}\nSeed: ${selectedAsset.params.seed}\nSteps: ${selectedAsset.params.steps}\nCFG Scale: ${selectedAsset.params.cfgScale}`
      );
      setCopied(true);
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 1200);
    } catch {
      setCopied(false);
    }
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
          <button className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            {text.uploadAsset}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as AssetType | 'all')}
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

      {filteredAssets.length > 0 ? (
        <AssetGrid assets={filteredAssets} onAssetClick={(asset) => setSelectedAssetId(asset.id)} />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">
          {text.empty}
        </div>
      )}

      <Drawer
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAssetId(null)}
        title={text.assetDetail}
        width="min(460px, 100vw)"
        hideCloseButton
        headerAction={
          <button
            type="button"
            onClick={() => setIsConfirmSaveOpen(true)}
            disabled={!hasPendingChanges}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              hasPendingChanges
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {text.save}
          </button>
        }
      >
        {selectedAsset && (
          <div className="space-y-6">
            <div
              className="aspect-square flex items-center justify-center rounded-2xl"
              style={{ background: selectedAsset.imageGradient }}
            >
              {selectedAsset.imageUrl ? (
                <img
                  src={selectedAsset.imageUrl}
                  alt={selectedAsset.title}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <svg className="w-14 h-14 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>

            <div>
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      setIsEditingTitle(false);
                    }
                    if (event.key === 'Escape') {
                      setTitleDraft(selectedAsset.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="w-full mb-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-900 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(selectedAsset.title);
                    setIsEditingTitle(true);
                  }}
                  title={isEn ? 'Click to edit asset name' : '点击编辑资产名称'}
                  className="mb-1 text-left font-medium text-gray-900 hover:text-black transition-colors"
                >
                  {selectedAsset.title}
                </button>
              )}
              <p className="text-sm text-gray-500">
                {isEn ? `By @${selectedAsset.creator} · ${selectedAsset.date}` : `由 @${selectedAsset.creator} 创建 · ${selectedAsset.date}`}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{text.prompt}</p>
              {isEditingPrompt ? (
                <textarea
                  autoFocus
                  value={promptDraft}
                  onChange={(event) => setPromptDraft(event.target.value)}
                  onBlur={() => setIsEditingPrompt(false)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setPromptDraft(selectedAsset.prompt);
                      setIsEditingPrompt(false);
                    }
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      setIsEditingPrompt(false);
                    }
                  }}
                  className="w-full min-h-[96px] resize-y bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed outline-none focus:ring-2 focus:ring-gray-200"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPromptDraft(selectedAsset.prompt);
                    setIsEditingPrompt(true);
                  }}
                  title={isEn ? 'Click to edit prompt' : '点击编辑提示词'}
                  className="w-full text-left bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed hover:bg-gray-100 transition-colors"
                >
                  {selectedAsset.prompt}
                </button>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{text.params}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">{text.model}</p>
                  {editingParam === 'model' ? (
                    <input
                      autoFocus
                      value={paramDrafts.model}
                      onChange={(event) =>
                        setParamDrafts((prev) => ({ ...prev, model: event.target.value }))
                      }
                      onBlur={() => setEditingParam(null)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          setEditingParam(null);
                        }
                        if (event.key === 'Escape') {
                          setParamDrafts((prev) => ({ ...prev, model: selectedAsset.params.model }));
                          setEditingParam(null);
                        }
                      }}
                      className="mt-1 w-full bg-white rounded-md border border-gray-200 px-2 py-1 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setParamDrafts((prev) => ({ ...prev, model: selectedAsset.params.model }));
                        setEditingParam('model');
                      }}
                      className="mt-1 text-sm font-medium text-gray-900 hover:text-black transition-colors"
                    >
                      {selectedAsset.params.model}
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">{text.seed}</p>
                  {editingParam === 'seed' ? (
                    <input
                      autoFocus
                      value={paramDrafts.seed}
                      onChange={(event) =>
                        setParamDrafts((prev) => ({ ...prev, seed: event.target.value }))
                      }
                      onBlur={() => setEditingParam(null)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          setEditingParam(null);
                        }
                        if (event.key === 'Escape') {
                          setParamDrafts((prev) => ({ ...prev, seed: selectedAsset.params.seed }));
                          setEditingParam(null);
                        }
                      }}
                      className="mt-1 w-full bg-white rounded-md border border-gray-200 px-2 py-1 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setParamDrafts((prev) => ({ ...prev, seed: selectedAsset.params.seed }));
                        setEditingParam('seed');
                      }}
                      className="mt-1 text-sm font-medium text-gray-900 hover:text-black transition-colors"
                    >
                      {selectedAsset.params.seed}
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">{text.steps}</p>
                  {editingParam === 'steps' ? (
                    <input
                      autoFocus
                      value={paramDrafts.steps}
                      onChange={(event) =>
                        setParamDrafts((prev) => ({ ...prev, steps: event.target.value }))
                      }
                      onBlur={() => setEditingParam(null)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          setEditingParam(null);
                        }
                        if (event.key === 'Escape') {
                          setParamDrafts((prev) => ({ ...prev, steps: selectedAsset.params.steps }));
                          setEditingParam(null);
                        }
                      }}
                      className="mt-1 w-full bg-white rounded-md border border-gray-200 px-2 py-1 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setParamDrafts((prev) => ({ ...prev, steps: selectedAsset.params.steps }));
                        setEditingParam('steps');
                      }}
                      className="mt-1 text-sm font-medium text-gray-900 hover:text-black transition-colors"
                    >
                      {selectedAsset.params.steps}
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">{text.cfgScale}</p>
                  {editingParam === 'cfgScale' ? (
                    <input
                      autoFocus
                      value={paramDrafts.cfgScale}
                      onChange={(event) =>
                        setParamDrafts((prev) => ({ ...prev, cfgScale: event.target.value }))
                      }
                      onBlur={() => setEditingParam(null)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          setEditingParam(null);
                        }
                        if (event.key === 'Escape') {
                          setParamDrafts((prev) => ({ ...prev, cfgScale: selectedAsset.params.cfgScale }));
                          setEditingParam(null);
                        }
                      }}
                      className="mt-1 w-full bg-white rounded-md border border-gray-200 px-2 py-1 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setParamDrafts((prev) => ({ ...prev, cfgScale: selectedAsset.params.cfgScale }));
                        setEditingParam('cfgScale');
                      }}
                      className="mt-1 text-sm font-medium text-gray-900 hover:text-black transition-colors"
                    >
                      {selectedAsset.params.cfgScale}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                onClick={() => setSelectedAssetId(null)}
              >
                {text.useAsset}
              </button>
              <button
                className="flex-1 py-3 bg-gray-100 text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                onClick={handleCopyParams}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {copied ? text.copied : text.copyParams}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={isConfirmSaveOpen}
        onClose={() => setIsConfirmSaveOpen(false)}
        title={text.saveConfirmTitle}
        width="420px"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600">{text.saveConfirmDesc}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmSaveOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              {text.cancel}
            </button>
            <button
              type="button"
              onClick={applyDraftChanges}
              className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {text.saveChanges}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
