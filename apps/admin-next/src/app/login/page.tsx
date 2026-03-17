import type { Metadata } from 'next';
import { Login } from '@/views/Login';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
  return <Login />;
}
