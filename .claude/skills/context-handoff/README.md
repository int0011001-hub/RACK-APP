# context-handoff

An Agent Skill that maintains two persistent documents for a project - `ARCHITECTURE.md` and `TASKS.md` - so a brand-new chat session can pick the project up with zero memory loss, instead of relying on lossy automatic conversation summarization.

- **ARCHITECTURE.md** - overview, tech stack, environment/config, data contracts, folder structure, schema, standing rules, and an append-only decisions log. Edited in place; changes slowly.
- **TASKS.md** - a phase-by-phase task checklist plus an append-only, timestamped session log (what happened, what broke, what was fixed, what's next) and a ready-to-paste resume prompt for the next chat.

On later runs, it reads whatever already exists and updates/appends rather than overwriting history.

This follows the open [Agent Skills](https://agentskills.io) standard - a plain folder with a `SKILL.md` file - so it isn't tied to one product.

## Install

**Any Agent Skills-compatible tool, one command:**
```
npx skills add Devasurya05/context-handoff
```

**Manually** - copy `SKILL.md` into your tool's skills folder:
- Claude Code: `~/.claude/skills/context-handoff/SKILL.md` (personal) or `.claude/skills/context-handoff/SKILL.md` (one project)
- OpenAI Codex: `~/.codex/skills/context-handoff/SKILL.md`
- Google Antigravity: `~/.gemini/antigravity/global_skills/context-handoff/SKILL.md`
- Others (Cursor, VS Code/Copilot, Gemini CLI, etc.): check your tool's docs for its skills directory - the file itself is the same everywhere.

**claude.ai:** Settings → Capabilities → enable Code execution and file creation, then Customize → Skills → **+** → Create skill → upload the packaged `.skill` file.

## Use

Ask your agent to "hand off this project", "wrap up", "save context", or "update the docs" - Claude loads the skill automatically when it matches. You can also invoke it directly: `/context-handoff` for a manually-installed skill, or `/context-handoff:context-handoff` if installed as a Claude Code plugin from a marketplace.

## Example

**Before:** you've just spent a session wiring up FastAPI's async endpoints
to a Postgres connection pool, hit a `RuntimeError: Event loop is closed`
on the second request, tracked it down to a connection created outside the
app's lifespan, and switched to a lifespan-managed pool. The chat is about
to hit its limit.

**After running the skill**, `TASKS.md` gets a new Session Log entry:

\`\`\`markdown
### 2026-07-26 - Session 4
- Fixed `RuntimeError: Event loop is closed` on the 2nd request to `/reports`.
  Root cause: the asyncpg pool was created once at import time, outside
  FastAPI's event loop, so it died with the first loop. Fixed by creating
  the pool inside a `lifespan` context manager instead.
- Verified: 20 sequential requests to `/reports` with no error.
- Next: add a connection-pool size limit before load testing.
\`\`\`

and `ARCHITECTURE.md`'s Decision Log gets:

\`\`\`markdown
### 2026-07-26
**Decided:** create the asyncpg pool inside FastAPI's `lifespan` context
manager, not at module import time.
**Why:** the pool must be bound to the event loop FastAPI actually runs
requests on; creating it at import time binds it to a loop that closes
after the first request.
**Rejected:** a global pool re-created per-request - works, but reopening
a connection per request defeats the point of pooling.
\`\`\`

Paste both files into a brand-new chat, and it picks up from exactly this
point - no re-explaining the bug, no re-deciding the fix.

## License

MIT - see LICENSE.
