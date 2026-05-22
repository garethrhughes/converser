'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { MarkdownEditor } from '@/components/ui/markdown-editor';

const DEFAULT_MEMORY_INSTRUCTIONS = `You are a memory extraction assistant. Given a report about a person, compare it against their existing memories and determine what should be added, updated, or removed.

Rules:
- Add new facts, decisions, action items, or themes not already captured
- Update existing memories if new information clarifies, corrects, or supersedes them (reference by ID)
- Remove memories that are no longer relevant (e.g. completed actions, outdated facts) (reference by ID)
- Consolidate related or redundant memories: if multiple items express the same fact or theme, merge them into one updated item and remove the redundant ones
- Each memory should be a single sentence or short phrase
- Focus on facts, decisions made, action items, and recurring themes
- Do not include opinions or speculation
- Keep the total memory list concise — prefer fewer well-written items over many overlapping ones`;

export default function NewAgentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [memoryInstructions, setMemoryInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/agents', {
        name,
        description,
        instructions,
        memoryInstructions: memoryInstructions || undefined,
      });
      router.push('/agents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
      setSubmitting(false);
    }
  }

  return (
    <div className="px-10 py-10 overflow-hidden">
      <h1 className="text-2xl font-semibold text-text-primary mb-8">
        New Agent
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
            className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary placeholder:text-text-faint transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none  "
            placeholder="Agent name"
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
            className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary placeholder:text-text-faint transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none  "
            placeholder="Short description of what this agent does"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Instructions
          </label>
          <MarkdownEditor
            value={instructions}
            onChange={setInstructions}
            placeholder="Write agent instructions in Markdown..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Memory Extraction Instructions
          </label>
          <p className="text-xs text-text-muted mb-2">
            Custom instructions for how memories are extracted from reports. Must instruct the model to return a JSON array of strings.
          </p>
          {!memoryInstructions && (
            <button
              type="button"
              onClick={() => setMemoryInstructions(DEFAULT_MEMORY_INSTRUCTIONS)}
              className="mb-2 text-xs text-primary hover:text-primary-hover"
            >
              Load default template
            </button>
          )}
          <MarkdownEditor
            value={memoryInstructions}
            onChange={setMemoryInstructions}
            placeholder="Custom memory extraction instructions (optional)..."
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Agent'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/agents')}
            className="px-5 py-2 text-sm font-medium text-text-tertiary hover:text-text-primary dark:text-zinc-300 dark:hover:text-text-primary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
