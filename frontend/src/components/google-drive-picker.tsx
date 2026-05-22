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
  const [error, setError] = useState<string | null>(null);
  const gapiLoadedRef = useRef(false);
  const pickerApiLoadedRef = useRef(false);
  const openedRef = useRef(false);

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

  // Auto-open picker on mount
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;

    async function open() {
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
          .setMimeTypes('application/vnd.google-apps.document')
          .setMode(window.google.picker.DocsViewMode.LIST);

        const filesView = new window.google.picker.DocsView(
          window.google.picker.ViewId.DOCS
        )
          .setMimeTypes('text/plain,text/markdown')
          .setMode(window.google.picker.DocsViewMode.LIST);

        const picker = new window.google.picker.PickerBuilder()
          .setOAuthToken(token)
          .setDeveloperKey('')
          .setAppId(clientId)
          .addView(docsView)
          .addView(filesView)
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
        onCancel?.();
      }
    }

    open();
  }, [loadGapiScript, loadPickerApi, onSelect, onCancel]);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    );
  }

  return null;
}
