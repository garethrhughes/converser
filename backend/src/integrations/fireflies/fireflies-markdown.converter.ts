import type { FirefliesTranscript } from './fireflies.types';

interface ConvertedTranscript {
  transcript: string;
  summary: string | null;
}

export function convertTranscriptToMarkdown(
  data: FirefliesTranscript,
): ConvertedTranscript {
  const transcript = buildTranscriptMarkdown(data);
  const summary = data.summary ? buildSummaryMarkdown(data) : null;

  return { transcript, summary };
}

function buildTranscriptMarkdown(data: FirefliesTranscript): string {
  const lines: string[] = [];

  lines.push(`## ${data.title}`);
  lines.push('');
  lines.push(`**Date:** ${formatDate(data.date)}`);
  lines.push(`**Duration:** ${formatDuration(data.duration)}`);
  lines.push(`**Participants:** ${data.participants.join(', ')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (data.sentences.length === 0) {
    lines.push('*No transcript content available.*');
    return lines.join('\n');
  }

  const grouped = groupSentencesBySpeaker(data.sentences);

  for (const group of grouped) {
    const timestamp = formatTimestamp(group.startTime);
    lines.push(`**${group.speakerName}** (${timestamp})`);
    lines.push(group.texts.join('\n'));
    lines.push('');
  }

  return lines.join('\n');
}

function buildSummaryMarkdown(data: FirefliesTranscript): string {
  const summary = data.summary!;
  const lines: string[] = [];

  lines.push('## Summary');
  lines.push('');

  if (summary.overview) {
    lines.push(summary.overview);
    lines.push('');
  }

  if (summary.actionItems.length > 0) {
    lines.push('### Action Items');
    lines.push('');
    for (const item of summary.actionItems) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  if (summary.keywords.length > 0) {
    lines.push('### Keywords');
    lines.push('');
    lines.push(summary.keywords.join(', '));
    lines.push('');
  }

  return lines.join('\n');
}

interface SpeakerGroup {
  speakerName: string;
  startTime: number;
  texts: string[];
}

function groupSentencesBySpeaker(
  sentences: FirefliesTranscript['sentences'],
): SpeakerGroup[] {
  const groups: SpeakerGroup[] = [];

  for (const sentence of sentences) {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.speakerName === sentence.speakerName) {
      lastGroup.texts.push(sentence.text);
    } else {
      groups.push({
        speakerName: sentence.speakerName,
        startTime: sentence.startTime,
        texts: [sentence.text],
      });
    }
  }

  return groups;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().split('T')[0];
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours.toString()} hour${hours > 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes.toString()} minute${minutes > 1 ? 's' : ''}`);
  }

  return parts.join(' ') || '0 minutes';
}

function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
