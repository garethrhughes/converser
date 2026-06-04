'use client';

import { useEffect, useState } from 'react';
import { Plug, Unplug, Check, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { FirefliesStatus } from '@/types';

export default function IntegrationsPage() {
  const [status, setStatus] = useState<FirefliesStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      const data = await api.get<FirefliesStatus>('/integrations/fireflies/status');
      setStatus(data);
    } catch {
      setError('Failed to fetch integration status');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    if (!apiKey.trim()) {
      setError('Please enter your Fireflies API key');
      return;
    }

    setConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/integrations/fireflies', { apiKey: apiKey.trim() });
      setStatus({ connected: true });
      setApiKey('');
      setSuccess('Fireflies connected successfully');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect Fireflies',
      );
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Fireflies?')) return;

    setDisconnecting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.delete('/integrations/fireflies');
      setStatus({ connected: false });
      setSuccess('Fireflies disconnected');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to disconnect Fireflies',
      );
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading integrations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Integrations</h1>
        <p className="mt-1 text-sm text-text-muted">
          Connect external services to import conversations.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Fireflies Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Plug className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-medium text-text-primary">Fireflies.ai</h2>
              <p className="text-sm text-text-muted">
                Import meeting transcripts from Fireflies
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              status?.connected
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-text-muted'
            }`}
          >
            {status?.connected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          {status?.connected ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Your Fireflies account is connected. You can import transcripts from
                the Conversations page.
              </p>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Unplug className="h-4 w-4" />
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-text-secondary mb-3">
                Enter your Fireflies API key to connect. You can find it in your{' '}
                <a
                  href="https://app.fireflies.ai/integrations/custom/fireflies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Fireflies Integrations settings
                </a>
                .
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label
                    htmlFor="fireflies-api-key"
                    className="block text-xs text-text-muted mb-1"
                  >
                    API Key
                  </label>
                  <input
                    id="fireflies-api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Fireflies API key"
                    className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-sm text-text-primary transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleConnect}
                  disabled={connecting || !apiKey.trim()}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
