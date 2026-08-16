# A7: Fix Model Override in Telegram

## Effort: 1 hour
## Category: Finish Half-Built

---

## Problem
`/model <name>` stores the override in `agentModelOverride` Map but it's never included in the RUN_TASK command. Agents always use their default model.

## Solution
When dispatching RUN_TASK from Telegram, check `agentModelOverride` and pass it. The CreateAgentCommand has a `model` field, but RUN_TASK doesn't. Two options:
1. Include model in the prompt prefix ("Use model: X")
2. Better: the agent session should accept a model override — but that requires orchestrator changes

Simplest: inject a model instruction in the prompt for now.

## Files to Modify
- `apps/gateway/src/telegram-channel.ts` — in the free-text handler, prepend model override to prompt

## Micro-Phases
- [ ] In the free-text RUN_TASK dispatch, check agentModelOverride
- [ ] If set, prepend: "[Model preference: {model}]\n\n" to the prompt
