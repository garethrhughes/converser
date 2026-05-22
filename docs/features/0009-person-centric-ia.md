# 0009 — Person-Centric Information Architecture

**Date:** 2026-05-22
**Status:** In Progress
**Source:** Manual
**Related proposal:** *(none — UI restructure only, no schema/infra/security changes)*

## Summary

Restructure the frontend information architecture to be person-centric. People are the primary organising concept — conversations, reports, and memories all belong to a person. The navigation and page structure should reflect this relationship rather than treating every entity as a flat, equal peer.

## Background / Motivation

An assessment of the current implementation identified these problems:

1. **No person-centric view** — can't see a person's conversations, reports, and memory in one place. The user must jump between 3 separate pages.
2. **Reports disconnected from source** — can't navigate from report → conversation → person. Entity names are plain text, not links.
3. **Home workflow is a dead end** — after generating a report, the result displays inline but doesn't link to the persisted `/reports/{id}` page.
4. **Configuration clutters the nav** — Agents and Contexts are setup-once/edit-rarely items but have the same visual weight as daily-use sections.
5. **Flat hierarchy** — every entity is top-level in the sidebar; nothing expresses that conversations and reports *belong to* people.
6. **Inline SVGs violate STYLE_GUIDE.md** — multiple pages use hand-rolled SVG icons instead of lucide-react.

## Scope

**In scope**
- Replace person edit page with a tabbed Person Hub (Overview, Conversations, Reports, Memory)
- Add cross-entity navigation links (person, agent, conversation names become clickable)
- Fix post-generation dead end (add "View Report" link after generation)
- Restructure sidebar: rename Home to "Analyse", add visual separator before settings (Agents, Contexts)
- Add person filter to reports list page
- Replace remaining inline SVGs with lucide-react icons

**Out of scope**
- Backend API changes (no new endpoints needed — all data already available)
- Search or pagination (future enhancement)
- Server Components migration (separate refactor)
- N+1 query fix for memory counts (backend change, separate ticket)

## Acceptance Criteria

- `/people/{id}` displays a tabbed hub with Overview, Conversations, Reports, and Memory tabs
- Conversations tab shows conversations linked to this person (fetched via `?personId=`)
- Reports tab shows reports for this person (fetched via `GET /reports/person/{id}`)
- Memory tab shows the existing memory management UI
- Overview tab shows the edit form (name, description)
- Cross-entity links: person names in reports/conversations link to `/people/{id}`
- Cross-entity links: agent names in reports link to `/agents/{id}`
- Cross-entity links: conversation titles in reports link to `/conversations/{id}`
- After generating a report on the home page, a "View Report" link navigates to `/reports/{id}`
- Sidebar separates core navigation from settings with a visual divider
- Sidebar renames "Home" to "Analyse"
- Reports page has a person filter (dropdown) alongside the existing agent filter
- No remaining inline SVGs — all icons use lucide-react

## Open Questions

None.

## Notes

- This is a pure frontend restructure. No database schema, API, or infrastructure changes required.
- All data is already available via existing endpoints — this is a presentation/navigation improvement only.
- The Person Hub will make N+1 calls for the current tab's data, but lazy-loading per tab is acceptable.
- Skipping the full proposal cycle (Step 1) since this is a UI-only change with no architecture, schema, infra, or security impact.
