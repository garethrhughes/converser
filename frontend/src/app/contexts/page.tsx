'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
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
        <p className="text-text-muted">Loading contexts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Contexts</h1>
        <Link
          href="/contexts/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          New Context
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {contexts.length === 0 ? (
        <p className="text-text-muted">
          No contexts yet.{' '}
          <Link href="/contexts/new" className="text-primary hover:underline">
            Create your first context
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {contexts.map((context) => (
            <div
              key={context.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md "
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/contexts/${context.id}`}
                  className="flex-1"
                >
                  <h2 className="font-medium text-text-primary">
                    {context.name}
                  </h2>
                  {context.description && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {context.description}
                    </p>
                  )}
                  <span className="text-xs text-text-faint mt-2 inline-block">
                    Created {new Date(context.createdAt).toLocaleDateString()}
                  </span>
                </Link>
                <button
                  onClick={(e) => handleDelete(context.id, e)}
                  className="ml-4 p-1 text-text-faint hover:text-red-500 transition-colors"
                  aria-label="Delete context"
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
