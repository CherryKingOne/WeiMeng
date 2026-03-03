'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { NavItem } from '@/config';
import { stripLocaleFromPath } from '@/constants';
import { useLocalePath } from '@/hooks/useLocalePath';

interface SidebarNavItemProps extends NavItem {
  isActive?: boolean;
}

export function SidebarNavItem({ href, icon, label, isActive }: SidebarNavItemProps) {
  const pathname = usePathname();
  const { withLocalePath } = useLocalePath();
  const activePath = stripLocaleFromPath(pathname);
  const active = isActive ?? activePath === href;

  return (
    <Link
      href={withLocalePath(href)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
        active
          ? 'bg-black text-white'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
