import type { Metadata } from 'next';
import './globals.css';
// Quill rich-text editor styles (used in product create/edit forms)
import 'react-quill-new/dist/quill.snow.css';

export const metadata: Metadata = {
  title: 'Lucky Admin',
  description: 'Lucky Nest Admin Dashboard',
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
