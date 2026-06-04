import { PiiRedactionService } from './pii-redaction.service';

describe('PiiRedactionService', () => {
  let service: PiiRedactionService;

  beforeEach(() => {
    service = new PiiRedactionService();
  });

  describe('redact', () => {
    it('returns content unchanged when no PII is detected', () => {
      const input = 'This is a normal meeting about project timelines.';

      const result = service.redact(input);

      expect(result.content).toBe(input);
      expect(result.redacted).toBe(false);
      expect(result.redactions).toHaveLength(0);
    });

    it('redacts email addresses', () => {
      const input = 'Please contact john.smith@example.com for details.';

      const result = service.redact(input);

      expect(result.content).toBe(
        'Please contact [REDACTED] for details.',
      );
      expect(result.redacted).toBe(true);
      expect(result.summary.email).toBe(1);
    });

    it('redacts multiple email addresses', () => {
      const input =
        'Send to alice@corp.co and bob@example.org for the update.';

      const result = service.redact(input);

      expect(result.content).not.toContain('alice@corp.co');
      expect(result.content).not.toContain('bob@example.org');
      expect(result.summary.email).toBe(2);
    });

    it('redacts phone numbers in international format', () => {
      const input = 'Call me on +61 400 123 456 or +44 7700 900000.';

      const result = service.redact(input);

      expect(result.content).not.toContain('+61 400 123 456');
      expect(result.content).not.toContain('+44 7700 900000');
      expect(result.redacted).toBe(true);
      expect(result.summary.phone).toBeGreaterThanOrEqual(2);
    });

    it('redacts US Social Security Numbers', () => {
      const input = 'My SSN is 123-45-6789.';

      const result = service.redact(input);

      expect(result.content).toBe('My SSN is [REDACTED].');
      expect(result.summary.ssn).toBe(1);
    });

    it('redacts credit card numbers', () => {
      const input = 'Card number: 4111-1111-1111-1111 on file.';

      const result = service.redact(input);

      expect(result.content).not.toContain('4111-1111-1111-1111');
      expect(result.redacted).toBe(true);
      expect(result.summary['credit-card']).toBe(1);
    });

    it('redacts dates of birth with context keywords', () => {
      const input = 'She was born 1990-03-15 in London.';

      const result = service.redact(input);

      expect(result.content).not.toContain('1990-03-15');
      expect(result.redacted).toBe(true);
      expect(result.summary['date-of-birth']).toBe(1);
    });

    it('redacts UK National Insurance numbers', () => {
      const input = 'NI number: QQ 12 34 56 C for the record.';

      const result = service.redact(input);

      expect(result.content).not.toContain('QQ 12 34 56 C');
      expect(result.redacted).toBe(true);
      expect(result.summary['national-id']).toBe(1);
    });

    it('redacts UK NI numbers without spaces', () => {
      const input = 'NI: QQ123456C is registered.';

      const result = service.redact(input);

      expect(result.content).not.toContain('QQ123456C');
      expect(result.redacted).toBe(true);
    });

    it('redacts Australian Tax File Numbers', () => {
      const input = 'TFN: 123 456 789 on file.';

      const result = service.redact(input);

      expect(result.content).not.toContain('123 456 789');
      expect(result.redacted).toBe(true);
      expect(result.summary['national-id']).toBe(1);
    });

    it('redacts multiple PII types in the same text', () => {
      const input =
        'Email john@test.com, SSN 123-45-6789, born 1985-06-20.';

      const result = service.redact(input);

      expect(result.content).not.toContain('john@test.com');
      expect(result.content).not.toContain('123-45-6789');
      expect(result.content).not.toContain('1985-06-20');
      expect(result.redacted).toBe(true);
      expect(result.redactions.length).toBeGreaterThanOrEqual(3);
    });

    it('does not redact participant/speaker names', () => {
      const input =
        '**Alice Smith** (00:01:05)\nHello, nice to meet you.\n\n**Bob Jones** (00:01:10)\nLikewise!';

      const result = service.redact(input);

      expect(result.content).toContain('Alice Smith');
      expect(result.content).toContain('Bob Jones');
    });

    it('provides a summary with counts per category', () => {
      const input =
        'Contact alice@example.com or bob@test.org. Card: 4111-1111-1111-1111.';

      const result = service.redact(input);

      expect(result.summary.email).toBe(2);
      expect(result.summary['credit-card']).toBe(1);
    });
  });
});
