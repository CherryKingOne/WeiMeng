'use client';

import { MAIN_NAV_ITEMS } from '@/config';
import { SidebarNavItem } from './SidebarNavItem';

export function SidebarNav() {
  return (
    <nav className="flex-1 px-4 space-y-1">
      {MAIN_NAV_ITEMS.map((section) => (
        <div key={section.title}>
          <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 mt-4">
            {section.title}
          </p>
          {section.items.map((item) => (
            <SidebarNavItem key={item.href} {...item} />
          ))}
        </div>
      ))}
    </nav>
  );
}
