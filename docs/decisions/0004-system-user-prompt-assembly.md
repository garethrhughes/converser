# 0004 — System/User Prompt Assembly Pattern

**Date:** 2026-05-22
**Status:** Accepted
**Deciders:** Architect Agent, Developer
**Proposal:** docs/proposals/0004-conversation-analysis-workflow.md

## Context

When invoking Bedrock to analyse a conversation, the system needs to structure the prompt. Claude supports system messages and user messages.

## Options Considered

### Option A — Everything in User Message

Concatenate instructions, contexts, memory, and conversation content into a single user message. Simple but loses the semantic separation Claude is designed for.

### Option B — Instructions in System, Conversation in User

Place agent instructions in the system prompt and conversation content in the user message. Contexts and memory would be appended to one or the other.

### Option C — Instructions + Contexts + Memory in System, Conversation in User

System prompt contains agent instructions, contexts (reference material), and person memory. User message contains only the conversation content to analyse.

## Decision

System prompt = agent instructions + contexts + memory. User message = conversation content.

## Rationale

Maps cleanly to Claude's system/user paradigm — system defines role and reference material, user provides the input to analyse. Keeps concerns separated.

## Consequences

- **Positive:** Clear separation of concerns, easy to extend with new context types, matches Claude's intended usage pattern.
- **Negative / trade-offs:** System prompt grows with contexts and memory (token budget concern).
- **Risks:** Large memory + many contexts could exceed context window. Will need token budgeting or truncation strategy as usage scales.
