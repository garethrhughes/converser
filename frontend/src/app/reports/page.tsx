'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Report, Agent } from '@/types';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportsData, agentsData] = await Promise.all([
        api.get<Report[]>('/reports'),
        api.get<Agent[]>('/agents'),
      ]);
      setReports(reportsData);
      setAgents(agentsData);
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
    if (!selectedAgentId) return reports;
    return reports.filter((r) => r.agent?.id === selectedAgentId);
  }, [reports, selectedAgentId]);

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
        <h1 className="text-2xl font-semibold text-text-primary">
          Reports
        </h1>
        <Link
          href="/"
          className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover transition-colors"
        >
          Generate New Report
        </Link>
      </div>

      {/* Agent filter */}
      {agents.length > 0 && reports.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-transparent text-text-primary transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none  "
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
          <p className="text-text-muted mb-4">
            No reports yet. Generate your first report from the home page.
          </p>
          <Link
            href="/"
            className="text-primary hover:text-primary-hover"
          >
            Go to workflow
          </Link>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">
            No reports found for this agent.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md "
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/reports/${report.id}`}
                  className="flex-1"
                >
                  <h2 className="font-medium text-text-primary">
                    {report.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    {report.person && (
                      <span className="text-xs text-text-muted">
                        {report.person.name}
                      </span>
                    )}
                    {report.agent && (
                      <span className="text-xs bg-surface-alt text-text-secondary px-2 py-0.5 rounded bg-surface-alt ">
                        {report.agent.name}
                      </span>
                    )}
                    <span className="text-xs text-text-faint">
                      {new Date(report.createdAt).toLocaleDateString()} at{' '}
                      {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                    {report.content.substring(0, 150)}
                    {report.content.length > 150 ? '...' : ''}
                  </p>
                </Link>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="ml-4 p-1 text-text-faint hover:text-red-500 transition-colors"
                  aria-label="Delete report"
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
