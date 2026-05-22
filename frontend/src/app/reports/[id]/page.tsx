'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '@/lib/api';
import type { Report } from '@/types';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await api.get<Report>(`/reports/${params.id}`);
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [params.id]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`/reports/${params.id}`);
      router.push('/reports');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error || 'Report not found'}
        </div>
        <Link href="/reports" className="mt-4 inline-block text-primary hover:text-primary-hover text-sm">
          Back to reports
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/reports"
          className="p-1 rounded hover:bg-surface-alt dark:hover:bg-zinc-800 transition-colors"
          aria-label="Back to reports"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-text-primary">
            {report.title}
          </h1>
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
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-text-faint hover:text-red-500 transition-colors"
          aria-label="Delete report"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>

      <div className="border border-border rounded-lg p-6 ">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{report.content}</Markdown>
        </div>
      </div>

      {/* Memory Changes */}
      {report.memoryChanges && (
        report.memoryChanges.added.length > 0 ||
        report.memoryChanges.updated.length > 0 ||
        report.memoryChanges.removed.length > 0
      ) && (
        <div className="mt-6 border border-border rounded-lg p-6 ">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            Memory Changes
          </h2>

          {report.memoryChanges.added.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-green-700 dark:text-green-400 uppercase mb-2">Added</h3>
              <div className="flex flex-col gap-1">
                {report.memoryChanges.added.map((item) => (
                  <div key={item.id} className="border-l-2 border-green-400 pl-3 py-1">
                    <p className="text-sm text-text-primary">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.memoryChanges.updated.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-yellow-700 dark:text-yellow-400 uppercase mb-2">Updated</h3>
              <div className="flex flex-col gap-1">
                {report.memoryChanges.updated.map((item) => (
                  <div key={item.id} className="border-l-2 border-yellow-400 pl-3 py-1">
                    <p className="text-sm text-text-faint line-through ">{item.previousContent}</p>
                    <p className="text-sm text-text-primary">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.memoryChanges.removed.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-red-700 dark:text-red-400 uppercase mb-2">Removed</h3>
              <div className="flex flex-col gap-1">
                {report.memoryChanges.removed.map((item) => (
                  <div key={item.id} className="border-l-2 border-red-400 pl-3 py-1">
                    <p className="text-sm text-text-faint line-through ">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
