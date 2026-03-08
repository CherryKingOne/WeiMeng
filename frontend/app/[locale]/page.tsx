import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/constants';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalizedHomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  redirect(`/${safeLocale}/auth/login`);
}
