export type PiiCategory =
  | 'email'
  | 'phone'
  | 'credit-card'
  | 'ssn'
  | 'national-id'
  | 'date-of-birth'
  | 'address';

export interface RedactionEntry {
  category: PiiCategory;
  index: number;
  length: number;
}

export interface RedactionResult {
  content: string;
  redacted: boolean;
  redactions: RedactionEntry[];
  summary: Record<PiiCategory, number>;
}
