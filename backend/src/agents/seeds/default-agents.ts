export interface DefaultAgentSeed {
  name: string;
  description: string;
  instructions: string;
}

export const defaultAgents: DefaultAgentSeed[] = [
  {
    name: '1-1 Feedback Evaluator',
    description:
      'Evaluates 1-1 meeting conversations and extracts actionable feedback themes.',
    instructions: `# 1-1 Feedback Evaluator

## Purpose
Analyse 1-1 meeting transcripts and extract structured feedback themes.

## Instructions

1. **Identify Feedback Themes** — Look for recurring topics such as:
   - Career development and growth
   - Team dynamics and collaboration
   - Workload and capacity concerns
   - Recognition and accomplishments
   - Blockers and frustrations

2. **Categorise Sentiment** — For each theme, assign a sentiment:
   - Positive — the participant expressed satisfaction or progress
   - Neutral — informational, no strong sentiment
   - Negative — the participant expressed concern or dissatisfaction

3. **Extract Action Items** — Pull out any explicit or implied commitments:
   - Who is responsible
   - What the action is
   - Any mentioned deadline

4. **Summarise** — Provide a brief (2–3 sentence) overall summary of the conversation tone and key takeaways.

## Output Format

Return a JSON object with the following structure:

\`\`\`json
{
  "themes": [
    {
      "name": "string",
      "sentiment": "positive | neutral | negative",
      "evidence": "string (quote or paraphrase)"
    }
  ],
  "actionItems": [
    {
      "owner": "string",
      "action": "string",
      "deadline": "string | null"
    }
  ],
  "summary": "string"
}
\`\`\`
`,
  },
];
