'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Project {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const mockProjects: Record<string, Project> = {
  '1': {
    id: '1',
    name: '品牌视觉设计',
    messages: [
      { id: '1', role: 'user', content: '帮我设计一个现代感的品牌 Logo', timestamp: new Date('2024-01-15 10:00') },
      { id: '2', role: 'assistant', content: '好的，我来为您设计一个现代感的品牌 Logo。请问您希望 Logo 传达什么样的品牌理念？', timestamp: new Date('2024-01-15 10:01') },
      { id: '3', role: 'user', content: '希望传达创新和科技感', timestamp: new Date('2024-01-15 10:02') },
      { id: '4', role: 'assistant', content: '我理解了，我会设计一个融合创新与科技元素的 Logo。让我为您生成几个方案...', timestamp: new Date('2024-01-15 10:03') },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15 10:03'),
  },
  '2': {
    id: '2',
    name: '3D 产品展示',
    messages: [
      { id: '1', role: 'user', content: '创建一个 3D 产品展示动画', timestamp: new Date('2024-01-14 14:00') },
      { id: '2', role: 'assistant', content: '好的，请告诉我产品的类型和您希望展示的特点？', timestamp: new Date('2024-01-14 14:01') },
    ],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14 14:01'),
  },
  '3': {
    id: '3',
    name: '社交媒体海报',
    messages: [],
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  '4': {
    id: '4',
    name: '营销素材',
    messages: [
      { id: '1', role: 'user', content: '帮我制作一组营销素材', timestamp: new Date('2024-01-10 09:00') },
      { id: '2', role: 'assistant', content: '好的，请问是什么类型的营销素材？需要多少张？', timestamp: new Date('2024-01-10 09:01') },
      { id: '3', role: 'user', content: '需要 5 张社交媒体海报，主题是春节促销', timestamp: new Date('2024-01-10 09:02') },
      { id: '4', role: 'assistant', content: '明白了，我会为您设计 5 张春节促销主题的社交媒体海报。请稍等...', timestamp: new Date('2024-01-10 09:03') },
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10 09:03'),
  },
};

export default function TeamsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const isNew = searchParams.get('new');

  const [activeTool, setActiveTool] = useState('storyboard');
  const [projectTitle, setProjectTitle] = useState('团队工作区');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [rightPanelWidth, setRightPanelWidth] = useState(600);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetWidthRef = useRef(600);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MIN_RIGHT_WIDTH = 411;
  const MAX_RIGHT_WIDTH = 600;

  useEffect(() => {
    if (projectId && mockProjects[projectId]) {
      const project = mockProjects[projectId];
      setProjectTitle(project.name);
      setMessages(project.messages);
    } else if (isNew === 'true') {
      setProjectTitle('新项目');
      setMessages([]);
    }
  }, [projectId, isNew]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const tools = [
    { id: 'storyboard', label: '故事板', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
      </svg>
    )},
    { id: 'timeline', label: '时间线', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    )},
    { id: 'assets', label: '素材库', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
      </svg>
    )},
  ];

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '我收到了您的消息，正在处理中...',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;
    
    const clampedWidth = Math.max(MIN_RIGHT_WIDTH, Math.min(MAX_RIGHT_WIDTH, newWidth));
    targetWidthRef.current = clampedWidth;
    
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setRightPanelWidth(targetWidthRef.current);
        rafRef.current = null;
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 tracking-tight">WeiMeng</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Teams</span>
          </div>
          
          <div className="h-4 w-px bg-gray-200 mx-2"></div>
          
          <input 
            type="text" 
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="bg-transparent border border-transparent hover:border-gray-200 hover:bg-gray-50 focus:bg-white focus:border-gray-300 text-sm text-gray-500 font-medium focus:text-gray-900 px-3 py-1 rounded-lg transition-all outline-none w-40 cursor-text placeholder:text-gray-400 truncate"
            placeholder="输入标题..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </button>
          <button className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </button>
          <button className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
          
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-100">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-xs font-medium text-gray-900">500</span>
            </div>
            <div className="w-px h-4 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400"></div>
              <span className="text-xs font-medium text-gray-700">子君</span>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white font-medium text-sm hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            导出
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden p-4 gap-0">
        {/* Workspace Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative border border-gray-100 mr-2">
          {/* Tab Bar */}
          <div className="h-11 border-b border-gray-100 flex items-center px-0 bg-gray-50/50 shrink-0">
            <button className="h-full w-14 flex items-center justify-center border-r border-gray-100 hover:bg-gray-100 transition-colors shrink-0">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              </div>
            </button>
            <button className="h-full px-4 flex items-center gap-2 border-r border-gray-100 bg-white text-gray-900 relative">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
              </svg>
              <span className="text-xs font-medium">故事板</span>
              <div className="absolute top-0 left-0 w-full h-0.5 bg-black"></div>
            </button>
            <div className="flex-1"></div>
          </div>

          {/* Workspace Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar (Tools) */}
            <aside className="w-14 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-4 shrink-0 z-20">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex flex-col items-center gap-1.5 group cursor-pointer ${
                    activeTool === tool.id ? '' : 'opacity-60 hover:opacity-100'
                  } transition-opacity`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    activeTool === tool.id
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'text-gray-400 group-hover:bg-gray-100'
                  }`}>
                    {tool.icon}
                  </div>
                  <span className={`text-[10px] font-medium ${
                    activeTool === tool.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>{tool.label}</span>
                </div>
              ))}
            </aside>

            {/* Canvas */}
            <main className="flex-1 bg-white relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-dot-pattern"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-500/5 via-pink-500/5 to-orange-500/5 rounded-full blur-[100px] pointer-events-none opacity-50"></div>

              {/* Empty State */}
              <div className="flex flex-col items-center justify-center text-center z-10">
                <div className="relative mb-8 group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
                  
                  <div className="relative w-24 h-24 bg-white border border-gray-200 rounded-3xl flex items-center justify-center shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
                    </svg>
                    <div className="absolute -bottom-3 -right-6 -rotate-12">
                      <span className="bg-gradient-to-r from-amber-400 via-red-500 to-pink-500 bg-clip-text text-transparent text-4xl font-serif italic opacity-90 select-none drop-shadow-lg">Creator</span>
                    </div>
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">开始！</h1>
                <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                  请在右侧聊天框中输入您的创作需求，<br/>开始创作吧！
                </p>
              </div>
            </main>
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-2 -ml-1 -mr-1 cursor-col-resize flex-shrink-0 group relative z-10 ${
            isDragging ? '' : ''
          }`}
        >
          <div className={`absolute inset-y-0 left-0.5 w-0.5 rounded-full transition-colors ${
            isDragging ? 'bg-gray-400' : 'bg-transparent group-hover:bg-gray-300'
          }`} />
        </div>

        {/* AI Assistant Panel */}
        <aside 
          style={{ width: `${rightPanelWidth}px` }}
          className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col shrink-0 border border-gray-100 ml-2"
        >
          {/* Header */}
          <header className="h-11 border-b border-gray-100 flex items-center px-4 gap-2 shrink-0 bg-gray-50/50">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
            <span className="text-xs font-semibold text-gray-900 tracking-wide">AI 助手</span>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-xs font-medium tracking-wide">暂无消息</div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-black text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 pt-2 shrink-0 border-t border-gray-100">
            {/* Quick Tags */}
            <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shrink-0 group">
                <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                </svg>
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700">模型</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shrink-0 group">
                <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700">技能</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shrink-0 group">
                <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700">元素</span>
              </button>
              <button className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500 hover:text-gray-700 shrink-0 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>

            {/* Input Box */}
            <div className="relative group">
              <textarea 
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="请输入你的消息..." 
                className="w-full min-h-[96px] bg-gray-50 text-gray-900 text-xs leading-relaxed placeholder:text-gray-400 p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-300 focus:bg-white resize-none transition-all"
              ></textarea>
              
              {/* Send Button */}
              <button 
                onClick={handleSend}
                className="absolute right-3 bottom-3 w-8 h-8 rounded-xl bg-black hover:bg-gray-800 flex items-center justify-center transition-colors shadow-lg"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
