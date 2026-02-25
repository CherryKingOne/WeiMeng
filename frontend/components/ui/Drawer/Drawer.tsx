'use client';

import { cn } from '@/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export function Drawer({ isOpen, onClose, title, children, width = '400px' }: DrawerProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed right-0 top-0 h-full bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.08)]',
          'transform transition-transform duration-300 z-50',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ width }}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">{children}</div>
      </div>
    </>
  );
}
