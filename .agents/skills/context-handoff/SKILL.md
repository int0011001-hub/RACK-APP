---
name: context-handoff
description: Maintains two persistent handoff documents for a project so a brand-new conversation can continue it with zero memory loss - ARCHITECTURE.md (overview, tech stack, environment/config, data contracts, folder structure, schema, standing rules, an append-only decisions log) and TASKS.md (a phase-by-phase checklist plus an append-only, timestamped session log of what happened, what broke, what was fixed, and what's next). Updates both in place on later runs rather than overwriting history. Use this whenever the user asks to "hand off", "wrap up", "save context", "update the docs", "create/update the project doc", wants to continue this work in a new conversation, or when the conversation is long and approaching its context limit.
compatibility: Works on claude.ai, Claude Code, and the API. In Claude Code, also reads live git history when run inside a git repository, and reads/updates existing ARCHITECTURE.md/TASKS.md in place rather than regenerating them from scratch.
---

# Context Handoff

Maintain two Markdown files that together let a brand-new conversation - with zero memory of this one - continue this project exactly where it's being left off. Precision beats brevity: these files exist specifically to preserve detail that automatic conversation summarization (e.g. `/compact`) throws away.

Two files, not one, because they change at different rates:

- **ARCHITECTURE.md** - facts that are mostly stable: overview, stack, config, rules, schema. Edited in place; grows slowly.
- **TASKS.md** - a living checklist plus an append-only session log. Grows every time this skill runs.

If the conversation covers more than one unrelated project, ask which one before writing.

## Step 0: check what already exists

Before writing anything, check whether `ARCHITECTURE.md` and `TASKS.md` already exist (project root, if you have filesystem access; otherwise ask the user to attach their current versions if they have them).

- **First run on this project:** create both files from the templates below.
- **Later run:** read the existing files first. Update ARCHITECTURE.md's changed sections in place (stack changes, new rules, current state). **Append** a new timestamped entry to TASKS.md's session log and to ARCHITECTURE.md's decisions log rather than rewriting history - never edit, delete, flatten, or relabel a past log entry, not even to add a clarifying tag like "(Session 1)"; its text stays byte-for-byte as originally written. Need to disambiguate, add context, or correct something? Do it in the new entry you're appending (e.g. "Correction, <date>: ..."), never by touching the old one. Update task checkboxes (empty to in-progress to done) in place.

## Gather ground truth first (if available)

- `git log --oneline -20`
- `git status --short`
- `git diff --stat HEAD~10` (or since the last handoff commit)

Conversation history may already have been compacted, so cross-check status/changelog against the repo rather than relying on memory alone. Skip this if there's no repo or filesystem access.

## ARCHITECTURE.md structure

1. **AI Startup Checklist** - a literal checklist the *next* Claude must confirm before writing any code: read this file and TASKS.md in full; confirm no other file/repo access exists beyond what's provided; confirm this file matches actual repo state (update it first if not); know the current branch; know the current focus (from TASKS.md).
2. **Overview** - what this is, its purpose, stack, current status.
3. **Tech Stack** - languages/frameworks, with exact pinned dependency versions where they matter.
4. **Environment & Configuration** - a table of every env var/constant: name, purpose, value or placeholder, where it's used. Anything a fresh session would otherwise waste time rediscovering. **Never write a real secret into this file** - for anything that looks like a credential (API key, token, password, connection string with embedded auth, private key), record only that it exists, where it's set (e.g. "in `.env`, not committed"), and a redacted placeholder - never the actual value, even if you can see it in the environment or a config file.
5. **Data Contracts / Interfaces** (if relevant) - exact request/response payloads, schemas, function signatures, verbatim, not paraphrased.
6. **Folder Structure** - an annotated file tree, one-line purpose per file.
7. **Database / Data Schema** (if relevant).
8. **Standing Rules** - meta-rules the user has actually stated for how Claude should behave on this project going forward (e.g. ask before updating docs, patch-style edits only, always give exact file destination paths, always give copy-pasteable git commands, never invent an unspecified value - ask instead). Only include rules the user actually stated; don't invent a generic set.
9. **Current State & Current Focus** - what's done, what's next, current branch.
10. **Decisions Log** - append-only, timestamped. One entry per decision: what was decided, why, and what alternative(s) were rejected and why.

## TASKS.md structure

1. **Phase/Task checklist** - done / in-progress / not-started per task, grouped by phase.
2. **Session Log** - append-only, timestamped, one entry per work session: what was built or fixed, exact error text and root cause for any bug, what was verified and how, and a one-line handoff note for the next session if the user is pausing here.
3. **Resume Prompt** - regenerate this each run as a short fenced code block the user can paste as the first message of the new chat: which files to attach, and an instruction to read them fully and confirm understanding before proceeding.

## Output

- Filesystem available: write/update `ARCHITECTURE.md` and `TASKS.md` in the project root (or wherever the user's existing docs live). Report only what changed this run - not a full reprint.
- No filesystem access: output both documents as separate fenced code blocks.

## What not to do

- Don't collapse history. A vague rewritten summary is what `/compact` already gives for free - these files exist to be more precise and more complete over time, not less.
- Don't invent standing rules the user never stated.
- Don't guess at unspecified values (ports, versions, names) - flag them as unconfirmed and ask, the same way the user's own workflow requires of Claude.
- Don't dump the raw chat transcript - extract and structure it into the sections above.
- Don't write real secrets (API keys, passwords, tokens, connection strings with embedded auth) into either file - see the redaction rule under Environment & Configuration.
