import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GSYEN',
  description: 'GSYEN — 智能工作台',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="h-screen overflow-hidden bg-[#F9F8F6] text-[#1A1A1A] font-sans">
        {children}
      </body>
    </html>
  );
}
