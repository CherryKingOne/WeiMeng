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
const DURATION_OPTIONS = [4, 8, 16] as const;
const QUANTITY_OPTIONS = [1, 2, 3, 4] as const;

type QuantityValue = (typeof QUANTITY_OPTIONS)[number];
type DurationValue = (typeof DURATION_OPTIONS)[number];

type UploadSlot = 'first' | 'last';

export default function Image2VideoPage() {
  const { locale, withLocalePath } = useLocalePath();
  const isEn = locale === 'en';

  const timerRef = useRef<number | null>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState('');
  const [firstFrameImage, setFirstFrameImage] = useState<string | null>(null);
  const [lastFrameImage, setLastFrameImage] = useState<string | null>(null);
  const [aspect, setAspect] = useState<(typeof ASPECT_OPTIONS)[number]>('1:1');
  const [duration, setDuration] = useState<DurationValue>(4);
  const [quantity, setQuantity] = useState<QuantityValue>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultCount, setResultCount] = useState(0);

  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [selectedResolutionIndex, setSelectedResolutionIndex] = useState(0);
  const [selectedFormatIndex, setSelectedFormatIndex] = useState(0);
  const [selectedModeIndex, setSelectedModeIndex] = useState(0);

  const text = {
    home: isEn ? 'Home' : '首页',
    workspace: isEn ? 'Workspace' : '工作台',
    title: isEn ? 'Image to Video' : '图生视频',
    switchToImage: isEn ? 'Switch to AI Image' : '切换至AI图片',
    apiPlatform: isEn ? 'API Platform' : 'API开放平台',
    firstDiscount: isEn ? 'First Purchase Offer' : '首购优惠',
    points: isEn ? 'Points' : '积分',

    mode: isEn ? 'Image to Video' : '图生视频',
    firstFrame: isEn ? 'First Frame' : '首帧',
    lastFrame: isEn ? 'Last Frame' : '尾帧',
    required: isEn ? 'Required' : '必填',
    optional: isEn ? 'Optional' : '可选',
    uploadHint: isEn ? 'Click or drag to upload image' : '点击或拖拽上传图片',
    uploadType: isEn ? 'Supports JPG, PNG, WebP' : '支持 JPG、PNG、WebP',
    promptPlaceholder: isEn
      ? 'Describe motion, camera movement, and visual style'
      : '描述你想要生成的视频内容',

    tutorials: isEn ? 'Tutorials' : '使用教程',
    examples: isEn ? 'Examples' : '试用样例',

    model: isEn ? 'Model' : '模型',
    resolutionAndCodec: isEn ? 'Resolution & Codec' : '清晰度 & 编码格式',
    ratio: isEn ? 'Aspect Ratio' : '比例',
    duration: isEn ? 'Duration' : '时长',
    generationMode: isEn ? 'Generation Mode' : '生成模式',
    quantity: isEn ? 'Quantity' : '数量',

    generate: isEn ? 'Create' : '创作',
    generating: isEn ? 'Generating...' : '生成中...',
    generatingEta: isEn ? 'Estimated 30-60 seconds' : '预计需要 30-60 秒',

    status: {
      idle: isEn ? 'Ready' : '待创作',
      inProgress: isEn ? 'In Progress' : '进行中',
      done: isEn ? 'Completed' : '已完成',
    },

    empty: isEn ? 'Start creating your first video.' : '开始创作您的第一个作品吧！',
    resultVideo: (index: number) => (isEn ? `Video ${index}` : `视频 ${index}`),
    seconds: (value: number) => (isEn ? `${value}s` : `${value}秒`),

    modelOptions: ['Vidu Q3', 'Vidu Q2'],
    resolutionOptions: ['1080p', '720p'],
    codecOptions: ['H265', 'H264'],
    modeOptions: isEn ? ['Cinematic', 'Creative'] : ['电影大片', '创意短片'],
  };

  useEffect(() => () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
  }, []);

  const canGenerate = Boolean(firstFrameImage) && !isGenerating;

  const handleUploadClick = (slot: UploadSlot) => {
    if (slot === 'first') {
      firstFrameInputRef.current?.click();
    } else {
      lastFrameInputRef.current?.click();
    }
  };

  const handleUploadImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    slot: UploadSlot
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result;
      if (typeof result !== 'string') return;

      if (slot === 'first') {
        setFirstFrameImage(result);
      } else {
        setLastFrameImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (slot: UploadSlot) => {
    if (slot === 'first') {
      setFirstFrameImage(null);
      if (firstFrameInputRef.current) {
        firstFrameInputRef.current.value = '';
      }
      return;
    }

    setLastFrameImage(null);
    if (lastFrameInputRef.current) {
      lastFrameInputRef.current.value = '';
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setResultCount(0);

    timerRef.current = window.setTimeout(() => {
      setIsGenerating(false);
      setResultCount(quantity);
    }, 2200);
  };

  const statusText = isGenerating
    ? text.status.inProgress
    : resultCount > 0
      ? text.status.done
      : text.status.idle;

  const renderFrameUploader = ({
    slot,
    title,
    requiredLabel,
    image,
  }: {
    slot: UploadSlot;
    title: string;
    requiredLabel: string;
    image: string | null;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="text-xs text-gray-400">{requiredLabel}</span>
      </div>

      {!image && (
        <button
          onClick={() => handleUploadClick(slot)}
          className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <svg
            className="w-6 h-6 text-gray-400 group-hover:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-xs text-gray-400">{title}</span>
        </button>
      )}

      {image && (
        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-gray-200">
          <Image
            src={image}
            alt={title}
            fill
            unoptimized
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => handleRemoveImage(slot)}
            className="absolute top-1 right-1 p-1 rounded-lg bg-white/90 shadow-sm hover:bg-white transition-colors"
          >
            <svg
              className="w-3 h-3 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <header className="h-14 border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="h-full px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={withLocalePath(ROUTES.DASHBOARD)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {text.home}
            </Link>

            <div className="h-5 w-px bg-gray-200" />

            <div className="flex items-center min-w-0 px-1">
              <span className="text-sm font-medium text-gray-900">{text.title}</span>
              <span className="ml-2 text-xs text-gray-400 hidden md:block">
                {text.workspace}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm text-gray-600">
              {text.apiPlatform}
            </button>
            <button className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-600 flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
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
              activeMode="image2video"
              isEn={isEn}
              withLocalePath={withLocalePath}
            />

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                {renderFrameUploader({
                  slot: 'first',
                  title: text.firstFrame,
                  requiredLabel: text.required,
                  image: firstFrameImage,
                })}
                {renderFrameUploader({
                  slot: 'last',
                  title: text.lastFrame,
                  requiredLabel: text.optional,
                  image: lastFrameImage,
                })}
              </div>

              <p className="text-xs text-gray-400 mt-3">{text.uploadType}</p>

              <input
                ref={firstFrameInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => handleUploadImage(event, 'first')}
                className="hidden"
              />
              <input
                ref={lastFrameInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => handleUploadImage(event, 'last')}
                className="hidden"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={text.promptPlaceholder}
                className="w-full h-28 bg-transparent border-none resize-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4 px-1">
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {text.tutorials}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                {text.examples}
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
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
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    {text.resolutionAndCodec}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedResolutionIndex}
                      onChange={(event) =>
                        setSelectedResolutionIndex(Number(event.target.value))
                      }
                      className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-sm text-gray-700 focus:outline-none"
                    >
                      {text.resolutionOptions.map((option, index) => (
                        <option key={option} value={index}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedFormatIndex}
                      onChange={(event) =>
                        setSelectedFormatIndex(Number(event.target.value))
                      }
                      className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-sm text-gray-700 focus:outline-none"
                    >
                      {text.codecOptions.map((option, index) => (
                        <option key={option} value={index}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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

              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{text.duration}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setDuration(option)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                        duration === option
                          ? 'bg-black text-white border-black'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {text.seconds(option)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{text.generationMode}</span>
                <select
                  value={selectedModeIndex}
                  onChange={(event) => setSelectedModeIndex(Number(event.target.value))}
                  className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {text.modeOptions.map((option, index) => (
                    <option key={option} value={index}>
                      {option}
                    </option>
                  ))}
                </select>
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span>{statusText}</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
            {!isGenerating && resultCount === 0 && (
              <div className="text-center">
                <div className="mb-6 text-gray-300">
                  <svg
                    width="180"
                    height="140"
                    viewBox="0 0 180 140"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="40"
                      y="25"
                      width="100"
                      height="90"
                      rx="4"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                      fill="none"
                    />
                    <rect x="50" y="35" width="80" height="55" rx="2" fill="#f3f4f6" />
                    <path
                      d="M50 90 L75 65 L90 80 L110 55 L130 90 Z"
                      stroke="#d1d5db"
                      strokeWidth="2"
                      fill="none"
                    />
                    <circle cx="110" cy="50" r="8" stroke="#d1d5db" strokeWidth="2" fill="none" />
                    <rect
                      x="60"
                      y="100"
                      width="25"
                      height="20"
                      rx="2"
                      stroke="#e5e7eb"
                      strokeWidth="1.5"
                      fill="none"
                    />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl w-full">
                {Array.from({ length: resultCount }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl overflow-hidden bg-white border border-gray-200 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
                  >
                    <div
                      className={`aspect-video relative overflow-hidden bg-gradient-to-br ${RESULT_BACKGROUNDS[index % RESULT_BACKGROUNDS.length]}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                          <svg
                            className="w-6 h-6 text-gray-700 ml-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6 4l10 6-10 6V4z" />
                          </svg>
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                        <button className="p-2 rounded-xl bg-white/90 hover:bg-white transition-colors shadow-sm">
                          <svg
                            className="w-4 h-4 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        <button className="p-2 rounded-xl bg-white/90 hover:bg-white transition-colors shadow-sm">
                          <svg
                            className="w-4 h-4 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <p className="text-xs text-gray-500">{text.resultVideo(index + 1)}</p>
                      <span className="text-xs text-gray-400">{text.seconds(duration)}</span>
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
