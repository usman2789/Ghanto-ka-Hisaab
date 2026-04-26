# Graph Report - Ghanto-ka-Hisaab  (2026-04-27)

## Corpus Check
- 38 files · ~28,288 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 221 nodes · 382 edges · 10 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

## God Nodes (most connected - your core abstractions)
1. `a` - 23 edges
2. `initDB()` - 19 edges
3. `GET()` - 17 edges
4. `y()` - 13 edges
5. `P` - 11 edges
6. `x()` - 10 edges
7. `loadDayEntries()` - 10 edges
8. `f()` - 9 edges
9. `M` - 9 edges
10. `formatLocalDate()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `initDB()` --calls--> `init()`  [INFERRED]
  utils/offlineSync.ts → components/OfflineSyncManager.tsx
- `isOnline()` --calls--> `checkOnlineStatus()`  [INFERRED]
  utils/offlineSync.ts → app/page.tsx
- `isOnline()` --calls--> `loadDayEntries()`  [INFERRED]
  utils/offlineSync.ts → app/page.tsx
- `cacheHourEntries()` --calls--> `loadDayEntries()`  [INFERRED]
  utils/offlineSync.ts → app/page.tsx
- `getMergedEntriesForDate()` --calls--> `loadDayEntries()`  [INFERRED]
  utils/offlineSync.ts → app/page.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (17): d(), deleteCacheAndMetadata(), e(), et(), G, i, j(), l() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (30): addPendingEntry(), addPendingUserTagAction(), cacheHourEntries(), cacheSingleEntry(), cacheSingleUserPredefinedTag(), cacheUserPredefinedTags(), clearCachedUserPredefinedTags(), clearPendingEntries() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (14): updateSession(), checkOnlineStatus(), formatLocalDate(), getUser(), handleAddItem(), handleDateClick(), handleDeleteItem(), handleOnline() (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (4): onSubmit(), a, c(), x()

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (5): GET(), $(), h(), k(), y()

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (2): f(), M

### Community 6 - "Community 6"
Cohesion: 0.2
Nodes (6): addOneTimeCustomTag(), addPredefinedCustomTag(), handleSavedTagClick(), hasTag(), normalizeTag(), toggleTag()

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (4): createClient(), AttendancePage(), LoginPage(), SettingsPage()

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (1): init()

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): c(), r()

## Knowledge Gaps
- **Thin community `Community 5`** (19 nodes): `.destroy()`, `.doneWaiting()`, `f()`, `.handle()`, `.handleAll()`, `.M()`, `M`, `.constructor()`, `.expireEntries()`, `.getDb()`, `.getTimestamp()`, `.l()`, `.m()`, `.p()`, `.setTimestamp()`, `.isURLExpired()`, `.updateTimestamp()`, `.constructor()`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (4 nodes): `OfflineSyncManager.tsx`, `handleOffline()`, `handleOnline()`, `init()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (3 nodes): `sw.js`, `c()`, `r()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `handleDeleteUserPredefinedTag()` connect `Community 1` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Why does `j()` connect `Community 0` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `P` connect `Community 0` to `Community 3`, `Community 5`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `initDB()` (e.g. with `init()` and `init()`) actually correct?**
  _`initDB()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `GET()` (e.g. with `.handleRequest()` and `.findMatchingRoute()`) actually correct?**
  _`GET()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._