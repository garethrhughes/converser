'use client';

import { redirectToLogin } from '@/lib/auth';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Converser</h1>
      <p className="text-gray-600">Sign in to continue</p>
      <button
        onClick={redirectToLogin}
        className="rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-hover"
      >
        Sign in with Google
      </button>
    </div>
  );
}
