'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Trash2 } from 'lucide-react';
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
          className="p-1 rounded hover:bg-surface-raised transition-colors"
          aria-label="Back to reports"
        >
          <ArrowLeft className="h-5 w-5 text-text-tertiary" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-text-primary">
            {report.title}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {report.person && (
              <Link
                href={`/people/${report.person.id}`}
                className="text-xs text-primary hover:underline"
              >
                {report.person.name}
              </Link>
            )}
            {report.agent && (
              <Link
                href={`/agents/${report.agent.id}`}
                className="text-xs bg-surface-alt text-text-tertiary px-2 py-0.5 rounded hover:text-primary"
              >
                {report.agent.name}
              </Link>
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
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm ">
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
        <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm ">
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
