# Ghanto ka Hisaab

Ghanto ka Hisaab is a Next.js 16 + Supabase Progressive Web App for tracking how time is spent across the day. The repo currently includes:

- Hour-by-hour tracking on the main dashboard
- A newer daily habit tracker at `/tracker-new`
- Statistics at `/stats`
- An admin-only attendance helper at `/attendance`
- Offline-first behavior backed by IndexedDB and a generated service worker
- A local Graphify knowledge graph under `graphify-out/` for navigating the codebase

## Stack

- Next.js 16.1.1 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth + Postgres
- `next-pwa` for service worker generation and runtime caching

## Current App Areas

- `/`:
  Main hour-tracking dashboard with calendar view, tags, notes, and offline sync support
- `/tracker-new`:
  Daily tracker for user-defined items with per-day status like completed, partial, or not done
- `/stats`:
  Analytics view with hours-based stats and tracker-based stats
- `/settings`:
  Sign-out, offline sync visibility, and local pending-data cleanup
- `/attendance`:
  Admin-only attendance helper for a fixed student list
- `/login` and `/signup`:
  Client-side auth entry points
- `/auth/callback`:
  Supabase OAuth callback route
- `/_offline`:
  Offline fallback screen served by the PWA setup

## Offline and PWA Behavior

This repo uses `next-pwa` via [next.config.ts](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/next.config.ts:1).

- The production build generates `public/sw.js`
- Document requests use a `NetworkFirst` strategy
- `/_next/static/*` assets use `CacheFirst`
- Styles, scripts, fonts, images, and workers use `StaleWhileRevalidate`
- Failed document navigations fall back to `/_offline`

Offline data is not handled by the service worker alone. The app also stores pending and cached user data in IndexedDB through [utils/offlineSync.ts](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/utils/offlineSync.ts:1). That layer is what lets the hour tracker keep working when the network drops.

PWA-related UI helpers:

- [components/PWALifecycleManager.tsx](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/components/PWALifecycleManager.tsx:1)
- [components/PWAInstallPrompt.tsx](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/components/PWAInstallPrompt.tsx:1)
- [components/PWADebugger.tsx](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/components/PWADebugger.tsx:1)

## Auth and Data

Supabase is used for:

- Browser auth/session handling
- User-scoped hour entries
- User-scoped predefined tags
- Tracker items and tracker entry data

Base schema:

- [supabase-schema.sql](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/supabase-schema.sql:1)

Additional tracker schema:

- [supabase-tracker-schema.sql](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/supabase-tracker-schema.sql:1)

Important note:
The repo currently contains a schema naming mismatch. The newer tracker pages at `/tracker-new` and `/stats` query `tracker_entries`, while the older tracker route and `supabase-tracker-schema.sql` still reference `tracker_logs`. If you are setting up a fresh database, verify which tracker schema version you want before deploying.

## Development

### Prerequisites

- Node.js 18+
- npm
- A Supabase project

### Install

```bash
npm install
```

### Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database

Load the SQL files into Supabase:

```bash
supabase-schema.sql
supabase-tracker-schema.sql
```

Because of the tracker naming mismatch noted above, review the tracker SQL before using it unchanged.

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

PWA behavior is only fully active in production builds.

## Project Structure

```text
app/
  _offline/page.tsx
  attendance/page.tsx
  auth/
    auth-code-error/page.tsx
    callback/route.ts
  layout.tsx
  login/page.tsx
  page.tsx
  settings/page.tsx
  signup/page.tsx
  stats/page.tsx
  tracker/page.tsx
  tracker-new/page.tsx

components/
  CalendarView.tsx
  FeedbackForm.tsx
  HourTracker.tsx
  Loader.tsx
  OfflineSyncManager.tsx
  PWADebugger.tsx
  PWAInstallPrompt.tsx
  PWALifecycleManager.tsx
  StaggeredMenu.tsx

utils/
  offlineSync.ts
  supabase/
    client.ts
    middleware.ts
    server.ts

public/
  manifest.json
  sw-custom.js
  sw.js                 # generated during build
  workbox-*.js          # generated during build

graphify-out/
  GRAPH_REPORT.md
  graph.html
  graph.json
  cache/
```

## Graphify Usage

This repo includes a Graphify knowledge graph at `graphify-out/`.

Useful files:

- `graphify-out/GRAPH_REPORT.md`:
  Summary of communities, hubs, and likely cross-module relationships
- `graphify-out/graph.html`:
  Visual graph explorer
- `graphify-out/graph.json`:
  Raw graph data

The repository guidance in [AGENTS.md](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/AGENTS.md:1) recommends:

- Read `graphify-out/GRAPH_REPORT.md` before answering architecture questions
- Prefer graph-based exploration over grep for cross-module relationships
- Refresh the graph after code changes with:

```bash
graphify update .
```

If `graphify` is installed in your environment, you can also use commands like:

```bash
graphify query "how does offline sync connect to the dashboard?"
graphify path "app/page.tsx" "utils/offlineSync.ts"
graphify explain "service worker"
```

In this workspace, the generated graph output already exists even if the `graphify` CLI is not installed globally.

## Notes on Current State

- The main README has been updated to match the current code paths, not just older summary docs
- The build is configured for webpack-based Next.js builds
- The app currently keeps both an older tracker route (`/tracker`) and a newer tracker route (`/tracker-new`)
- `next.config.ts` is the meaningful PWA config file in current use
- `public/sw.js` and `workbox-*` files are generated artifacts and may change after each production build

## Related Docs

- [PWA_DOCUMENTATION.md](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/PWA_DOCUMENTATION.md:1)
- [PWA_SIMPLE_GUIDE.md](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/PWA_SIMPLE_GUIDE.md:1)
- [TRACKER_FEATURE_SUMMARY.md](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/TRACKER_FEATURE_SUMMARY.md:1)

## License

See [LICENSE](/home/muhmdusman/Desktop/Ghanto-ka-Hisaab/LICENSE:1).
