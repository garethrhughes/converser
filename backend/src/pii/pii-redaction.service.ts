import { Injectable } from '@nestjs/common';
import { scan } from 'pii-detect';
import type { PiiCategory, RedactionEntry, RedactionResult } from './pii.types';

const REDACTION_MARKER = '[REDACTED]';

/**
 * UK National Insurance Number: 2 letters + 6 digits + 1 suffix letter (A-D).
 * Broadly matched to avoid missing valid formats; errs on side of redaction.
 */
const UK_NI_REGEX = /\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi;

/**
 * Australian Tax File Number: 9 digits with optional spaces (XXX XXX XXX).
 * Must be preceded by context keywords to reduce false positives.
 */
const AU_TFN_REGEX =
  /(?:TFN|tax\s*file\s*number)[:\s]*(\d{3}\s?\d{3}\s?\d{3})\b/gi;

/**
 * Physical/mailing address heuristic: number + street name + suffix.
 * Matches patterns like "123 Main Street" or "45A Baker Rd, London SW1A 1AA".
 */
const ADDRESS_REGEX =
  /\b\d{1,5}[A-Za-z]?\s+[A-Z][a-zA-Z']+(?:\s+[A-Z][a-zA-Z']+)*\s+(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Crescent|Cres|Terrace|Tce|Close|Cl|Circle|Cir|Highway|Hwy)\b[^.\n]{0,60}/gi;

/** Map pii-detect categories to our PiiCategory type. */
function mapCategory(piiDetectCategory: string): PiiCategory {
  switch (piiDetectCategory) {
    case 'email':
      return 'email';
    case 'phone':
      return 'phone';
    case 'credit-card':
      return 'credit-card';
    case 'ssn':
      return 'ssn';
    case 'date-of-birth':
      return 'date-of-birth';
    default:
      return 'national-id';
  }
}

@Injectable()
export class PiiRedactionService {
  redact(text: string): RedactionResult {
    const redactions: RedactionEntry[] = [];
    let content = text;

    // 1. Run pii-detect scan for core PII types
    const scanResult = scan(content);
    if (scanResult.found) {
      // Process findings from end to start to preserve indices
      const sortedFindings = [...scanResult.findings].sort(
        (a, b) => b.index - a.index,
      );
      for (const finding of sortedFindings) {
        content =
          content.slice(0, finding.index) +
          REDACTION_MARKER +
          content.slice(finding.index + finding.length);
        redactions.push({
          category: mapCategory(finding.category),
          index: finding.index,
          length: finding.length,
        });
      }
    }

    // 2. Run custom patterns for types not covered by pii-detect
    content = this.applyCustomPattern(
      content,
      UK_NI_REGEX,
      'national-id',
      redactions,
    );
    content = this.applyCustomPattern(
      content,
      AU_TFN_REGEX,
      'national-id',
      redactions,
      1, // capture group index
    );
    content = this.applyCustomPattern(
      content,
      ADDRESS_REGEX,
      'address',
      redactions,
    );

    const summary = this.buildSummary(redactions);

    return {
      content,
      redacted: redactions.length > 0,
      redactions,
      summary,
    };
  }

  private applyCustomPattern(
    text: string,
    pattern: RegExp,
    category: PiiCategory,
    redactions: RedactionEntry[],
    captureGroup?: number,
  ): string {
    // Reset regex state
    pattern.lastIndex = 0;

    let result = text;
    let match: RegExpExecArray | null;
    const matches: Array<{ index: number; length: number }> = [];

    while ((match = pattern.exec(text)) !== null) {
      const matchText =
        captureGroup !== undefined ? match[captureGroup] : match[0];
      const matchIndex =
        captureGroup !== undefined
          ? match.index + match[0].indexOf(matchText)
          : match.index;

      // Skip if already redacted at this position
      if (matchText && !matchText.includes(REDACTION_MARKER)) {
        matches.push({ index: matchIndex, length: matchText.length });
      }
    }

    // Apply from end to start
    for (const m of matches.sort((a, b) => b.index - a.index)) {
      result =
        result.slice(0, m.index) +
        REDACTION_MARKER +
        result.slice(m.index + m.length);
      redactions.push({
        category,
        index: m.index,
        length: m.length,
      });
    }

    return result;
  }

  private buildSummary(
    redactions: RedactionEntry[],
  ): Record<PiiCategory, number> {
    const summary: Record<PiiCategory, number> = {
      email: 0,
      phone: 0,
      'credit-card': 0,
      ssn: 0,
      'national-id': 0,
      'date-of-birth': 0,
      address: 0,
    };

    for (const r of redactions) {
      summary[r.category]++;
    }

    return summary;
  }
}
