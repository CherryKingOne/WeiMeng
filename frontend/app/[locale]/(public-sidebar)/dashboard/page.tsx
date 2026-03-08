'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocalePath } from '@/hooks/useLocalePath';

export default function DashboardPage() {
  const router = useRouter();
  const { withLocalePath, locale } = useLocalePath();
  const isEn = locale === 'en';
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [modelName, setModelName] = useState('DeepThink R1');
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const text = {
    title: isEn ? 'WeiMeng makes creation simple' : 'WeiMeng 让创作更简单',
    subtitle: isEn ? 'Type your idea, AI turns it into endless possibilities' : '输入灵感，AI 为你创造无限可能',
    promptPlaceholder: isEn
      ? 'Describe what you want to create, or type @ to invoke an Agent...'
      : '描述你想要创建的内容，或者通过 @ 调用 Agent...',
    uploadFile: isEn ? 'Upload files' : '上传文件',
    webSearch: isEn ? 'Web search' : '联网搜索',
    agentOn: isEn ? 'Agent enabled' : 'Agent 已开启',
    agentOff: isEn ? 'Enable Agent' : '开启 Agent',
    continueCreation: isEn ? 'Continue Creating' : '继续创作',
    viewAll: isEn ? 'View all' : '查看全部',
    newProject: isEn ? 'New Project' : '新建项目',
    time2h: isEn ? '2 hours ago' : '2 小时前',
    timeYesterday: isEn ? 'Yesterday' : '昨天',
    time3d: isEn ? '3 days ago' : '3 天前',
  };

  const toggleAgent = () => {
    setIsAgentActive(!isAgentActive);
  };

  const toggleModel = () => {
    setModelName(prev => prev === 'DeepThink R1' ? 'GPT-4o' : 'DeepThink R1');
  };

  const toggleWebSearch = () => {
    setIsWebSearchActive(!isWebSearchActive);
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 300;
      
      if (scrollHeight > maxHeight) {
        textareaRef.current.style.height = `${maxHeight}px`;
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.height = `${scrollHeight}px`;
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  const handleNavigate = () => {
    router.push(withLocalePath('/weimeng/teams'));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNavigate();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="flex flex-col items-center justify-center pt-16 pb-16">
        <h1 className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight">{text.title}</h1>
        <p className="text-gray-500 mb-10 text-base">{text.subtitle}</p>

        <div className="w-full max-w-3xl relative group">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden focus-within:ring-2 focus-within:ring-black/5 focus-within:border-black/10 relative z-10">
            
            <div className="px-5 pt-5 pb-2">
              <textarea 
                ref={textareaRef}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={text.promptPlaceholder}
                className="w-full min-h-[140px] max-h-[300px] text-lg bg-transparent outline-none resize-none placeholder-gray-400 text-gray-900 leading-relaxed overflow-hidden scrollbar-hide"
              ></textarea>
            </div>

            <div className="px-4 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={toggleModel}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors border border-gray-200/50 mr-2 group/model"
                >
                  <div className="w-4 h-4 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <span>{modelName}</span>
                  <svg className="w-3 h-3 text-gray-400 group-hover/model:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1"></div>

                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative group/tooltip">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">{text.uploadFile}</span>
                </button>
                
                <button 
                  onClick={toggleWebSearch}
                  className={`p-2 rounded-lg transition-colors relative group/tooltip ${isWebSearchActive ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">{text.webSearch}</span>
                </button>

                <button 
                  onClick={toggleAgent}
                  className={`p-2 rounded-lg transition-colors relative group/tooltip ${isAgentActive ? 'bg-purple-50 text-purple-500' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {isAgentActive ? text.agentOn : text.agentOff}
                  </span>
                </button>
              </div>

              <button 
                onClick={handleNavigate}
                className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all scale-on-active shadow-md group/send"
              >
                <svg className="w-5 h-5 group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors scale-on-active">3D Icon</button>
            <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors scale-on-active">Avatar</button>
            <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors scale-on-active">Poster</button>
            <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors scale-on-active">Logo</button>
            <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors scale-on-active">Illustration</button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{text.continueCreation}</h2>
          <Link href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{text.viewAll}</Link>
        </div>
        
        <div className="grid grid-cols-4 gap-5">
          <Link href="#" className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-all scale-on-active">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/></svg>
            <span className="text-sm font-medium">{text.newProject}</span>
          </Link>
          
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden hover-lift cursor-pointer scale-on-active">
            <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100"></div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 text-sm truncate">品牌视觉设计</h3>
              <p className="text-xs text-gray-400 mt-1">{text.time2h}</p>
            </div>
          </div>
          
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden hover-lift cursor-pointer scale-on-active">
            <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-cyan-100"></div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 text-sm truncate">3D 产品展示</h3>
              <p className="text-xs text-gray-400 mt-1">{text.timeYesterday}</p>
            </div>
          </div>
          
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden hover-lift cursor-pointer scale-on-active">
            <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-orange-100"></div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 text-sm truncate">社交媒体海报</h3>
              <p className="text-xs text-gray-400 mt-1">{text.time3d}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
