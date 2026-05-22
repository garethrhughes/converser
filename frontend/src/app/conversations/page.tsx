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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
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
        <div className="flex flex-col gap-3">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="border border-zinc-200 rounded-lg p-4 dark:border-zinc-700"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/conversations/${conversation.id}`}
                  className="flex-1 hover:opacity-80 transition-opacity"
                >
                  <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
                    {conversation.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    {conversation.person && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {conversation.person.name}
                      </span>
                    )}
                    <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded dark:bg-zinc-800 dark:text-zinc-400">
                      {conversation.sourceType}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      Imported {new Date(conversation.importedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDelete(conversation.id, e)}
                  className="ml-4 p-1 text-zinc-400 hover:text-red-500 transition-colors"
                  aria-label="Delete conversation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
