'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Context {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function ContextsPage() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchContexts() {
    try {
      setLoading(true);
      const data = await api.get<Context[]>('/contexts');
      setContexts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contexts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContexts();
  }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this context?')) return;

    try {
      await api.delete(`/contexts/${id}`);
      await fetchContexts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete context');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">Loading contexts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Contexts</h1>
        <Link
          href="/contexts/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          New Context
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {contexts.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          No contexts yet.{' '}
          <Link href="/contexts/new" className="text-blue-600 hover:underline">
            Create your first context
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {contexts.map((context) => (
            <div
              key={context.id}
              className="border border-zinc-200 rounded-lg p-4 dark:border-zinc-700"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/contexts/${context.id}`}
                  className="flex-1 hover:opacity-80 transition-opacity"
                >
                  <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
                    {context.name}
                  </h2>
                  {context.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                      {context.description}
                    </p>
                  )}
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 inline-block">
                    Created {new Date(context.createdAt).toLocaleDateString()}
                  </span>
                </Link>
                <button
                  onClick={(e) => handleDelete(context.id, e)}
                  className="ml-4 p-1 text-zinc-400 hover:text-red-500 transition-colors"
                  aria-label="Delete context"
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
