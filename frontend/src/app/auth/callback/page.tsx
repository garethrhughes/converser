'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { exchangeAuthCode } from '@/lib/auth';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      exchangeAuthCode(code).then((token) => {
        if (token) {
          router.replace('/');
        } else {
          router.replace('/login');
        }
      });
    } else {
      router.replace('/login');
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Authenticating...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
