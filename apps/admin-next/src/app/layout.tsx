import type { Metadata, Viewport } from 'next';
import './globals.css';
// Quill rich-text editor styles (used in product create/edit forms)
import 'react-quill-new/dist/quill.snow.css';

export const metadata: Metadata = {
  title: {
    template: '%s | JoyMini Admin',
    default: 'JoyMini Admin',
  },
  description: 'JoyMini internal admin dashboard — manage products, orders, users and more.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'JoyMini Admin',
    description: 'JoyMini Admin Dashboard',
    siteName: 'JoyMini Admin',
    locale: 'en_US',
    type: 'website',
  },
};

// Next.js 15: viewport 必须单独导出，不能放在 metadata 里
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 移动端浏览器顶栏颜色：亮色用白，暗色用 dark-900
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#11111b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          内联脚本：在 React hydrate 之前同步读 localStorage 中的 theme，
          立即设置 <html> class，避免白色闪屏（FOUC）。
          key: 与 useAppStore persist 的 name='app-store' 保持一致。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('app-store')||'{}');var t=(s.state&&s.state.theme)||'dark';document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
