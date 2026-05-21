'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAccessToken, refreshAccessToken, isAuthenticated } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/auth/callback', '/logout'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Skip auth check for public paths
    if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
      setChecking(false);
      return;
    }

    // If we already have an access token in memory, allow through
    if (isAuthenticated()) {
      setChecking(false);
      return;
    }

    // Try to refresh — if a valid refresh_token cookie exists, this will succeed
    refreshAccessToken().then((token) => {
      if (token) {
        setChecking(false);
      } else {
        router.replace('/login');
      }
    });
  }, [pathname, router]);

  if (checking && !PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
