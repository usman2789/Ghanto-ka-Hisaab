## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

Safe usage notes:
- Treat Graphify as a navigation aid, not as the final source of truth. Use it to find candidate files, functions, and module relationships, then verify by reading the actual code.
- Prefer EXTRACTED edges over INFERRED edges when making implementation decisions. INFERRED edges are useful hints but can be directionally wrong or semantically noisy.
- Be cautious with query results that mix generated files like `public/sw.js` or `public/workbox-*.js` into normal app logic. Those files are usually build artifacts, not the right place to reason about product behavior.
- For feature questions, narrow the scope in the query. Good example: `graphify query "which functions in app/page.tsx and utils/offlineSync.ts save or sync hour entries?"`
- If a Graphify answer does not mention the file or concept named in the question, do not trust it as a direct answer. Confirm with `rg` and file reads.
- For runtime behavior, auth, storage, or data flow questions, always validate the graph result against the live source files before editing.

Repo-specific cautions:
- This repo contains both app code and generated PWA/workbox output. Graphify may surface both, so filter mentally for authored files first.
- This repo also has parallel tracker flows like `/tracker` and `/tracker-new`; Graphify can mix them together in broad queries. Verify which route is actually relevant before making changes.
