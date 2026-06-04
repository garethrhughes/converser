'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Trash2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { GoogleDrivePicker } from '@/components/google-drive-picker';
import { FirefliesMeetingPicker } from '@/components/fireflies-meeting-picker';
import type { Conversation, Person, FirefliesStatus, ImportResponse, RedactionSummary } from '@/types';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showFirefliesPicker, setShowFirefliesPicker] = useState(false);
  const [firefliesStatus, setFirefliesStatus] = useState<FirefliesStatus | null>(null);
  const [redactionNotice, setRedactionNotice] = useState<RedactionSummary | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Conversation[]>('/conversations');
      setConversations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchPeople();
    fetchFirefliesStatus();
  }, [fetchConversations]);

  async function fetchPeople() {
    try {
      const data = await api.get<Person[]>('/people');
      setPeople(data);
    } catch {
      // Non-critical
    }
  }

  async function fetchFirefliesStatus() {
    try {
      const data = await api.get<FirefliesStatus>('/integrations/fireflies/status');
      setFirefliesStatus(data);
    } catch {
      // Non-critical — Fireflies import won't be available
    }
  }

  async function handleDocumentSelect(documentId: string) {
    setShowPicker(false);
    setImporting(true);
    setError(null);
    setRedactionNotice(null);

    try {
      const body: { documentId: string; personId?: string } = { documentId };
      if (selectedPersonId) {
        body.personId = selectedPersonId;
      }
      const response = await api.post<ImportResponse>('/conversations/import', body);
      if (response.piiDetected && response.redactionSummary) {
        setRedactionNotice(response.redactionSummary);
      }
      await fetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import conversation');
    } finally {
      setImporting(false);
    }
  }

  async function handleFirefliesSelect(transcriptId: string) {
    setShowFirefliesPicker(false);
    setImporting(true);
    setError(null);
    setRedactionNotice(null);

    try {
      const body: { transcriptId: string; personId?: string } = { transcriptId };
      if (selectedPersonId) {
        body.personId = selectedPersonId;
      }
      const response = await api.post<ImportResponse>('/integrations/fireflies/import', body);
      if (response.piiDetected && response.redactionSummary) {
        setRedactionNotice(response.redactionSummary);
      }
      await fetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import from Fireflies');
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await api.delete(`/conversations/${id}`);
      await fetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  }

  function formatRedactionSummary(summary: RedactionSummary): string {
    const labels: Record<string, string> = {
      email: 'email address',
      phone: 'phone number',
      'credit-card': 'credit card number',
      ssn: 'SSN',
      'national-id': 'national ID number',
      'date-of-birth': 'date of birth',
      address: 'physical address',
    };

    const parts: string[] = [];
    for (const [category, count] of Object.entries(summary.categories)) {
      if (count > 0) {
        const label = labels[category] || category;
        parts.push(`${count} ${label}${count > 1 ? 's' : ''}`);
      }
    }

    return parts.join(', ') || `${summary.totalRedactions} item(s)`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Conversations</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {redactionNotice && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex items-start gap-2">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">PII detected and redacted</p>
            <p className="text-sm mt-1">
              {formatRedactionSummary(redactionNotice)} removed from this conversation before storage.
            </p>
          </div>
        </div>
      )}

      {/* Import section */}
      <div className="mb-8 p-5 border border-border rounded-lg bg-surface-alt">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Import Conversation</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label htmlFor="person-select" className="block text-xs text-text-muted mb-1">
              Link to person (optional)
            </label>
            <select
              id="person-select"
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-sm text-text-primary transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none"
            >
              <option value="">No person</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPicker(true)}
              disabled={importing}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? 'Importing...' : 'Google Drive'}
            </button>
            {firefliesStatus?.connected && (
              <button
                onClick={() => setShowFirefliesPicker(true)}
                disabled={importing}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importing...' : 'Fireflies'}
              </button>
            )}
          </div>
        </div>
      </div>

      {importing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
          Importing conversation...
        </div>
      )}

      {/* Google Drive Picker */}
      {showPicker && (
        <GoogleDrivePicker
          onSelect={handleDocumentSelect}
          onCancel={() => setShowPicker(false)}
        />
      )}

      {/* Fireflies Meeting Picker */}
      {showFirefliesPicker && (
        <FirefliesMeetingPicker
          onSelect={handleFirefliesSelect}
          onCancel={() => setShowFirefliesPicker(false)}
        />
      )}

      {conversations.length === 0 ? (
        <p className="text-text-muted">
          No conversations yet. Import your first conversation from Google Drive
          {firefliesStatus?.connected ? ' or Fireflies' : ''}.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/conversations/${conversation.id}`}
                  className="flex-1"
                >
                  <h2 className="font-medium text-text-primary">
                    {conversation.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    {conversation.person && (
                      <span className="text-xs text-text-muted">
                        {conversation.person.name}
                      </span>
                    )}
                    <span className="text-xs bg-surface-alt text-text-secondary px-2 py-0.5 rounded">
                      {conversation.sourceType === 'fireflies'
                        ? 'Fireflies'
                        : 'Google Docs'}
                    </span>
                    <span className="text-xs text-text-faint">
                      Imported {new Date(conversation.importedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDelete(conversation.id, e)}
                  className="ml-4 p-1 text-text-faint hover:text-red-500 transition-colors"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
