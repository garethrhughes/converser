'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Pencil, Trash2, ArrowLeft } from 'lucide-react';
import type { Person, Conversation, Report, MemoryItem } from '@/types';

type Tab = 'overview' | 'conversations' | 'reports' | 'memory';

export default function PersonHubPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPerson() {
      try {
        const data = await api.get<Person>(`/people/${params.id}`);
        setPerson(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load person');
      } finally {
        setLoading(false);
      }
    }
    fetchPerson();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error || 'Person not found'}
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'conversations', label: 'Conversations' },
    { key: 'reports', label: 'Reports' },
    { key: 'memory', label: 'Memory' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/people"
          className="p-1 rounded hover:bg-surface-raised transition-colors"
          aria-label="Back to people"
        >
          <ArrowLeft className="h-5 w-5 text-text-tertiary" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{person.name}</h1>
          {person.description && (
            <p className="text-sm text-text-secondary mt-0.5">{person.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-primary hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab person={person} onUpdate={setPerson} />}
      {activeTab === 'conversations' && <ConversationsTab personId={params.id} />}
      {activeTab === 'reports' && <ReportsTab personId={params.id} />}
      {activeTab === 'memory' && <MemoryTab personId={params.id} />}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ person, onUpdate }: { person: Person; onUpdate: (p: Person) => void }) {
  const router = useRouter();
  const [name, setName] = useState(person.name);
  const [description, setDescription] = useState(person.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.patch<Person>(`/people/${person.id}`, { name, description });
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-primary text-primary-fg text-sm font-medium rounded-md transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {submitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

// ─── Conversations Tab ───────────────────────────────────────────────────────

function ConversationsTab({ personId }: { personId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Conversation[]>(`/conversations?personId=${personId}`)
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [personId]);

  if (loading) return <p className="text-text-muted text-sm">Loading conversations...</p>;

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">No conversations linked to this person.</p>
        <Link href="/conversations" className="text-primary text-sm mt-2 inline-block hover:underline">
          Import a conversation
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/conversations/${conv.id}`}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <h3 className="font-medium text-text-primary">{conv.title}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs bg-surface-alt text-text-tertiary px-2 py-0.5 rounded">
              {conv.sourceType}
            </span>
            <span className="text-xs text-text-faint">
              Imported {new Date(conv.importedAt).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────────────────

function ReportsTab({ personId }: { personId: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Report[]>(`/reports/person/${personId}`)
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [personId]);

  if (loading) return <p className="text-text-muted text-sm">Loading reports...</p>;

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">No reports for this person yet.</p>
        <Link href="/" className="text-primary text-sm mt-2 inline-block hover:underline">
          Generate a report
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reports.map((report) => (
        <Link
          key={report.id}
          href={`/reports/${report.id}`}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <h3 className="font-medium text-text-primary">{report.title}</h3>
          <div className="flex items-center gap-3 mt-1">
            {report.agent && (
              <span className="text-xs bg-surface-alt text-text-tertiary px-2 py-0.5 rounded">
                {report.agent.name}
              </span>
            )}
            <span className="text-xs text-text-faint">
              {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-2 line-clamp-2">
            {report.content.substring(0, 150)}{report.content.length > 150 ? '...' : ''}
          </p>
        </Link>
      ))}
    </div>
  );
}

// ─── Memory Tab ──────────────────────────────────────────────────────────────

function MemoryTab({ personId }: { personId: string }) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<MemoryItem[]>(`/people/${personId}/memories`)
      .then(setMemories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [personId]);

  const handleEdit = useCallback((memory: MemoryItem) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
  }, []);

  const handleSave = useCallback(async (memoryId: string) => {
    try {
      const updated = await api.patch<MemoryItem>(
        `/people/${personId}/memories/${memoryId}`,
        { content: editContent },
      );
      setMemories((prev) => prev.map((m) => (m.id === memoryId ? updated : m)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  }, [personId, editContent]);

  const handleDelete = useCallback(async (memoryId: string) => {
    if (!confirm('Delete this memory item?')) return;
    try {
      await api.delete(`/people/${personId}/memories/${memoryId}`);
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }, [personId]);

  if (loading) return <p className="text-text-muted text-sm">Loading memories...</p>;

  return (
    <div>
      <p className="text-sm text-text-muted mb-4">
        Key facts and themes extracted from reports. Included automatically in future analyses.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
      )}

      {memories.length === 0 ? (
        <p className="text-sm text-text-faint italic">
          No memories yet. Generate a report to start building memory.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="flex items-start gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm"
            >
              {editingId === memory.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(memory.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 px-2 py-1 border border-border rounded text-sm text-text-primary bg-transparent transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave(memory.id)}
                    className="px-2 py-1 text-xs bg-primary text-primary-fg rounded hover:bg-primary-hover"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-2 py-1 text-xs text-text-muted hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <p className="flex-1 text-sm text-text-primary">{memory.content}</p>
                  <button
                    onClick={() => handleEdit(memory)}
                    className="p-1 text-text-faint hover:text-text-secondary transition-colors"
                    aria-label="Edit memory"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(memory.id)}
                    className="p-1 text-text-faint hover:text-red-500 transition-colors"
                    aria-label="Delete memory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
