# AmatBookshelf Frontend Status

Updated: 2026-05-06

This repository is the Next.js frontend for AmatBookshelf. It now covers both the manager workflow and a much richer reader/member experience tied to cycles, session content, rankings, and historical participation.

## Current Scope

- Auth and access:
  - Google callback handling
  - Dev-login fallback wiring
  - Shared API client/auth helpers
- Member experience:
  - `/m`
  - `/m/login`
  - `/m/ledger`
  - `/m/history`
  - `/m/rank`
  - `/m/cycles/[cycleId]`
  - `/m/cycles/[cycleId]/sessions`
  - `/m/cycles/[cycleId]/sessions/[sessionId]`
  - `/m/cycles/[cycleId]/ledger`
  - `/m/cycles/[cycleId]/rank`
  - Existing QR scan/result flow remains present
- Manager experience:
  - `/manage`
  - Cycle creation/editing
  - Session creation/editing
  - Session lobby/detail view
  - Session books management
  - Session photo upload/preview
  - Session discussion management
  - QR/manual attendance pages remain present

## Important Frontend Changes

- New API clients:
  - `src/lib/api/cyclesApi.ts`
  - `src/lib/api/sessionContentApi.ts`
- Reader navigation and layout enhancements:
  - `src/components/member/reader-shell.tsx`
  - New history/rank/cycle pages
- Manager dashboard expanded substantially in:
  - `src/app/manage/page.tsx`
- Session detail flows split into focused screens:
  - `books`
  - `photos`
  - `discussion`
- A smoke test helper exists in:
  - `scripts/playwright-smoke.mjs`

## Validation Status

- `npm run build`: OK on 2026-05-06
- Build warning still present:
  - `next.config.js` contains an `eslint` option that Next.js 16 no longer supports
- No automated frontend test suite was run in this pass beyond the production build

## Notes For The Next Agent

- If you need the main manager orchestration logic, open these first:
  - `src/app/manage/page.tsx`
  - `src/app/manage/sessions/[id]/page.tsx`
  - `src/app/manage/sessions/[id]/books/page.tsx`
  - `src/app/manage/sessions/[id]/photos/page.tsx`
  - `src/app/manage/sessions/[id]/discussion/page.tsx`
- If you need the reader journey, open these first:
  - `src/app/m/page.tsx`
  - `src/app/m/history/page.tsx`
  - `src/app/m/rank/page.tsx`
  - `src/app/m/cycles/[cycleId]/page.tsx`
  - `src/app/m/cycles/[cycleId]/sessions/[sessionId]/page.tsx`
- Local logs and Playwright output are intentionally not versioned.

## Recommended Next Steps

1. Remove or replace the unsupported `eslint` option in `next.config.js` for Next.js 16 compatibility.
2. Decide whether the Playwright smoke flow should become a formal scripted validation step in CI or local docs.
3. Recheck role/access edge cases around manager routes after backend auth/role changes.
4. Tighten empty/loading/error states on the newer cycle and session-content screens if product polish is the next priority.

## Backend Coordination

- The companion API repo is `AmatBookshelf_bk`.
- This frontend already consumes cycle, session-content, ranking, and reader-experience endpoints added on the backend, so contract updates should be coordinated across both repos.
