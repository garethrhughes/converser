'use client';

import { useEffect, useState } from 'react';
import { X, Clock, Users as UsersIcon, Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { FirefliesMeeting } from '@/types';

interface FirefliesMeetingPickerProps {
  onSelect: (transcriptId: string) => void;
  onCancel: () => void;
}

export function FirefliesMeetingPicker({
  onSelect,
  onCancel,
}: FirefliesMeetingPickerProps) {
  const [meetings, setMeetings] = useState<FirefliesMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  async function fetchMeetings() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FirefliesMeeting[]>(
        '/integrations/fireflies/meetings?limit=50',
      );
      setMeetings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load meetings',
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredMeetings = meetings.filter((meeting) =>
    meeting.title.toLowerCase().includes(search.toLowerCase()),
  );

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fireflies-picker-title"
        className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-lg max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 id="fireflies-picker-title" className="text-lg font-semibold text-text-primary">
            Select a Fireflies Meeting
          </h2>
          <button
            onClick={onCancel}
            className="p-1 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-md bg-transparent text-sm text-text-primary transition-colors hover:border-squirrel-300 focus:border-squirrel-400 focus:ring-1 focus:ring-squirrel-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Meeting list */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <p className="text-text-muted text-sm">Loading meetings...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm m-2">
              {error}
            </div>
          )}

          {!loading && !error && filteredMeetings.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-text-muted text-sm">
                {search ? 'No meetings match your search.' : 'No meetings found.'}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredMeetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => onSelect(meeting.id)}
                className="w-full text-left p-3 rounded-lg border border-transparent hover:border-squirrel-300 hover:bg-surface-raised transition-colors"
              >
                <p className="font-medium text-sm text-text-primary">
                  {meeting.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-text-muted">
                    {new Date(meeting.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="h-3 w-3" />
                    {formatDuration(meeting.duration)}
                  </span>
                  {meeting.participants.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <UsersIcon className="h-3 w-3" />
                      {meeting.participants.length}
                    </span>
                  )}
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
