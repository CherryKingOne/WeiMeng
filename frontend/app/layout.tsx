import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeiMeng Agent",
  description: "AI Agent Platform",
  icons: {
    icon: "/logo/logo-Icon-light.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
