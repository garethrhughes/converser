'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  Person,
  Conversation,
  ConversationSection,
  Context,
  Agent,
  Report,
  GenerateReportRequest,
} from '@/types';

type WorkflowStep =
  | 'person'
  | 'conversation'
  | 'section'
  | 'contexts'
  | 'agent'
  | 'confirm'
  | 'result';

export function AnalysisWorkflow() {
  const [step, setStep] = useState<WorkflowStep>('person');
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Data
  const [people, setPeople] = useState<Person[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Selections
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedSection, setSelectedSection] = useState<ConversationSection | null>(null);
  const [selectedContexts, setSelectedContexts] = useState<Context[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Result
  const [report, setReport] = useState<Report | null>(null);

  // Load people on mount
  useEffect(() => {
    api.get<Person[]>('/people').then(setPeople).catch((err) => setError(err.message));
  }, []);

  const handleSelectPerson = useCallback(async (person: Person) => {
    setSelectedPerson(person);
    setError(null);
    try {
      const convs = await api.get<Conversation[]>(`/conversations?personId=${person.id}`);
      setConversations(convs);
      setStep('conversation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    }
  }, []);

  const handleSelectConversation = useCallback(async (conversation: Conversation) => {
    setError(null);
    try {
      // Load full conversation with sections
      const full = await api.get<Conversation>(`/conversations/${conversation.id}`);
      setSelectedConversation(full);

      if (full.sections && full.sections.length === 1) {
        // Auto-select single section
        setSelectedSection(full.sections[0]);
        // Load contexts for next step
        const ctxs = await api.get<Context[]>('/contexts');
        setContexts(ctxs);
        setStep('contexts');
      } else if (full.sections && full.sections.length > 1) {
        setStep('section');
      } else {
        setError('Conversation has no sections');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    }
  }, []);

  const handleSelectSection = useCallback(async (section: ConversationSection) => {
    setSelectedSection(section);
    setError(null);
    try {
      const ctxs = await api.get<Context[]>('/contexts');
      setContexts(ctxs);
      setStep('contexts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contexts');
    }
  }, []);

  const handleContextsConfirm = useCallback(async () => {
    setError(null);
    try {
      const agts = await api.get<Agent[]>('/agents');
      setAgents(agts);
      setStep('agent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    }
  }, []);

  const handleSelectAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setStep('confirm');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedPerson || !selectedConversation || !selectedSection || !selectedAgent) return;

    setGenerating(true);
    setError(null);
    try {
      const request: GenerateReportRequest = {
        personId: selectedPerson.id,
        conversationId: selectedConversation.id,
        sectionId: selectedSection.id,
        contextIds: selectedContexts.map((c) => c.id),
        agentId: selectedAgent.id,
      };

      const result = await api.post<Report>('/reports/generate', request);
      setReport(result);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }, [selectedPerson, selectedConversation, selectedSection, selectedContexts, selectedAgent]);

  const handleReset = useCallback(() => {
    setStep('person');
    setSelectedPerson(null);
    setSelectedConversation(null);
    setSelectedSection(null);
    setSelectedContexts([]);
    setSelectedAgent(null);
    setReport(null);
    setError(null);
  }, []);

  const handleBack = useCallback(() => {
    switch (step) {
      case 'conversation':
        setSelectedPerson(null);
        setStep('person');
        break;
      case 'section':
        setSelectedConversation(null);
        setStep('conversation');
        break;
      case 'contexts':
        setSelectedSection(null);
        if (selectedConversation?.sections && selectedConversation.sections.length > 1) {
          setStep('section');
        } else {
          setSelectedConversation(null);
          setStep('conversation');
        }
        break;
      case 'agent':
        setSelectedContexts([]);
        setStep('contexts');
        break;
      case 'confirm':
        setSelectedAgent(null);
        setStep('agent');
        break;
    }
  }, [step, selectedConversation]);

  const toggleContext = useCallback((ctx: Context) => {
    setSelectedContexts((prev) =>
      prev.some((c) => c.id === ctx.id)
        ? prev.filter((c) => c.id !== ctx.id)
        : [...prev, ctx],
    );
  }, []);

  const steps: WorkflowStep[] = ['person', 'conversation', 'section', 'contexts', 'agent', 'confirm', 'result'];
  const stepLabels: Record<WorkflowStep, string> = {
    person: 'Person',
    conversation: 'Conversation',
    section: 'Section',
    contexts: 'Contexts',
    agent: 'Agent',
    confirm: 'Confirm',
    result: 'Report',
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-4xl mx-auto py-8 px-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {steps.map((s, i) => {
          // Skip section step indicator if conversation has only 1 section
          if (
            s === 'section' &&
            selectedConversation?.sections &&
            selectedConversation.sections.length <= 1
          ) {
            return null;
          }
          const currentIndex = steps.indexOf(step);
          const isActive = s === step;
          const isPast = steps.indexOf(s) < currentIndex;

          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-4 h-px bg-zinc-300 dark:bg-zinc-600" />}
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : isPast
                      ? 'text-text-muted'
                      : 'text-text-faint'
                }`}
              >
                {stepLabels[s]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Step content */}
      {step === 'person' && (
        <StepContainer title="Select a Person" subtitle="Who is this analysis about?">
          {people.length === 0 ? (
            <p className="text-text-muted">
              No people found. Create a person first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {people.map((person) => (
                <button
                  key={person.id}
                  onClick={() => handleSelectPerson(person)}
                  className="text-left rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md "
                >
                  <p className="font-medium text-text-primary">{person.name}</p>
                  {person.description && (
                    <p className="text-sm text-text-muted mt-1 line-clamp-2">
                      {person.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </StepContainer>
      )}

      {step === 'conversation' && (
        <StepContainer
          title="Select a Conversation"
          subtitle={`Conversations for ${selectedPerson?.name}`}
          onBack={handleBack}
        >
          {conversations.length === 0 ? (
            <p className="text-text-muted">
              No conversations found for this person.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className="text-left rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md "
                >
                  <p className="font-medium text-text-primary">{conv.title}</p>
                  <p className="text-xs text-text-muted mt-1">
                    Imported {new Date(conv.importedAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </StepContainer>
      )}

      {step === 'section' && selectedConversation?.sections && (
        <StepContainer
          title="Select a Section"
          subtitle={`${selectedConversation.title} has multiple tabs`}
          onBack={handleBack}
        >
          <div className="flex flex-col gap-2">
            {selectedConversation.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSelectSection(section)}
                className="text-left rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md "
              >
                <p className="font-medium text-text-primary">{section.title}</p>
                <p className="text-xs text-text-muted mt-1">
                  {section.content.length > 100
                    ? section.content.substring(0, 100) + '...'
                    : section.content}
                </p>
              </button>
            ))}
          </div>
        </StepContainer>
      )}

      {step === 'contexts' && (
        <StepContainer
          title="Select Context(s)"
          subtitle="Choose background context to include (optional)"
          onBack={handleBack}
        >
          {contexts.length === 0 ? (
            <p className="text-text-muted mb-4">
              No contexts available. You can proceed without any.
            </p>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {contexts.map((ctx) => {
                const isSelected = selectedContexts.some((c) => c.id === ctx.id);
                return (
                  <button
                    key={ctx.id}
                    onClick={() => toggleContext(ctx)}
                    className={`text-left border rounded-lg p-4 transition-all ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
                        : 'border-border hover:border-blue-300 '
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-border'
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <p className="font-medium text-text-primary">{ctx.name}</p>
                    </div>
                    {ctx.description && (
                      <p className="text-sm text-text-muted mt-1 ml-6">
                        {ctx.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={handleContextsConfirm}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Continue{selectedContexts.length > 0 ? ` with ${selectedContexts.length} context(s)` : ' without contexts'}
          </button>
        </StepContainer>
      )}

      {step === 'agent' && (
        <StepContainer
          title="Select an Agent"
          subtitle="Choose which agent's instructions to use"
          onBack={handleBack}
        >
          {agents.length === 0 ? (
            <p className="text-text-muted">
              No agents found. Create an agent first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className="text-left rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md "
                >
                  <p className="font-medium text-text-primary">{agent.name}</p>
                  {agent.description && (
                    <p className="text-sm text-text-muted mt-1 line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                  {agent.isDefault && (
                    <span className="inline-block mt-2 text-xs bg-surface-alt text-text-secondary px-2 py-0.5 rounded bg-surface-alt ">
                      Default
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </StepContainer>
      )}

      {step === 'confirm' && (
        <StepContainer
          title="Confirm & Generate"
          subtitle="Review your selections before generating the report"
          onBack={handleBack}
        >
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm mb-6 ">
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase">Person</dt>
                <dd className="text-text-primary">{selectedPerson?.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase">Conversation</dt>
                <dd className="text-text-primary">{selectedConversation?.title}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase">Section</dt>
                <dd className="text-text-primary">{selectedSection?.title}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase">Contexts</dt>
                <dd className="text-text-primary">
                  {selectedContexts.length > 0
                    ? selectedContexts.map((c) => c.name).join(', ')
                    : 'None'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase">Agent</dt>
                <dd className="text-text-primary">{selectedAgent?.name}</dd>
              </div>
            </dl>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </StepContainer>
      )}

      {step === 'result' && report && (
        <StepContainer title={report.title} subtitle="Report generated successfully">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm mb-6 ">
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{report.content}</Markdown>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/reports/${report.id}`}
              className="px-4 py-2 bg-primary text-primary-fg rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
            >
              View Report
            </Link>
            {selectedPerson && (
              <Link
                href={`/people/${selectedPerson.id}`}
                className="px-4 py-2 text-sm font-medium text-text-tertiary border border-border rounded-lg transition-colors hover:bg-surface-raised hover:text-text-primary hover:border-squirrel-300"
              >
                View {selectedPerson.name}
              </Link>
            )}
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-text-tertiary border border-border rounded-lg transition-colors hover:bg-surface-raised hover:text-text-primary hover:border-squirrel-300"
            >
              Start New Analysis
            </button>
          </div>
        </StepContainer>
      )}
    </div>
  );
}

function StepContainer({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 rounded hover:bg-surface-alt dark:hover:bg-zinc-800 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          {subtitle && (
            <p className="text-sm text-text-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
