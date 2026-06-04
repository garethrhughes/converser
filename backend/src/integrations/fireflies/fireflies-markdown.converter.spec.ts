import { convertTranscriptToMarkdown } from './fireflies-markdown.converter';
import type { FirefliesTranscript } from './fireflies.types';

describe('convertTranscriptToMarkdown', () => {
  const baseTranscript: FirefliesTranscript = {
    id: 'transcript-1',
    title: 'Weekly 1-1 with Alice',
    date: '2026-06-01T10:00:00.000Z',
    duration: 1800,
    speakers: [
      { id: 'speaker-1', name: 'Alice Smith' },
      { id: 'speaker-2', name: 'Bob Jones' },
    ],
    sentences: [
      {
        index: 0,
        speakerName: 'Alice Smith',
        speakerId: 'speaker-1',
        text: 'Hello, how are things going?',
        rawText: 'Hello, how are things going?',
        startTime: 5.0,
        endTime: 8.5,
      },
      {
        index: 1,
        speakerName: 'Bob Jones',
        speakerId: 'speaker-2',
        text: 'Pretty good! I wanted to discuss the timeline.',
        rawText: 'Pretty good! I wanted to discuss the timeline.',
        startTime: 9.0,
        endTime: 13.2,
      },
      {
        index: 2,
        speakerName: 'Alice Smith',
        speakerId: 'speaker-1',
        text: 'Sure, let us dig into that.',
        rawText: 'Sure, let us dig into that.',
        startTime: 14.0,
        endTime: 16.5,
      },
    ],
    summary: {
      keywords: ['timeline', 'project'],
      actionItems: ['Follow up on timeline'],
      overview: 'Discussion about project timeline.',
      shortSummary: 'Quick chat about timelines.',
    },
    participants: ['Alice Smith', 'Bob Jones'],
    transcriptUrl: 'https://app.fireflies.ai/view/transcript-1',
  };

  it('produces markdown with the meeting title as heading', () => {
    const { transcript } = convertTranscriptToMarkdown(baseTranscript);

    expect(transcript).toContain('## Weekly 1-1 with Alice');
  });

  it('includes meeting metadata (date, duration, participants)', () => {
    const { transcript } = convertTranscriptToMarkdown(baseTranscript);

    expect(transcript).toContain('**Date:** 2026-06-01');
    expect(transcript).toContain('**Duration:** 30 minutes');
    expect(transcript).toContain('**Participants:** Alice Smith, Bob Jones');
  });

  it('formats each sentence with speaker name and timestamp', () => {
    const { transcript } = convertTranscriptToMarkdown(baseTranscript);

    expect(transcript).toContain('**Alice Smith** (00:00:05)');
    expect(transcript).toContain('Hello, how are things going?');
    expect(transcript).toContain('**Bob Jones** (00:00:09)');
    expect(transcript).toContain('Pretty good! I wanted to discuss the timeline.');
  });

  it('groups consecutive sentences from the same speaker', () => {
    const transcriptWithConsecutive: FirefliesTranscript = {
      ...baseTranscript,
      sentences: [
        {
          index: 0,
          speakerName: 'Alice Smith',
          speakerId: 'speaker-1',
          text: 'Hello there.',
          rawText: 'Hello there.',
          startTime: 5.0,
          endTime: 7.0,
        },
        {
          index: 1,
          speakerName: 'Alice Smith',
          speakerId: 'speaker-1',
          text: 'How are you doing?',
          rawText: 'How are you doing?',
          startTime: 7.5,
          endTime: 9.0,
        },
        {
          index: 2,
          speakerName: 'Bob Jones',
          speakerId: 'speaker-2',
          text: 'I am fine.',
          rawText: 'I am fine.',
          startTime: 10.0,
          endTime: 11.5,
        },
      ],
    };

    const { transcript } = convertTranscriptToMarkdown(transcriptWithConsecutive);

    // Alice's header should only appear once (sentences grouped)
    const aliceHeaders = transcript.match(/\*\*Alice Smith\*\*/g);
    expect(aliceHeaders).toHaveLength(1);
    expect(transcript).toContain('Hello there.\nHow are you doing?');
  });

  it('returns a summary section when summary is present', () => {
    const { summary } = convertTranscriptToMarkdown(baseTranscript);

    expect(summary).not.toBeNull();
    expect(summary).toContain('## Summary');
    expect(summary).toContain('Discussion about project timeline.');
    expect(summary).toContain('Follow up on timeline');
    expect(summary).toContain('timeline');
    expect(summary).toContain('project');
  });

  it('returns null summary when transcript has no summary', () => {
    const transcriptWithoutSummary: FirefliesTranscript = {
      ...baseTranscript,
      summary: null,
    };

    const { summary } = convertTranscriptToMarkdown(transcriptWithoutSummary);

    expect(summary).toBeNull();
  });

  it('handles empty sentences gracefully', () => {
    const transcriptWithNoSentences: FirefliesTranscript = {
      ...baseTranscript,
      sentences: [],
    };

    const { transcript } = convertTranscriptToMarkdown(transcriptWithNoSentences);

    expect(transcript).toContain('## Weekly 1-1 with Alice');
    expect(transcript).toContain('*No transcript content available.*');
  });

  it('formats duration correctly for various lengths', () => {
    const shortMeeting: FirefliesTranscript = {
      ...baseTranscript,
      duration: 300, // 5 minutes
    };
    const longMeeting: FirefliesTranscript = {
      ...baseTranscript,
      duration: 5400, // 90 minutes (1h 30m)
    };

    const { transcript: short } = convertTranscriptToMarkdown(shortMeeting);
    const { transcript: long } = convertTranscriptToMarkdown(longMeeting);

    expect(short).toContain('**Duration:** 5 minutes');
    expect(long).toContain('**Duration:** 1 hour 30 minutes');
  });
});
