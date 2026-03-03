import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeiMeng Agent",
  description: "AI Agent Platform",
  icons: {
    icon: "/logo/logo-Icon-light.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={locale}>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
