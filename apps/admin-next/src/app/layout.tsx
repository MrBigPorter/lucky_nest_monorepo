import type { Metadata } from 'next';
import './globals.css';

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
