import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import type {
  FirefliesMeeting,
  FirefliesTranscript,
  FirefliesSentence,
  FirefliesSummary,
  ListMeetingsOptions,
} from './fireflies.types';

const FIREFLIES_API_URL = 'https://api.fireflies.ai/graphql';

const LIST_TRANSCRIPTS_QUERY = `
  query ListTranscripts($limit: Int, $skip: Int, $fromDate: DateTime, $toDate: DateTime) {
    transcripts(limit: $limit, skip: $skip, fromDate: $fromDate, toDate: $toDate) {
      id
      title
      date
      duration
      participants
      host_email
      transcript_url
    }
  }
`;

const GET_TRANSCRIPT_QUERY = `
  query GetTranscript($id: String!) {
    transcript(id: $id) {
      id
      title
      date
      duration
      speakers {
        id
        name
      }
      sentences {
        index
        speaker_name
        speaker_id
        text
        raw_text
        start_time
        end_time
      }
      summary {
        keywords
        action_items
        overview
        short_summary
      }
      meeting_attendees {
        displayName
        email
      }
      transcript_url
    }
  }
`;

const VALIDATE_KEY_QUERY = `
  query ValidateKey {
    transcripts(limit: 1) {
      id
    }
  }
`;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

@Injectable()
export class FirefliesService {
  private readonly logger = new Logger(FirefliesService.name);

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await this.executeQuery(apiKey, VALIDATE_KEY_QUERY);

      if (response.status === 429) {
        throw new HttpException(
          'Fireflies API rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (!response.ok) {
        return false;
      }

      const body = (await response.json()) as GraphQLResponse<unknown>;

      if (body.errors) {
        return false;
      }

      return true;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      return false;
    }
  }

  async listMeetings(
    apiKey: string,
    options: ListMeetingsOptions,
  ): Promise<FirefliesMeeting[]> {
    const variables: Record<string, unknown> = {};
    if (options.limit !== undefined) variables.limit = options.limit;
    if (options.skip !== undefined) variables.skip = options.skip;
    if (options.fromDate) variables.fromDate = options.fromDate;
    if (options.toDate) variables.toDate = options.toDate;

    const response = await this.executeQuery(
      apiKey,
      LIST_TRANSCRIPTS_QUERY,
      variables,
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new HttpException(
          'Fireflies API rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new Error(
        `Fireflies API error: ${response.status.toString()} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as GraphQLResponse<{
      transcripts: Array<{
        id: string;
        title: string;
        date: string;
        duration: number;
        participants: string[];
        host_email: string;
        transcript_url: string | null;
      }>;
    }>;

    if (body.errors?.length) {
      throw new Error(`Fireflies API error: ${body.errors[0].message}`);
    }

    const transcripts = body.data?.transcripts ?? [];

    return transcripts.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.date,
      duration: t.duration,
      participants: t.participants,
      hostEmail: t.host_email,
      transcriptUrl: t.transcript_url,
    }));
  }

  async getTranscript(
    apiKey: string,
    transcriptId: string,
  ): Promise<FirefliesTranscript> {
    const response = await this.executeQuery(apiKey, GET_TRANSCRIPT_QUERY, {
      id: transcriptId,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new HttpException(
          'Fireflies API rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new Error(
        `Fireflies API error: ${response.status.toString()} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as GraphQLResponse<{
      transcript: {
        id: string;
        title: string;
        date: string;
        duration: number;
        speakers: Array<{ id: string; name: string }>;
        sentences: Array<{
          index: number;
          speaker_name: string;
          speaker_id: string;
          text: string;
          raw_text: string;
          start_time: number;
          end_time: number;
        }>;
        summary: {
          keywords: string[];
          action_items: string;
          overview: string;
          short_summary: string;
        } | null;
        meeting_attendees: Array<{ displayName: string; email: string }>;
        transcript_url: string | null;
      } | null;
    }>;

    if (body.errors?.length) {
      throw new Error(`Fireflies API error: ${body.errors[0].message}`);
    }

    const transcript = body.data?.transcript;

    if (!transcript) {
      throw new Error(`Transcript not found: ${transcriptId}`);
    }

    const sentences: FirefliesSentence[] = transcript.sentences.map((s) => ({
      index: s.index,
      speakerName: s.speaker_name,
      speakerId: s.speaker_id,
      text: s.text,
      rawText: s.raw_text,
      startTime: s.start_time,
      endTime: s.end_time,
    }));

    const summary: FirefliesSummary | null = transcript.summary
      ? {
          keywords: Array.isArray(transcript.summary.keywords)
            ? transcript.summary.keywords
            : [],
          actionItems: transcript.summary.action_items || '',
          overview: transcript.summary.overview || '',
          shortSummary: transcript.summary.short_summary || '',
        }
      : null;

    const participants = transcript.meeting_attendees.map((a) => a.displayName);

    this.logger.log({
      msg: 'Fireflies transcript fetched',
      transcriptId,
      title: transcript.title,
      sentenceCount: sentences.length,
    });

    return {
      id: transcript.id,
      title: transcript.title,
      date: transcript.date,
      duration: transcript.duration,
      speakers: transcript.speakers,
      sentences,
      summary,
      participants,
      transcriptUrl: transcript.transcript_url,
    };
  }

  private async executeQuery(
    apiKey: string,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<Response> {
    return fetch(FIREFLIES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });
  }
}
