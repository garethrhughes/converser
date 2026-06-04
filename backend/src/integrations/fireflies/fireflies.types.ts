export interface FirefliesMeeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  hostEmail: string;
  transcriptUrl: string | null;
}

export interface FirefliesSpeaker {
  id: string;
  name: string;
}

export interface FirefliesSentence {
  index: number;
  speakerName: string;
  speakerId: string;
  text: string;
  rawText: string;
  startTime: number;
  endTime: number;
}

export interface FirefliesSummary {
  keywords: string[];
  actionItems: string;
  overview: string;
  shortSummary: string;
}

export interface FirefliesTranscript {
  id: string;
  title: string;
  date: string;
  duration: number;
  speakers: FirefliesSpeaker[];
  sentences: FirefliesSentence[];
  summary: FirefliesSummary | null;
  participants: string[];
  transcriptUrl: string | null;
}

export interface ListMeetingsOptions {
  limit?: number;
  skip?: number;
  fromDate?: string;
  toDate?: string;
}
