'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { MarkdownEditor } from '@/components/ui/markdown-editor';

interface Context {
  id: string;
  name: string;
  description: string;
  content: string;
}

export default function EditContextPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContext() {
      try {
        const ctx = await api.get<Context>(`/contexts/${params.id}`);
        setName(ctx.name);
        setDescription(ctx.description ?? '');
        setContent(ctx.content ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch context');
      } finally {
        setLoading(false);
      }
    }

    fetchContext();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.patch(`/contexts/${params.id}`, { name, description, content });
      router.push('/contexts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update context');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading context...</p>
      </div>
    );
  }

  return (
    <div className="px-10 py-10 overflow-hidden">
      <h1 className="text-2xl font-semibold text-text-primary mb-8">
        Edit Context
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-text-primary placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-surface-alt  "
            placeholder="Context name"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-text-primary placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-surface-alt  "
            placeholder="Short description of this context"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Content
          </label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Write context content in Markdown..."
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/contexts')}
            className="px-5 py-2 text-sm font-medium text-text-tertiary hover:text-text-primary dark:text-zinc-300 dark:hover:text-text-primary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
