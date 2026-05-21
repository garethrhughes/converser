'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';

// Google Picker API types — external SDK, no @types package available
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface GoogleDrivePickerProps {
  onSelect: (documentId: string) => void;
  onCancel?: () => void;
}

export function GoogleDrivePicker({ onSelect, onCancel }: GoogleDrivePickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gapiLoadedRef = useRef(false);
  const pickerApiLoadedRef = useRef(false);

  const loadGapiScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (gapiLoadedRef.current) {
        resolve();
        return;
      }

      if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
        gapiLoadedRef.current = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        gapiLoadedRef.current = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.body.appendChild(script);
    });
  }, []);

  const loadPickerApi = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (pickerApiLoadedRef.current) {
        resolve();
        return;
      }

      window.gapi.load('picker', {
        callback: () => {
          pickerApiLoadedRef.current = true;
          resolve();
        },
        onerror: () => reject(new Error('Failed to load Picker API')),
      });
    });
  }, []);

  useEffect(() => {
    loadGapiScript().catch(() => {
      setError('Failed to load Google API script');
    });
  }, [loadGapiScript]);

  async function openPicker() {
    setLoading(true);
    setError(null);

    try {
      await loadGapiScript();
      await loadPickerApi();

      const { token } = await api.get<{ token: string }>('/auth/google-token');
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (!clientId) {
        throw new Error('Google Client ID is not configured');
      }

      const docsView = new window.google.picker.DocsView(
        window.google.picker.ViewId.DOCUMENTS
      )
        .setMimeTypes('application/vnd.google-apps.document,text/plain')
        .setMode(window.google.picker.DocsViewMode.LIST);

      const picker = new window.google.picker.PickerBuilder()
        .setOAuthToken(token)
        .setDeveloperKey('') // Not required when using OAuth token
        .setAppId(clientId)
        .addView(docsView)
        .setCallback((data: { action: string; docs?: Array<{ id: string }> }) => {
          if (data.action === window.google.picker.Action.PICKED && data.docs?.[0]) {
            onSelect(data.docs[0].id);
          } else if (data.action === window.google.picker.Action.CANCEL) {
            onCancel?.();
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open picker');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={openPicker}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Opening...' : 'Select from Google Drive'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
