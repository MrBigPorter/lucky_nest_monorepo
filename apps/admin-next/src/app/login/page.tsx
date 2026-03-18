import type { Metadata } from 'next';
import { Login } from '@/views/Login';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to JoyMini Admin to manage your store.',
  alternates: { canonical: '/login' },
  openGraph: {
    title: 'Sign In | JoyMini Admin',
    description: 'Sign in to JoyMini Admin to manage your store.',
    url: '/login',
  },
};

export default function LoginPage() {
  return <Login />;
}
