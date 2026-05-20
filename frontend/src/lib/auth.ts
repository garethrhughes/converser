'use client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function isAuthenticated(): boolean {
  return accessToken !== null;
}

export async function exchangeAuthCode(code: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { accessToken: string };
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      setAccessToken(null);
      return null;
    }

    const data = (await response.json()) as { accessToken: string };
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export function redirectToLogin(): void {
  window.location.href = `${API_BASE_URL}/auth/google`;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });
  } finally {
    setAccessToken(null);
    window.location.href = '/login';
  }
}
