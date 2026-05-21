'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

  async function handleDelete(id: string) {
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
        <p className="text-zinc-500">Loading agents...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Agents</h1>
        <Link
          href="/agents/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          New Agent
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {agents.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          No agents yet.{' '}
          <Link href="/agents/new" className="text-blue-600 hover:underline">
            Create your first agent
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="border border-zinc-200 rounded-lg p-5 hover:border-zinc-300 transition-colors dark:border-zinc-700 dark:hover:border-zinc-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    {agent.name}
                  </h2>
                  {agent.description && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {agent.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    Created {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Link
                    href={`/agents/${agent.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(agent.id)}
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
