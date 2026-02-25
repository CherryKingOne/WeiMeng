'use client';

import { useSettingsStore } from '@/stores';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { activeTab, setActiveTab, theme, setTheme, language, setLanguage } = useSettingsStore();

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: '通用', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'account', label: '账户', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'api', label: 'API', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { id: 'about', label: '关于', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-3xl shadow-2xl w-[700px] max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">设置</h2>
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
                  <label className="text-sm font-semibold text-gray-900">主题</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'light', label: '浅色', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
                      { id: 'dark', label: '深色', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
                      { id: 'auto', label: '跟随系统', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
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
                  <label className="text-sm font-semibold text-gray-900">语言</label>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black focus:bg-white outline-none text-sm text-gray-900 appearance-none cursor-pointer"
                    >
                      <option value="zh">简体中文</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
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
                  <p className="text-sm text-gray-500 mt-1">让设计更简单</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">版本</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">v1.0.0</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">构建</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">2025.02</p>
                  </div>
                </div>

                <p className="text-xs text-gray-400">© 2025 WeiMeng. All rights reserved.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/30">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
