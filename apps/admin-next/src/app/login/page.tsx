'use client';

import dynamic from 'next/dynamic';

const Login = dynamic(() => import('@/views/Login').then((m) => m.Login), {
  ssr: false,
});

export default function LoginPage() {
  return <Login />;
}
