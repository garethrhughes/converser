'use client';

import { useEffect } from 'react';
import { logout } from '@/lib/auth';

export default function LogoutPage() {
  useEffect(() => {
    logout();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Logging out...</p>
    </div>
  );
}
