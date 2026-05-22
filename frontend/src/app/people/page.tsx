'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Person, MemoryItem } from '@/types';

interface PersonWithMemoryCount extends Person {
  memoryCount: number;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<PersonWithMemoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPeople() {
    try {
      setLoading(true);
      const data = await api.get<Person[]>('/people');

      // Fetch memory counts in parallel
      const withMemory = await Promise.all(
        data.map(async (person) => {
          try {
            const memories = await api.get<MemoryItem[]>(`/people/${person.id}/memories`);
            return { ...person, memoryCount: memories.length };
          } catch {
            return { ...person, memoryCount: 0 };
          }
        }),
      );

      setPeople(withMemory);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch people');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPeople();
  }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this person?')) return;

    try {
      await api.delete(`/people/${id}`);
      await fetchPeople();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete person');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">Loading people...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">People</h1>
        <Link
          href="/people/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          New Person
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {people.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          No people yet.{' '}
          <Link href="/people/new" className="text-blue-600 hover:underline">
            Add your first person
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {people.map((person) => (
            <div
              key={person.id}
              className="border border-zinc-200 rounded-lg p-4 dark:border-zinc-700"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/people/${person.id}`}
                  className="flex-1 hover:opacity-80 transition-opacity"
                >
                  <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
                    {person.name}
                  </h2>
                  {person.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                      {person.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {person.memoryCount > 0 && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded dark:bg-blue-950 dark:text-blue-400">
                        {person.memoryCount} {person.memoryCount === 1 ? 'memory' : 'memories'}
                      </span>
                    )}
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      Created {new Date(person.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDelete(person.id, e)}
                  className="ml-4 p-1 text-zinc-400 hover:text-red-500 transition-colors"
                  aria-label="Delete person"
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
