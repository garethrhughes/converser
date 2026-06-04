import { FirefliesService } from './fireflies.service';
import type {
  FirefliesMeeting,
  FirefliesTranscript,
} from './fireflies.types';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('FirefliesService', () => {
  let service: FirefliesService;

  beforeEach(() => {
    service = new FirefliesService();
    jest.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('returns true when the API responds successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { transcripts: [] } }),
      });

      const result = await service.validateApiKey('valid-key');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.fireflies.ai/graphql',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-key',
          },
        }),
      );
    });

    it('returns false when the API responds with an error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await service.validateApiKey('invalid-key');

      expect(result).toBe(false);
    });

    it('returns false when the API returns GraphQL errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Invalid API key' }],
        }),
      });

      const result = await service.validateApiKey('bad-key');

      expect(result).toBe(false);
    });
  });

  describe('listMeetings', () => {
    const mockTranscriptsResponse = {
      data: {
        transcripts: [
          {
            id: 'transcript-1',
            title: 'Weekly 1-1',
            date: '2026-06-01T10:00:00.000Z',
            duration: 1800,
            participants: ['alice@example.com', 'bob@example.com'],
            host_email: 'alice@example.com',
            transcript_url: 'https://app.fireflies.ai/view/transcript-1',
          },
          {
            id: 'transcript-2',
            title: 'Sprint Planning',
            date: '2026-06-02T14:00:00.000Z',
            duration: 3600,
            participants: ['alice@example.com', 'charlie@example.com'],
            host_email: 'alice@example.com',
            transcript_url: null,
          },
        ],
      },
    };

    it('returns a list of meetings with normalised fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranscriptsResponse,
      });

      const result = await service.listMeetings('api-key', {
        limit: 20,
        skip: 0,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<FirefliesMeeting>({
        id: 'transcript-1',
        title: 'Weekly 1-1',
        date: '2026-06-01T10:00:00.000Z',
        duration: 1800,
        participants: ['alice@example.com', 'bob@example.com'],
        hostEmail: 'alice@example.com',
        transcriptUrl: 'https://app.fireflies.ai/view/transcript-1',
      });
    });

    it('passes pagination and date filter options in the query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { transcripts: [] } }),
      });

      await service.listMeetings('api-key', {
        limit: 10,
        skip: 20,
        fromDate: '2026-01-01T00:00:00.000Z',
      });

      const [, requestInit] = mockFetch.mock.calls[0];
      const body = JSON.parse(requestInit.body as string);

      expect(body.variables).toEqual(
        expect.objectContaining({
          limit: 10,
          skip: 20,
          fromDate: '2026-01-01T00:00:00.000Z',
        }),
      );
    });

    it('throws an HttpException with 429 status when rate limited', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(
        service.listMeetings('api-key', {}),
      ).rejects.toThrow('Fireflies API rate limit exceeded');
    });

    it('throws an error when the API responds with other non-OK status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        service.listMeetings('api-key', {}),
      ).rejects.toThrow('Fireflies API error: 500 Internal Server Error');
    });

    it('throws an error when the response contains GraphQL errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Rate limit exceeded' }],
        }),
      });

      await expect(
        service.listMeetings('api-key', {}),
      ).rejects.toThrow('Fireflies API error: Rate limit exceeded');
    });
  });

  describe('getTranscript', () => {
    const mockTranscriptResponse = {
      data: {
        transcript: {
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
              speaker_name: 'Alice Smith',
              speaker_id: 'speaker-1',
              text: 'Hello, how are things going?',
              raw_text: 'Hello, how are things going?',
              start_time: 5.0,
              end_time: 8.5,
            },
            {
              index: 1,
              speaker_name: 'Bob Jones',
              speaker_id: 'speaker-2',
              text: 'Pretty good! I wanted to discuss the timeline.',
              raw_text: 'Pretty good! I wanted to discuss the timeline.',
              start_time: 9.0,
              end_time: 13.2,
            },
          ],
          summary: {
            keywords: ['timeline', 'project'],
            action_items: '**Alice**\nFollow up on timeline (00:15:00)',
            overview: 'Discussion about project timeline.',
            short_summary: 'Quick chat about timelines.',
          },
          meeting_attendees: [
            { displayName: 'Alice Smith', email: 'alice@example.com' },
            { displayName: 'Bob Jones', email: 'bob@example.com' },
          ],
          transcript_url: 'https://app.fireflies.ai/view/transcript-1',
        },
      },
    };

    it('returns a normalised transcript with sentences and summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranscriptResponse,
      });

      const result = await service.getTranscript('api-key', 'transcript-1');

      expect(result).toEqual<FirefliesTranscript>({
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
        ],
        summary: {
          keywords: ['timeline', 'project'],
          actionItems: '**Alice**\nFollow up on timeline (00:15:00)',
          overview: 'Discussion about project timeline.',
          shortSummary: 'Quick chat about timelines.',
        },
        participants: ['Alice Smith', 'Bob Jones'],
        transcriptUrl: 'https://app.fireflies.ai/view/transcript-1',
      });
    });

    it('returns null summary when the API provides no summary data', async () => {
      const responseWithoutSummary = {
        data: {
          transcript: {
            ...mockTranscriptResponse.data.transcript,
            summary: null,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutSummary,
      });

      const result = await service.getTranscript('api-key', 'transcript-1');

      expect(result.summary).toBeNull();
    });

    it('throws an error when the transcript is not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { transcript: null },
        }),
      });

      await expect(
        service.getTranscript('api-key', 'nonexistent'),
      ).rejects.toThrow('Transcript not found: nonexistent');
    });

    it('throws an error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        service.getTranscript('api-key', 'transcript-1'),
      ).rejects.toThrow('Fireflies API error: 500 Internal Server Error');
    });

    it('passes action_items string through as-is', async () => {
      const responseWithStringItems = {
        data: {
          transcript: {
            ...mockTranscriptResponse.data.transcript,
            summary: {
              ...mockTranscriptResponse.data.transcript.summary,
              action_items:
                '**Gareth Hughes**\nShare updated timeline (08:05)\n\n**Ciaran McKeown**\nLead technical discussions (08:20)',
              keywords: ['timeline', 'chemicals'],
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithStringItems,
      });

      const result = await service.getTranscript('api-key', 'transcript-1');

      expect(result.summary!.actionItems).toContain('**Gareth Hughes**');
      expect(result.summary!.actionItems).toContain('Share updated timeline (08:05)');
      expect(result.summary!.keywords).toEqual(['timeline', 'chemicals']);
    });
  });
});
