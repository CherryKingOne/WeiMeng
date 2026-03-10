'use client';

import { type ChangeEvent, useEffect, useRef, useState } from 'react';

const TEXT_MODEL_OPTIONS = ['gpt-4.1', 'gpt-4o', 'claude-3.5-sonnet'] as const;
type TextModelOption = (typeof TEXT_MODEL_OPTIONS)[number];

export type ScriptConfigPanelProps = {
  locale: 'zh' | 'en';
  initialLibraryName?: string;
  initialDescription?: string;
  initialTextModel?: TextModelOption;
  onSave?: (payload: {
    libraryName: string;
    description: string;
    textModel: TextModelOption;
  }) => void;
  className?: string;
};

export function ScriptConfigPanel({
  locale,
  initialLibraryName = '',
  initialDescription = '',
  initialTextModel = 'gpt-4.1',
  onSave,
  className = '',
}: ScriptConfigPanelProps) {
  const isEn = locale === 'en';
  const text = {
    title: isEn ? 'Settings' : '配置',
    subtitle: isEn
      ? 'Manage script library profile and default text model.'
      : '管理剧本库基础信息与默认文本模型。',
    libraryName: isEn ? 'Script Library Name' : '剧本库名称',
    avatar: isEn ? 'Avatar' : '头像',
    avatarEmpty: isEn ? 'No avatar set' : '未设置头像',
    uploadAvatar: isEn ? 'Upload Avatar' : '上传头像',
    description: isEn ? 'Description' : '描述',
    textModel: isEn ? 'Text Model' : '文本模型',
    reset: isEn ? 'Reset' : '重置',
    save: isEn ? 'Save Settings' : '保存配置',
  };

  const [libraryName, setLibraryName] = useState(initialLibraryName);
  const [description, setDescription] = useState(initialDescription);
  const [selectedTextModel, setSelectedTextModel] = useState<TextModelOption>(initialTextModel);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLibraryName(initialLibraryName);
  }, [initialLibraryName]);

  useEffect(() => {
    setDescription(initialDescription);
  }, [initialDescription]);

  useEffect(() => {
    setSelectedTextModel(initialTextModel);
  }, [initialTextModel]);

  useEffect(() => {
    if (!isModelMenuOpen) {
      return;
    }

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (!modelMenuRef.current?.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModelMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModelMenuOpen]);

  const handleReset = () => {
    setLibraryName(initialLibraryName);
    setDescription(initialDescription);
    setSelectedTextModel(initialTextModel);
    setIsModelMenuOpen(false);
  };

  const handleSave = () => {
    onSave?.({
      libraryName,
      description,
      textModel: selectedTextModel,
    });
  };

  return (
    <div className={`flex-1 overflow-y-auto bg-white px-8 py-6 ${className}`}>
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{text.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{text.subtitle}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">
              {text.libraryName}
              <span className="ml-0.5 text-red-500">*</span>
            </label>
            <input
              value={libraryName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setLibraryName(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">{text.avatar}</label>
            <div className="flex items-center gap-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3">
              <div className="text-sm text-gray-500">{text.avatarEmpty}</div>
              <button
                type="button"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                {text.uploadAvatar}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">{text.description}</label>
            <textarea
              value={description}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)}
              className="min-h-[100px] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">{text.textModel}</label>
            <div className="relative" ref={modelMenuRef}>
              <button
                id="textModelTrigger"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isModelMenuOpen}
                onClick={() => setIsModelMenuOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              >
                <span>{selectedTextModel}</span>
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isModelMenuOpen ? (
                <div
                  id="textModelMenu"
                  role="listbox"
                  className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white p-1 shadow-[0_8px_20px_rgba(17,24,39,0.08)]"
                >
                  {TEXT_MODEL_OPTIONS.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => {
                        setSelectedTextModel(model);
                        setIsModelMenuOpen(false);
                      }}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                        selectedTextModel === model
                          ? 'bg-gray-900 text-white hover:bg-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              {text.reset}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              {text.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScriptConfigPage() {
  return null;
}
