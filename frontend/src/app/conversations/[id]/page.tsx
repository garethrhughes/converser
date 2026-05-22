'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import type { Conversation, ConversationSection } from '@/types';

export default function ViewConversationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [activeSection, setActiveSection] = useState<ConversationSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversation() {
      try {
        const data = await api.get<Conversation>(`/conversations/${params.id}`);
        setConversation(data);

        // Set first section as active by default
        const sortedSections = (data.sections ?? []).sort((a, b) => a.order - b.order);
        if (sortedSections.length > 0) {
          setActiveSection(sortedSections[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch conversation');
      } finally {
        setLoading(false);
      }
    }

    fetchConversation();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading conversation...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="px-10 py-10">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error ?? 'Conversation not found'}
        </div>
        <button
          onClick={() => router.push('/conversations')}
          className="text-sm text-primary hover:text-primary-hover font-medium"
        >
          Back to Conversations
        </button>
      </div>
    );
  }

  const sortedSections = (conversation.sections ?? []).sort((a, b) => a.order - b.order);

  return (
    <div className="px-10 py-10">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/conversations')}
          className="text-sm text-text-muted hover:text-text-tertiary dark:hover:text-zinc-300 font-medium"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-semibold text-text-primary">
          {conversation.title}
        </h1>
      </div>

      <div className="flex items-center gap-3 mb-6">
        {conversation.person && (
          <span className="text-sm text-text-secondary">
            {conversation.person.name}
          </span>
        )}
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-alt text-text-tertiary bg-surface-alt dark:text-zinc-300">
          {conversation.sourceType}
        </span>
        <span className="text-xs text-text-faint">
          Imported {new Date(conversation.importedAt).toLocaleDateString()}
        </span>
      </div>

      {sortedSections.length === 0 ? (
        <p className="text-text-muted">
          This conversation has no sections.
        </p>
      ) : (
        <>
          {/* Section Tabs */}
          <div className="flex flex-wrap gap-1 mb-6 border-b border-border pb-2">
            {sortedSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section)}
                className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                  activeSection?.id === section.id
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt  dark:hover:text-text-primary dark:hover:bg-zinc-800'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>

          {/* Section Content — read-only CodeMirror */}
          {activeSection && (
            <MarkdownEditor
              value={activeSection.content}
              onChange={() => {
                // Read-only: changes are intentionally discarded
              }}
              placeholder=""
            />
          )}
        </>
      )}
    </div>
  );
}
