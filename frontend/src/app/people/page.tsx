'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
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
        <p className="text-text-muted">Loading people...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">People</h1>
        <Link
          href="/people/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          New Person
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {people.length === 0 ? (
        <p className="text-text-muted">
          No people yet.{' '}
          <Link href="/people/new" className="text-primary hover:underline">
            Add your first person
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {people.map((person) => (
            <div
              key={person.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md "
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/people/${person.id}`}
                  className="flex-1"
                >
                  <h2 className="font-medium text-text-primary">
                    {person.name}
                  </h2>
                  {person.description && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {person.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {person.memoryCount > 0 && (
                      <span className="text-xs bg-blue-50 text-primary px-2 py-0.5 rounded">
                        {person.memoryCount} {person.memoryCount === 1 ? 'memory' : 'memories'}
                      </span>
                    )}
                    <span className="text-xs text-text-faint">
                      Created {new Date(person.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDelete(person.id, e)}
                  className="ml-4 p-1 text-text-faint hover:text-red-500 transition-colors"
                  aria-label="Delete person"
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
