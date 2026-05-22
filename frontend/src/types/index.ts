export interface Person {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Conversation {
  id: string;
  title: string;
  sourceType: string;
  sourceId?: string;
  sourceUrl?: string;
  importedAt: string;
  person?: Person;
  sections?: ConversationSection[];
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Context {
  id: string;
  name: string;
  description?: string;
  content: string;
  sourceType: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  title: string;
  content: string;
  modelId: string;
  person?: Person;
  conversation?: Conversation;
  conversationSection?: ConversationSection;
  agent?: Agent;
  createdAt: string;
}

export interface GenerateReportRequest {
  personId: string;
  conversationId: string;
  sectionId?: string;
  contextIds: string[];
  agentId: string;
}

export interface MemoryItem {
  id: string;
  personId: string;
  reportId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
