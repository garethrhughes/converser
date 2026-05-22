'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Person, MemoryItem } from '@/types';

export default function EditPersonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memory state
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [person, mems] = await Promise.all([
          api.get<Person>(`/people/${params.id}`),
          api.get<MemoryItem[]>(`/people/${params.id}/memories`),
        ]);
        setName(person.name);
        setDescription(person.description ?? '');
        setMemories(mems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch person');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.patch(`/people/${params.id}`, { name, description });
      router.push('/people');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update person');
      setSubmitting(false);
    }
  }

  const handleEditMemory = useCallback((memory: MemoryItem) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
  }, []);

  const handleSaveMemory = useCallback(async (memoryId: string) => {
    try {
      const updated = await api.patch<MemoryItem>(
        `/people/${params.id}/memories/${memoryId}`,
        { content: editContent },
      );
      setMemories((prev) =>
        prev.map((m) => (m.id === memoryId ? updated : m)),
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update memory');
    }
  }, [params.id, editContent]);

  const handleDeleteMemory = useCallback(async (memoryId: string) => {
    if (!confirm('Delete this memory item?')) return;
    try {
      await api.delete(`/people/${params.id}/memories/${memoryId}`);
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">Loading person...</p>
      </div>
    );
  }

  return (
    <div className="px-10 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-8">
        Edit Person
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
            placeholder="Person name"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
            placeholder="Description or notes about this person"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/people')}
            className="px-5 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Memory Section */}
      <div className="mt-12 max-w-xl">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Memory
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Key facts and themes extracted from reports. Included automatically in future analyses.
        </p>

        {memories.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
            No memories yet. Generate a report to start building memory.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="flex items-start gap-2 border border-zinc-200 rounded-lg p-3 dark:border-zinc-700"
              >
                {editingId === memory.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveMemory(memory.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 px-2 py-1 border border-zinc-300 rounded text-sm text-zinc-900 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveMemory(memory.id)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">
                      {memory.content}
                    </p>
                    <button
                      onClick={() => handleEditMemory(memory)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      aria-label="Edit memory"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="p-1 text-zinc-400 hover:text-red-500"
                      aria-label="Delete memory"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
