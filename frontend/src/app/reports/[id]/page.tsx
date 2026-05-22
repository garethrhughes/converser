'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Markdown from 'react-markdown';
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
        <p className="text-zinc-500 dark:text-zinc-400">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-300">
          {error || 'Report not found'}
        </div>
        <Link href="/reports" className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm">
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
          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Back to reports"
        >
          <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {report.title}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {report.person && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {report.person.name}
              </span>
            )}
            {report.agent && (
              <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded dark:bg-zinc-800 dark:text-zinc-400">
                {report.agent.name}
              </span>
            )}
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {new Date(report.createdAt).toLocaleDateString()} at{' '}
              {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
          aria-label="Delete report"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>

      <div className="border border-zinc-200 rounded-lg p-6 dark:border-zinc-700">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <Markdown>{report.content}</Markdown>
        </div>
      </div>
    </div>
  );
}
