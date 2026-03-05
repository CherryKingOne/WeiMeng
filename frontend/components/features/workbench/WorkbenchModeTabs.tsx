'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants';

export type WorkbenchModeKey =
  | 'text2image'
  | 'image2image'
  | 'image2video'
  | 'text2video';

interface WorkbenchModeTabsProps {
  activeMode: WorkbenchModeKey;
  isEn: boolean;
  withLocalePath: (path: string) => string;
}

const WORKBENCH_MODES: Array<{
  key: WorkbenchModeKey;
  zhLabel: string;
  enLabel: string;
  route: string;
}> = [
  {
    key: 'text2image',
    zhLabel: '文生图',
    enLabel: 'Text to Image',
    route: ROUTES.TEXT2IMAGE,
  },
  {
    key: 'image2image',
    zhLabel: '图生图',
    enLabel: 'Image to Image',
    route: ROUTES.IMAGE2IMAGE,
  },
  {
    key: 'image2video',
    zhLabel: '图生视频',
    enLabel: 'Image to Video',
    route: ROUTES.IMAGE2VIDEO,
  },
  {
    key: 'text2video',
    zhLabel: '文生视频',
    enLabel: 'Text to Video',
    route: ROUTES.TEXT2VIDEO,
  },
];

export function WorkbenchModeTabs({
  activeMode,
  isEn,
  withLocalePath,
}: WorkbenchModeTabsProps) {
  return (
    <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-gray-100">
      {WORKBENCH_MODES.map((mode) => {
        const isActive = mode.key === activeMode;

        return (
          <Link
            key={mode.key}
            href={withLocalePath(mode.route)}
            aria-current={isActive ? 'page' : undefined}
            className={`py-2.5 rounded-lg text-sm font-medium transition-all text-center ${
              isActive
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isEn ? mode.enLabel : mode.zhLabel}
          </Link>
        );
      })}
    </div>
  );
}
