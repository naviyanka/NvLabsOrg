# Plan: Markdown Rendering in Chat

## Priority: Quick Win
## Effort: Small (1-2 days)
## Category: UI/UX Improvements

---

## Problem

Agent responses contain rich markdown (headers, code blocks, lists, bold, links) but are currently rendered as plain text in the chat bubbles. This makes complex responses hard to read.

## Goal

Render agent messages as formatted markdown with:
- Headings (h1-h4)
- Code blocks with syntax highlighting
- Inline code
- Bold/italic
- Bullet and numbered lists
- Links (clickable)
- Tables (basic)

## Current State

- `MessageBubble.tsx` renders `msg.text` as raw text with basic `linkifyText()` for URL detection
- No markdown library is installed
- The terminal theme uses monospace font — rendering should respect this aesthetic

## Proposed Solution

- Add `react-markdown` + `remark-gfm` for GitHub-flavored markdown
- Add `react-syntax-highlighter` for code block highlighting (use a dark theme matching terminal aesthetic)
- Wrap agent messages in a `<ReactMarkdown>` component
- Keep user messages as plain text (they're short prompts)
- Keep system messages as plain text

## Files to Modify

1. `apps/web/package.json` — add dependencies
2. `apps/web/src/components/office/ui/MessageBubble.tsx` — render agent text as markdown
3. `apps/web/src/styles/global.css` — add markdown-specific styles (code blocks, tables)

## Micro-Phases

- [ ] Phase 1: Install dependencies (react-markdown, remark-gfm, react-syntax-highlighter)
- [ ] Phase 2: Create a `MarkdownRenderer` component with code highlighting
- [ ] Phase 3: Integrate into MessageBubble (agent messages only)
- [ ] Phase 4: Style code blocks and tables to match terminal theme
- [ ] Phase 5: Test with real agent output containing markdown

## Acceptance Criteria

- Agent messages render headings, code blocks, lists, and links
- Code blocks have syntax highlighting
- User messages and system messages remain plain text
- No hydration errors (SSR-safe)
- Performance: large messages don't lag the UI
