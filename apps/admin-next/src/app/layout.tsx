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
      <body>{children}</body>
    </html>
  );
}
