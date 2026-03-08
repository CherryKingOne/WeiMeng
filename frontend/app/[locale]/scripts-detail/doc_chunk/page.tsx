'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useLocalePath } from '@/hooks/useLocalePath';

const qaItems = [
  {
    q: '金鸡独立的动作要领是什么？',
    a: '膝盖过腰，两手背起，闭眼坚持10秒。',
  },
  {
    q: '金鸡独立主要考察什么？',
    a: '主要看平衡能力、全身协调、脊柱状态和下盘力量。',
  },
  {
    q: '两手伸直放于耳后的动作要领是什么？',
    a: '两臂上举并贴近耳后，手臂保持伸直。',
  },
  {
    q: '抱腿平衡的动作要领是什么？',
    a: '勾脚尖，两腿伸直并抱腿，脚高度尽量过腰。',
  },
  {
    q: '前伏下压有什么作用？',
    a: '用于训练腰腿柔韧，反映僵硬程度，便于前后效果对比。',
  },
  {
    q: '接下来5天课程内容的意义是什么？',
    a: '课程按个人情况定制，帮助形成稳定、平和、可持续的训练节奏。',
  },
];

const initialSlices = [
  {
    id: 's1',
    text: 'Q: 金鸡独立的动作要领是什么？ A: 膝盖过腰，两手背起，闭眼坚持10秒。 Q: 金鸡独立主要考察什么？ A: 主要看平衡能力、认知反应、协调性与下盘力量。',
  },
  {
    id: 's2',
    text: 'Q: 两手伸直放于耳后的动作要领是什么？ A: 两臂举起并在耳后伸直。 Q: 两手伸直放于耳后主要看什么？ A: 主要看手臂是否伸直、肩颈是否打开。',
  },
  {
    id: 's3',
    text: 'Q: 抱腿平衡的动作要领是什么？ A: 勾脚尖，两腿伸直并抱腿，脚高度过腰。 Q: 抱腿平衡主要看什么？ A: 关注下盘稳定、腿部伸展和整体平衡能力。',
  },
  {
    id: 's4',
    text: 'Q: 前伏下压有什么作用？ A: 训练腰腿并评估僵硬程度。 Q: 课程训练目标是什么？ A: 提高身体状态与生活质量，形成长期可持续练习。',
  },
];

export default function DocChunkPage() {
  const router = useRouter();
  const { withLocalePath } = useLocalePath();
  const searchParams = useSearchParams();

  const fileName = searchParams.get('fileName')?.trim() || '1772419691_导学课动作.docx';
  const uploadedAt = searchParams.get('uploadedAt')?.trim() || '2026/02/03 10:48:11';
  const parser = searchParams.get('parser')?.trim() || 'general';

  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');
  const [keyword, setKeyword] = useState('');
  const [selectedSliceIds, setSelectedSliceIds] = useState<string[]>([]);
  const [enabledSliceIds, setEnabledSliceIds] = useState<string[]>(() => initialSlices.map((slice) => slice.id));
  const fallbackPath = withLocalePath('/scripts-detail/scripts-file');

  const filteredSlices = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return initialSlices;
    }
    return initialSlices.filter((slice) => slice.text.toLowerCase().includes(normalized));
  }, [keyword]);

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
              <span>返回上级</span>
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{fileName}</h1>
            <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
              <span>Size: 12 KB</span>
              <span>Uploaded Time: {uploadedAt}</span>
              <span>Parser: {parser}</span>
            </div>
          </header>

          <div className="mt-4 flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white px-6 py-5 text-[15px] leading-8 text-gray-700">
            {qaItems.map((item) => (
              <div key={item.q} className="mb-1">
                <p className="text-gray-900">Q: {item.q}</p>
                <p>A: {item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="w-[45%] min-w-[500px] bg-white flex flex-col">
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">切片结果</h2>
            <p className="text-sm text-gray-500">查看用于嵌入和召回的切片段落。</p>
          </div>

          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex rounded bg-gray-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  className={`px-3 py-1 text-xs rounded ${viewMode === 'full' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  全文
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  className={`px-3 py-1 text-xs rounded ${viewMode === 'compact' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  省略
                </button>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={handleToggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span>选择所有</span>
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
                  placeholder="搜索"
                  className="w-52 rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white"
                />
              </div>

              <button
                type="button"
                className="h-8 w-8 rounded border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-colors flex items-center justify-center"
                aria-label="切换布局"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>

              <button
                type="button"
                className="h-8 w-8 rounded border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-colors"
                aria-label="新增切片"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredSlices.map((slice) => {
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
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    aria-label={isEnabled ? '禁用切片' : '启用切片'}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              );
            })}
          </div>

          <footer className="px-6 py-3 flex items-center justify-end text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>总共 {filteredSlices.length} 条</span>
              <button type="button" disabled className="h-7 w-7 rounded border border-gray-200 text-gray-300 cursor-not-allowed">&lt;</button>
              <span className="px-2 text-gray-900">1</span>
              <button type="button" disabled className="h-7 w-7 rounded border border-gray-200 text-gray-300 cursor-not-allowed">&gt;</button>
              <span className="ml-2">50条/页</span>
              <select className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-600 focus:outline-none focus:border-gray-300">
                <option>10条/页</option>
                <option>20条/页</option>
                <option>50条/页</option>
                <option>100条/页</option>
              </select>
            </div>
          </footer>
        </aside>
      </div>
    </div>
  );
}
