# Project
Notes-taking app: frontend/ uses Node-based tooling, backend/ uses Node.js,
and db/ contains MariaDB database files.
Follow existing frameworks, language, architecture, and conventions.
Inspect relevant package.json files for actual dependencies and commands.

# Project facts
- Stack: React 17 + Vite + Tailwind v2 (frontend/, port 3000); Express + TypeScript run with
  ts-node and mysql2 (backend/, port 5000); MySQL/MariaDB on 127.0.0.1:3306 by default, database `notes`.
- Vite proxies `/api` to http://localhost:5000, so the frontend uses relative `/api/...` URLs.
- Run: `npm run dev` in backend/ (nodemon auto-restart) and in frontend/. `npm start` in backend/
  does NOT reload on changes; restart it after backend edits.
- Backend config is backend/.env (`DATABASE_URL`, `PORT`, `HARDCOVER_URL`, `HARDCOVER_TOKEN`);
  frontend config is frontend/.env.local (`VITE_HARDCOVER_TOKEN`). Never read or print token values.
- The live table is `notes_logs` (title, content, source_short, source_full, book_id, book_title,
  book_slug, created_at, updated_at). Migrations 003 + 004 and db/schema.sql create it; 001/002 are legacy.
  Add new schema changes as the next numbered file in db/migrations/ (MariaDB-compatible).
- Notes can optionally link to a Hardcover book (bookId/bookTitle/bookSlug; no FK, just a snapshot).
  Input validation lives in backend/src/validation/noteInput.ts (limits, 400 with `errors`); the editor
  shows errors and only clears after a successful save. `GET /api/notes/export?format=json|csv` must stay
  registered before `/notes/:id`. Header nav is a hamburger menu below the `md` breakpoint (App.tsx).
- API fields are camelCase (`sourceShort`, `sourceFull`, `createdAt`); SQL columns are snake_case,
  mapped with `AS` aliases in backend/src/services/notesService.ts. When adding a note field, update
  every SELECT (list, getNoteById, createNote), the insert/update, the API types in
  frontend/src/services/api.ts, and the edit flow (NoteItem onEdit -> Home -> NoteEditor -> editNote).
- The backend uses MySQL only (no Mongo/mongoose); the `Note` type lives in notesService.ts.
- Hardcover's GraphQL API rejects `_ilike`/`_like` filters. For text search use its `search(query,
  query_type, per_page, page) { results }` query (Typesense JSON: `results.hits[].document`, `results.found`).
- Windows/PowerShell: run `npx.cmd` instead of `npx` (script execution is disabled).
- Pre-existing type error: `react-dom/client` in frontend/src/main.tsx. Do not treat it as
  caused by your changes.
- Notes are listed 5 per page with search; after create/edit/delete the frontend refetches the
  current page rather than patching local state.

# Work efficiently
- Make the smallest complete change that satisfies the request.
- Search targeted paths/symbols first; read only relevant files and dependencies.
- Exclude node_modules, build output, coverage, lockfiles, and .git from broad searches.
  Read lockfiles only when dependency/version work requires it.
- Reuse existing code and dependencies. Avoid unrelated refactors, abstractions,
  formatting changes, or new packages.
- Do not repeatedly reread unchanged files or rerun unchanged failing commands.
- Ask only when ambiguity materially affects correctness, security, or scope.
  Otherwise follow existing conventions and state important assumptions briefly.
- Use concise tool output. Report relevant errors, not full logs.
- Keep plans brief; omit plans for straightforward edits.

# Implementation
- Keep database access and secrets in backend/, never frontend/.
- Validate input server-side and use parameterized queries or existing ORM bindings.
- Follow existing API contracts, error handling, and authentication patterns.
- If accounts exist, enforce note ownership on every read and mutation.
- Treat note content as untrusted; avoid unsafe HTML rendering.
- Use MariaDB-compatible SQL and the existing schema/migration workflow.

# Styling
- The frontend uses Tailwind CSS v2 with `darkMode: 'class'`; App.tsx applies the class based on the selected theme or OS setting.
  Every new or changed UI element must work in both light and dark mode: pair each
  light color class with a `dark:` variant (backgrounds, borders, text), matching existing components.
- Tailwind v2 has no color opacity slash syntax (e.g. `bg-blue-400/10`); it is silently ignored.
  Use palette classes like `dark:bg-blue-900` instead.
- Check contrast in both modes before finishing.
- Do not reset databases, delete data, or run destructive migrations without approval.
- Never read or expose real credentials. Use environment variable names and examples.

# Verification
- Run the smallest relevant tests/checks using existing scripts; expand when needed.
- Add or update focused tests when behavior changes and test infrastructure exists.
- Do not skip necessary validation merely to save tokens.
- Clearly distinguish checks run, checks not run, and existing failures.

# Responses
- Be concise; omit introductions, repetition, and obvious explanations.
- When editing tools are available, edit files directly; do not also print full files.
- Otherwise provide focused patches/snippets; full files only when requested or necessary.
- Finish with a brief change summary, checks/results, and blockers if any.