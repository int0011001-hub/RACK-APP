# TASKS.md

## Checklist
- [x] Implement compact series rendering when "Seleccionar tipo de serie" is disabled.
- [ ] QA on Android (Expo Go) – ensure series list scrolls correctly and RIR input works.
- [ ] Decide next priority (cronómetro de descanso, onboarding questionnaire, etc.).

## Session Log
**2026-09-27 03:13 UTC** – Applied pending change to `app/rutina/[id]/index.tsx`:
- Replaced always‑visible "Serie N" header with conditional rendering:
  - If `mostrarTipoSerie` **false**, show a single column header (`# | Kg | Reps | RIR`) and render all series rows compactly, numbered (`1`, `2`, … or `1.1`, `1.2` for multi‑tramo).
  - If **true**, keep existing detailed per‑serie block.
- Updated related styles (`progresoBtn`, `serieInputRir`, etc.).
- Ran `npx tsc --noEmit`; compilation succeeded with **0 errors**.

## Resume Prompt
```
Please attach the following files for continuation:
- `app/rutina/[id]/index.tsx`
- `app/rutina/[id]/editor.tsx` (if further UI tweaks are needed)
- `AGENTS.md` (to respect project rules)

Read them fully, confirm they match the repository, and then continue with the next task (e.g., QA on device or planning the cronómetro de descanso).
```
