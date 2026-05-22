'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Agent {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAgents() {
    try {
      setLoading(true);
      const data = await api.get<Agent[]>('/agents');
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgents();
  }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      await api.delete(`/agents/${id}`);
      await fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading agents...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Agents</h1>
        <Link
          href="/agents/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          New Agent
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {agents.length === 0 ? (
        <p className="text-text-muted">
          No agents yet.{' '}
          <Link href="/agents/new" className="text-primary hover:underline">
            Create your first agent
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md "
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/agents/${agent.id}`}
                  className="flex-1"
                >
                  <h2 className="font-medium text-text-primary">
                    {agent.name}
                  </h2>
                  {agent.description && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                  <span className="text-xs text-text-faint mt-2 inline-block">
                    Created {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                </Link>
                <button
                  onClick={(e) => handleDelete(agent.id, e)}
                  className="ml-4 p-1 text-text-faint hover:text-red-500 transition-colors"
                  aria-label="Delete agent"
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
