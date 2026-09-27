# ARCHITECTURE.md

## AI Startup Checklist
- [ ] Read the entire `ARCHITECTURE.md` and `TASKS.md` before writing code.
- [ ] Confirm repository root is `C:\Users\PC\Documents\RACK\rack-app`.
- [ ] Verify current Git branch (default `main`).
- [ ] Verify current focus from `TASKS.md` (Series‑rendering compact mode).

## Overview
RACK – app de fitness multiplataforma (Web, iOS, Android) construida con **React Native + Expo SDK 57** y **Supabase** como backend. El MVP persigue registrar series rápidamente con mínima fricción, autoguardado y actualizaciones optimistas.

## Tech Stack
- **React Native** (typescript) / **Expo SDK 57**
- **Supabase** (PostgreSQL, Row‑Level Security)
- **AsyncStorage** (client‑side persistance of UI flags)
- **react‑native‑draggable‑flatlist**, **react‑native‑svg**, **react‑native‑body‑highlighter**
- **babel**, **metro** (Expo)

## Environment & Configuration
| Variable | Purpose | Value / Placeholder |
|----------|---------|----------------------|
| `SUPABASE_URL` | Supabase endpoint | `<redacted>` (defined in `.env`) |
| `SUPABASE_ANON_KEY` | Public anon key | `<redacted>` (defined in `.env`) |
| `EXPO_PUBLIC_ACENTO` | Accent colour in UI | `#E1483C` (default) |
| `EXPO_PUBLIC_THEME` | Light/dark theme switch | `dark` (default) |
| `SHOW_TIPO_SERIE` | Flag stored in `AsyncStorage` (`mostrarTipoSerie_${rutinaId}`) que habilita el selector por serie en el editor | `true` por defecto |

*No secrets are written into este archivo.*

## Data Contracts / Interfaces
- **tabla `serie_actual**
  - `id`, `ejercicio_dia_id`, `numero_serie`, `tipo_serie ('recta' | 'multitramo')`, `rir` (nullable)
- **tabla `tramo_serie**
  - `id`, `serie_actual_id`, `orden`, `kg`, `reps`
- **tabla `rutina** (extendida) – columna `mostrar_tipo_serie` puede existir en el futuro; la UI recurre a AsyncStorage.

## Folder Structure (relevant)
```
app/
 ├─ rutina/
 │   └─ [id]/
 │       ├─ index.tsx      ← Pantalla principal de rutina (acordeón / notas)
 │       └─ editor.tsx     ← Modo editor (toggle “seleccionar tipo de serie”)
components/
 └─ BottomNav.tsx
lib/
 ├─ supabase.ts
 └─ theme.tsx
.AGENTS.md   ← Reglas de proyecto (no tocar código que funciona, minimizar fricción, etc.)
```

## Database / Data Schema
See **Supabase** tables: `profiles`, `catalogo_ejercicio`, `rutina`, `dia`, `ejercicio_dia`, `serie_actual`, `serie_historial`, `tramo_serie`, `tramo_historial`. Sólo los valores `tipo_serie` permitidos: `'recta'`, `'multitramo'`.

## Standing Rules (from `AGENTS.md`)
- No cambies código que ya funciona correctamente salvo que el usuario lo solicite.
- Preserva los patrones de diseño existentes (auto‑save, UI optimista, borrado suave).
- No introduzcas servicios de pago.
- Explica siempre los cambios en español sencillo.

## Current State & Current Focus
- **State:** El bloque de renderizado de series en `app/rutina/[id]/index.tsx` se ha reemplazado. Cuando *Seleccionar tipo de serie* está **desactivado**, las series aparecen compactas, sin encabezados “Serie N”.
- **Focus:** Verificar el comportamiento en Android (Expo Go) y decidir el siguiente objetivo (cronómetro de descanso, preguntas de onboarding, etc.).

## Decisions Log
- **2026‑09‑27 03:13 UTC:** Implementado rendering compacto de series. Se añadió el encabezado único y se renderizan las filas una debajo de otra. Se actualizaron estilos (`progresoBtn`, `serieInputRir`, etc.). Compilación sin errores (`npx tsc --noEmit`).
