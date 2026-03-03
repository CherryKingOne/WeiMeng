'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { getLocaleFromPath, withLocale } from '@/constants';

export function useLocalePath() {
  const pathname = usePathname();

  const locale = useMemo(() => getLocaleFromPath(pathname), [pathname]);

  const withLocalePath = (targetPath: string) => withLocale(targetPath, locale);

  return {
    locale,
    withLocalePath,
  };
}
