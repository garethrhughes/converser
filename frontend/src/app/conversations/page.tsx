'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { GoogleDrivePicker } from '@/components/google-drive-picker';
import type { Conversation, Person } from '@/types';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

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
  }, [fetchConversations]);

  async function fetchPeople() {
    try {
      const data = await api.get<Person[]>('/people');
      setPeople(data);
    } catch {
      // Non-critical
    }
  }

  async function handleDocumentSelect(documentId: string) {
    setShowPicker(false);
    setImporting(true);
    setError(null);

    try {
      const body: { documentId: string; personId?: string } = { documentId };
      if (selectedPersonId) {
        body.personId = selectedPersonId;
      }
      await api.post('/conversations/import', body);
      await fetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import conversation');
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await api.delete(`/conversations/${id}`);
      await fetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Conversations</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Import section */}
      <div className="mb-8 p-5 border border-zinc-200 rounded-lg bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Import from Google Drive</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label htmlFor="person-select" className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              Link to person (optional)
            </label>
            <select
              id="person-select"
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
            >
              <option value="">No person</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowPicker(true)}
            disabled={importing}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>

      {importing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
          Importing conversation from Google Drive...
        </div>
      )}

      {/* Google Drive Picker */}
      {showPicker && (
        <GoogleDrivePicker
          onSelect={handleDocumentSelect}
          onCancel={() => setShowPicker(false)}
        />
      )}

      {conversations.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          No conversations yet. Import your first conversation from Google Drive.
        </p>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="border border-zinc-200 rounded-lg p-5 hover:border-zinc-300 transition-colors dark:border-zinc-700 dark:hover:border-zinc-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    {conversation.title}
                  </h2>
                  <div className="mt-1 flex items-center gap-3">
                    {conversation.person && (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {conversation.person.name}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {conversation.sourceType}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    Imported {new Date(conversation.importedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Link
                    href={`/conversations/${conversation.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(conversation.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
