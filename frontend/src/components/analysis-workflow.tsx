'use client';

import { useState, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : isPast
                      ? 'text-zinc-500 dark:text-zinc-400'
                      : 'text-zinc-400 dark:text-zinc-500'
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Step content */}
      {step === 'person' && (
        <StepContainer title="Select a Person" subtitle="Who is this analysis about?">
          {people.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              No people found. Create a person first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {people.map((person) => (
                <button
                  key={person.id}
                  onClick={() => handleSelectPerson(person)}
                  className="text-left border border-zinc-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all dark:border-zinc-700 dark:hover:border-blue-600"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{person.name}</p>
                  {person.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
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
            <p className="text-zinc-500 dark:text-zinc-400">
              No conversations found for this person.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className="text-left border border-zinc-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all dark:border-zinc-700 dark:hover:border-blue-600"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{conv.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
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
                className="text-left border border-zinc-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all dark:border-zinc-700 dark:hover:border-blue-600"
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{section.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
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
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
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
                        ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950'
                        : 'border-zinc-200 hover:border-blue-300 dark:border-zinc-700 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{ctx.name}</p>
                    </div>
                    {ctx.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 ml-6">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            <p className="text-zinc-500 dark:text-zinc-400">
              No agents found. Create an agent first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className="text-left border border-zinc-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all dark:border-zinc-700 dark:hover:border-blue-600"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{agent.name}</p>
                  {agent.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                  {agent.isDefault && (
                    <span className="inline-block mt-2 text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded dark:bg-zinc-800 dark:text-zinc-400">
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
          <div className="border border-zinc-200 rounded-lg p-4 mb-6 dark:border-zinc-700">
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Person</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">{selectedPerson?.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Conversation</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">{selectedConversation?.title}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Section</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">{selectedSection?.title}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Contexts</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {selectedContexts.length > 0
                    ? selectedContexts.map((c) => c.name).join(', ')
                    : 'None'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Agent</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">{selectedAgent?.name}</dd>
              </div>
            </dl>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </StepContainer>
      )}

      {step === 'result' && report && (
        <StepContainer title={report.title} subtitle="Report generated successfully">
          <div className="border border-zinc-200 rounded-lg p-6 mb-6 dark:border-zinc-700">
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{report.content}</Markdown>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-zinc-200 text-zinc-900 rounded-lg hover:bg-zinc-300 transition-colors dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
          >
            Start New Analysis
          </button>
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
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          {subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
