'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Report, Agent, Person } from '@/types';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportsData, agentsData, peopleData] = await Promise.all([
        api.get<Report[]>('/reports'),
        api.get<Agent[]>('/agents'),
        api.get<Person[]>('/people'),
      ]);
      setReports(reportsData);
      setAgents(agentsData);
      setPeople(peopleData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredReports = useMemo(() => {
    let filtered = reports;
    if (selectedAgentId) {
      filtered = filtered.filter((r) => r.agent?.id === selectedAgentId);
    }
    if (selectedPersonId) {
      filtered = filtered.filter((r) => r.person?.id === selectedPersonId);
    }
    return filtered;
  }, [reports, selectedAgentId, selectedPersonId]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
        <Link
          href="/"
          className="px-4 py-2 bg-primary text-primary-fg text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          Generate New Report
        </Link>
      </div>

      {/* Filters */}
      {reports.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <select
            value={selectedPersonId}
            onChange={(e) => setSelectedPersonId(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-transparent text-text-primary transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none"
          >
            <option value="">All people</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-transparent text-text-primary transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none"
          >
            <option value="">All agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted mb-4">No reports yet.</p>
          <Link href="/" className="text-primary hover:underline text-sm">
            Generate your first report
          </Link>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">No reports match the current filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <Link href={`/reports/${report.id}`} className="flex-1">
                  <h2 className="font-medium text-text-primary">{report.title}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    {report.person && (
                      <Link
                        href={`/people/${report.person.id}`}
                        className="text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {report.person.name}
                      </Link>
                    )}
                    {report.agent && (
                      <Link
                        href={`/agents/${report.agent.id}`}
                        className="text-xs bg-surface-alt text-text-tertiary px-2 py-0.5 rounded hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {report.agent.name}
                      </Link>
                    )}
                    <span className="text-xs text-text-faint">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                    {report.content.substring(0, 150)}{report.content.length > 150 ? '...' : ''}
                  </p>
                </Link>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="ml-4 p-1 text-text-faint hover:text-red-500 transition-colors"
                  aria-label="Delete report"
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
