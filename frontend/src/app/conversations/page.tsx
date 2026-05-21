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
  const [showImportModal, setShowImportModal] = useState(false);
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
  }, [fetchConversations]);

  async function fetchPeople() {
    try {
      const data = await api.get<Person[]>('/people');
      setPeople(data);
    } catch {
      // Non-critical — people dropdown will be empty
    }
  }

  function handleImportClick() {
    setShowImportModal(true);
    fetchPeople();
  }

  function handleContinueToPickerClick() {
    setShowImportModal(false);
    setShowPicker(true);
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
      setSelectedPersonId('');
    }
  }

  function handlePickerCancel() {
    setShowPicker(false);
    setSelectedPersonId('');
  }

  function handleModalCancel() {
    setShowImportModal(false);
    setSelectedPersonId('');
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
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Conversations</h1>
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {importing ? 'Importing...' : 'Import from Google Drive'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {importing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
          Importing conversation from Google Drive...
        </div>
      )}

      {/* Import Modal — Person selection */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-md border border-zinc-200 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Import Conversation
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Optionally link this conversation to a person:
            </p>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 mb-6"
            >
              <option value="">No person (unlinked)</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleModalCancel}
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinueToPickerClick}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Picker */}
      {showPicker && (
        <div className="mb-6">
          <GoogleDrivePicker
            onSelect={handleDocumentSelect}
            onCancel={handlePickerCancel}
          />
        </div>
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
