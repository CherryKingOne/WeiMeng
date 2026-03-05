'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ROUTES } from '@/constants';
import { WorkbenchModeTabs } from '@/components/features/workbench/WorkbenchModeTabs';
import { useLocalePath } from '@/hooks/useLocalePath';

const RESULT_BACKGROUNDS = [
  'from-gray-200 to-gray-300',
  'from-gray-100 to-gray-200',
  'from-zinc-200 to-gray-300',
  'from-slate-200 to-gray-300',
];

const ASPECT_OPTIONS = ['1:1', '16:9', '9:16', '4:3'] as const;
const QUALITY_OPTIONS = [1, 2, 3] as const;
const QUANTITY_OPTIONS = [1, 2, 3, 4] as const;

type QualityValue = (typeof QUALITY_OPTIONS)[number];
type QuantityValue = (typeof QUANTITY_OPTIONS)[number];

export default function Image2ImagePage() {
  const { locale, withLocalePath } = useLocalePath();
  const isEn = locale === 'en';
  const timerRef = useRef<number | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [aspect, setAspect] = useState<(typeof ASPECT_OPTIONS)[number]>('1:1');
  const [quality, setQuality] = useState<QualityValue>(1);
  const [quantity, setQuantity] = useState<QuantityValue>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);

  const text = {
    home: isEn ? 'Home' : '首页',
    workspace: isEn ? 'Workspace' : '工作台',
    title: isEn ? 'Image to Image' : '图生图',
    switchToImage: isEn ? 'Switch to AI Image' : '切换至AI图片',
    apiPlatform: isEn ? 'API Platform' : 'API开放平台',
    firstDiscount: isEn ? 'First Purchase Offer' : '首购优惠',
    points: isEn ? 'Points' : '积分',
    mode: isEn ? 'Image to Image' : '图生图',
    reference: isEn ? 'Reference Image' : '参考图',
    required: isEn ? 'Required' : '必填',
    uploadHint: isEn ? 'Click or drag to upload image' : '点击或拖拽上传图片',
    uploadType: isEn ? 'Supports JPG, PNG, WebP' : '支持 JPG、PNG、WebP',
    editPlaceholder: isEn
      ? 'Describe changes or enhancements for the image'
      : '描述你想要对图片进行的修改或增强',
    tutorials: isEn ? 'Tutorials' : '使用教程',
    examples: isEn ? 'Examples' : '试用样例',
    model: isEn ? 'Model' : '模型',
    ratio: isEn ? 'Aspect Ratio' : '比例',
    style: isEn ? 'Style' : '风格',
    quality: isEn ? 'Quality' : '画质',
    quantity: isEn ? 'Quantity' : '数量',
    generate: isEn ? 'Create' : '创作',
    generating: isEn ? 'Generating...' : '生成中...',
    generatingEta: isEn ? 'Estimated 30-60 seconds' : '预计需要 30-60 秒',
    status: {
      idle: isEn ? 'Ready' : '待创作',
      inProgress: isEn ? 'In Progress' : '进行中',
      done: isEn ? 'Completed' : '已完成',
    },
    empty: isEn ? 'Start creating your first artwork.' : '开始创作您的第一个作品吧！',
    resultImage: (index: number) => (isEn ? `Image ${index}` : `图片 ${index}`),
    modelOptions: ['Stable Diffusion XL', 'Midjourney', 'DALL-E 3'],
    styleOptions: isEn
      ? ['Realistic', 'Anime', 'Illustration', '3D Render', 'Oil Painting']
      : ['写实', '动漫', '插画', '3D渲染', '油画'],
  };

  useEffect(() => () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
  }, []);

  const canGenerate = Boolean(referenceImage) && !isGenerating;

  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };

  const handleUploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result;
      if (typeof result === 'string') {
        setReferenceImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = '';
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setResultCount(0);

    timerRef.current = window.setTimeout(() => {
      setIsGenerating(false);
      setResultCount(quantity);
    }, 2000);
  };

  const statusText = isGenerating
    ? text.status.inProgress
    : resultCount > 0
      ? text.status.done
      : text.status.idle;

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <header className="h-14 border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="h-full px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={withLocalePath(ROUTES.DASHBOARD)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              {text.home}
            </Link>

            <div className="h-5 w-px bg-gray-200" />

            <div className="flex items-center min-w-0 px-1">
              <span className="text-sm font-medium text-gray-900">{text.title}</span>
              <span className="ml-2 text-xs text-gray-400 hidden md:block">{text.workspace}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm text-gray-600">
              {text.apiPlatform}
            </button>
            <button className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-600 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              {text.firstDiscount}
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-sm">
              <span className="text-gray-700 font-medium">25</span>
              <span className="text-gray-500">{text.points}</span>
            </div>
            <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
              U
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
        <aside className="w-full lg:w-[420px] border-r border-gray-100 bg-gray-50/50 overflow-y-auto">
          <div className="p-4 space-y-4">
            <WorkbenchModeTabs
              activeMode="image2image"
              isEn={isEn}
              withLocalePath={withLocalePath}
            />

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">{text.reference}</span>
                <span className="text-xs text-gray-400">{text.required}</span>
              </div>

              {!referenceImage && (
                <button
                  onClick={handleUploadClick}
                  className="w-full h-40 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <svg className="w-10 h-10 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 group-hover:text-gray-700">{text.uploadHint}</p>
                    <p className="text-xs text-gray-400 mt-1">{text.uploadType}</p>
                  </div>
                </button>
              )}

              {referenceImage && (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 mt-1">
                  <Image
                    src={referenceImage}
                    alt={text.reference}
                    fill
                    unoptimized
                    className="w-full h-full object-contain bg-gray-100"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-white shadow-sm transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                className="hidden"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={text.editPlaceholder}
                className="w-full h-28 bg-transparent border-none resize-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4 px-1">
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {text.tutorials}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                {text.examples}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{text.model}</span>
                <select
                  value={selectedModelIndex}
                  onChange={(event) => setSelectedModelIndex(Number(event.target.value))}
                  className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {text.modelOptions.map((option, index) => (
                    <option key={option} value={index}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{text.ratio}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {ASPECT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setAspect(option)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                        aspect === option
                          ? 'bg-black text-white border-black'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{text.style}</span>
                <select
                  value={selectedStyleIndex}
                  onChange={(event) => setSelectedStyleIndex(Number(event.target.value))}
                  className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {text.styleOptions.map((option, index) => (
                    <option key={option} value={index}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{text.quality}</span>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {QUALITY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setQuality(option)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        quality === option
                          ? 'bg-black text-white'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {option === 1 ? 'SD' : option === 2 ? 'HD' : '4K'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{text.quantity}</span>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {QUANTITY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setQuantity(option)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        quantity === option
                          ? 'bg-black text-white'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${
                canGenerate
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? text.generating : text.generate}
            </button>
          </div>
        </aside>

        <main className="flex-1 bg-white flex flex-col min-h-0">
          <div className="h-12 border-b border-gray-100 flex items-center px-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{statusText}</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
            {!isGenerating && resultCount === 0 && (
              <div className="text-center">
                <div className="mb-6 text-gray-300">
                  <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="40" y="25" width="100" height="90" rx="4" stroke="#e5e7eb" strokeWidth="2" fill="none" />
                    <rect x="50" y="35" width="80" height="55" rx="2" fill="#f3f4f6" />
                    <path d="M50 90 L75 65 L90 80 L110 55 L130 90 Z" stroke="#d1d5db" strokeWidth="2" fill="none" />
                    <circle cx="110" cy="50" r="8" stroke="#d1d5db" strokeWidth="2" fill="none" />
                    <rect x="60" y="100" width="25" height="20" rx="2" stroke="#e5e7eb" strokeWidth="1.5" fill="none" />
                    <circle cx="72" cy="110" r="4" stroke="#e5e7eb" strokeWidth="1.5" />
                    <circle cx="25" cy="35" r="2" fill="#e5e7eb" />
                    <circle cx="155" cy="30" r="2" fill="#e5e7eb" />
                    <circle cx="150" cy="100" r="2" fill="#e5e7eb" />
                    <circle cx="30" cy="95" r="2" fill="#e5e7eb" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">{text.empty}</p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center">
                <div className="relative w-64 h-64 mb-6 rounded-2xl overflow-hidden bg-gray-100 animate-pulse">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex gap-2 justify-center mb-3">
                        <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce [animation-delay:120ms]" />
                        <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce [animation-delay:240ms]" />
                      </div>
                      <p className="text-gray-500 text-sm">{text.generating}</p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">{text.generatingEta}</p>
              </div>
            )}

            {!isGenerating && resultCount > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
                {Array.from({ length: resultCount }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl overflow-hidden bg-white border border-gray-200 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
                  >
                    <div
                      className={`aspect-square relative overflow-hidden bg-gradient-to-br ${RESULT_BACKGROUNDS[index % RESULT_BACKGROUNDS.length]}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                        <button className="p-2 rounded-xl bg-white/90 hover:bg-white transition-colors shadow-sm">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button className="p-2 rounded-xl bg-white/90 hover:bg-white transition-colors shadow-sm">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-500">{text.resultImage(index + 1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
