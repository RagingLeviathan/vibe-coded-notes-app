# Notes App

This is a lightweight notes application built with a React frontend and a Node.js backend. Users can create, read, update, and delete text notes. The application uses Tailwind CSS for styling and TypeScript for type safety.

## Project Structure

```
notes-app
├── frontend          # React frontend
│   ├── package.json  # Frontend dependencies and scripts
│   ├── tsconfig.json # TypeScript configuration for frontend
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── postcss.config.js   # PostCSS configuration
│   ├── public
│   │   └── index.html      # Main HTML file
│   └── src
│       ├── index.tsx       # Entry point for React app
│       ├── App.tsx         # Main App component
│       ├── pages
│       │   └── Home.tsx    # Home page component
│       ├── components
│       │   ├── NoteList.tsx # Component for listing notes
│       │   ├── NoteItem.tsx # Component for a single note
│       │   └── NoteEditor.tsx # Component for creating/editing notes
│       ├── services
│       │   └── api.ts      # API calls to the backend
│       ├── hooks
│       │   └── useNotes.ts  # Custom hook for managing notes
│       └── styles
│           └── index.css    # Global styles
├── backend           # Node.js backend
│   ├── package.json  # Backend dependencies and scripts
│   ├── tsconfig.json # TypeScript configuration for backend
│   ├── .env          # Environment variables
│   └── src
│       ├── app.ts    # Entry point for backend app
│       ├── controllers
│       │   └── notesController.ts # Controller for note operations
│       ├── routes
│       │   └── notes.ts # Routes for note operations
│       ├── services
│       │   └── notesService.ts # Business logic for notes
│       └── db
│           └── index.ts # Database connection setup
├── db
│   ├── schema.sql     # Current notes_logs schema
│   └── migrations
│       ├── 001_create_notes_table.sql # Legacy notes table
│       ├── 002_add_source_fields.sql # Legacy migration
│       ├── 003_create_notes_logs_table.sql
│       ├── 004_add_book_link.sql
│       └── 005_create_source_tags.sql
├── .gitignore         # Files to ignore in version control
└── README.md          # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ and npm (Vite 7 requires these minimum versions)
- MySQL or MariaDB (the Windows instructions below use WampServer)
- A [Hardcover](https://hardcover.app) API token for the book search features

### Quick start

The following steps are for Windows and a **new, empty** local database. If you already have notes or an existing `notes` database, back it up and inspect it first; do not drop or overwrite any existing tables.

1. **Start WampServer.** Launch WampServer and use its system-tray menu to start its services, including Apache and your chosen MySQL or MariaDB service. Wait for the tray icon to turn green. WampServer can include both database servers; they are separate instances and can use different ports. Choose one and use it consistently. You don't need XAMPP; running both stacks can cause port conflicts.

2. **Create the database.** On the same computer, open [phpMyAdmin](http://localhost/phpmyadmin/) or choose phpMyAdmin from WampServer's tray menu. Log in using the database credentials for the chosen server. If phpMyAdmin offers a server choice, select the MySQL or MariaDB instance you intend to use. In its **SQL** tab run `SELECT @@port;` and note the result for step 4. Click **New** in the left sidebar, enter `notes` as the database name, choose `utf8mb4_unicode_ci` if available, and click **Create**. If `notes` already exists, do not recreate or delete it: inspect it and back it up before proceeding.

3. **Create or upgrade the tables.** In phpMyAdmin, select the `notes` database and open its **SQL** tab. For a new database, run [db/schema.sql](db/schema.sql), which creates `notes_logs` and `source_tags`. Migration 003 creates the base `notes_logs` table, migration 004 adds the book fields, and migration 005 creates `source_tags`. Migrations 001 and 002 are legacy; do not run them for a fresh setup.

   If `notes_logs` already exists, back it up and inspect its columns and indexes first. An existing table created using the earlier setup instructions needs `book_id`, `book_title`, and `book_slug`. For MariaDB, run [migration 004](db/migrations/004_add_book_link.sql). On MySQL, its `IF NOT EXISTS` syntax may not be supported: if all three book columns and the index are absent, run the following instead. If any already exist, add only the missing ones.

   ```sql
   ALTER TABLE notes_logs
     ADD COLUMN book_id INT UNSIGNED NULL DEFAULT NULL,
     ADD COLUMN book_title VARCHAR(255) NULL DEFAULT NULL,
     ADD COLUMN book_slug VARCHAR(255) NULL DEFAULT NULL;
   CREATE INDEX idx_notes_logs_book_id ON notes_logs (book_id);
   ```

   The earlier table also lacked `updated_at`; if it is absent, add it with `ALTER TABLE notes_logs ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`.

   For an existing installation, back up the database, then run [migration 005](db/migrations/005_create_source_tags.sql) in the selected `notes` database. It creates the separate `source_tags` table without changing existing notes. The backend needs this table when saving notes with a short source.

4. **Configure the backend.** In VS Code, create a file named `.env` in the `backend` folder (not in the project root). This example uses a local `root` account without a password on port `3306`:

   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=notes
   PORT=5000
   ```

   Enter the actual username and password used in phpMyAdmin and the port returned in step 2. A blank password is only appropriate for a local development account that actually has no password; a dedicated password-protected database user with permissions limited to `notes` is preferable. Keep this file private and never commit it. Remove or unset any existing `DATABASE_URL` when using these separate settings: a nonempty `DATABASE_URL` takes precedence. Restart the backend after changing its configuration.

5. **Start the backend.** In a PowerShell terminal opened at the project root, run:

   ```powershell
   cd backend
   npm.cmd install
   npm.cmd start
   ```

   Leave this terminal open. The startup message means the HTTP server is listening, not necessarily that the database connection works. If it is already running, restart the existing process instead of starting another on port 5000.

6. **Check the connection and table.** On the same computer, open `http://localhost:5000/api/db/health`; a working database connection returns `{"ok":true}`. Then open `http://localhost:5000/api/notes`: for an empty table it should return JSON with `"data":[]` and `"total":0`. The health check does not verify the table, so check both endpoints. These debug routes are currently unauthenticated; only expose the app on a trusted network and do not share error output containing credentials.

7. **Start the dashboard.** In a second PowerShell terminal opened at the project root:

   ```powershell
   cd frontend
   npm.cmd install
   npm.cmd run dev
   ```

   Open `http://localhost:3000` and create a test note. Other trusted LAN devices can use `http://<this-computer-LAN-IP>:3000`; obtain the IPv4 address with `ipconfig`. The database stays on the machine running WampServer and does not need to be exposed to the LAN. The notes app itself is currently unauthenticated, so anyone who can reach it can potentially read or change notes. Keep WampServer/phpMyAdmin and database access local, and do not port-forward them to the internet.

8. **Try the Discord bot.** With the WampServer database and the notes backend still running, start the bot in its own terminal if it is not already running. Use `/note create`, then `/note find` or `/note view`; the dashboard should update within about 10 seconds while visible. The bot defaults to `http://127.0.0.1:5000/api/notes`, so it and the backend must run on the same machine for that address. If its commands have not been registered yet, run `npm.cmd run register-commands` in the bot folder; this replaces that bot application's guild commands with `/word` and `/note`.

### Windows launcher

After the initial setup and dependency installation in all three projects, double-click [start-notes-and-wordhippo.bat](start-notes-and-wordhippo.bat). It starts WampServer if its manager is not already running and opens separate command windows for the notes backend and frontend (`npm run dev`) and WordHippo (`npm start`); inspect each window for startup errors. Approve any Windows permission prompt and wait until the WampServer tray icon is green and the configured database service is running before saving notes. The launcher does not verify database readiness, install packages, or register Discord commands. It expects WampServer at `C:\wamp64\wampmanager.exe` and WordHippo at `%USERPROFILE%\wordhippo-discord-bot`; set `WAMP_EXE` or `WORDHIPPO_DIR` before running it if either is elsewhere.

Open `http://localhost:3000` for notes or `http://localhost:3102` for WordHippo. The notes dashboard remains available on the LAN as configured; the WordHippo dashboard remains localhost-only. To stop the apps, press Ctrl+C in each window and confirm if prompted. Avoid starting another copy if the apps are already running.

### Troubleshooting database setup

- **Note command fails with HTTP 500:** check the notes backend window for a `[notes error]` entry. Its operation, error code and reference ID help identify the cause; the WordHippo window includes the same reference when available. For example, `ECONNREFUSED` indicates a failed connection; check WampServer's database service and backend connection settings. These diagnostics are printed to the windows, not saved to a log file. They deliberately omit note text, SQL, and credentials.
- **Bot says `Notes API returned HTTP 500`:** the bot reached the API, but the API failed while processing the request. A stopped database, wrong credentials, missing database, or missing table are possible causes; the message alone does not prove which. Check the two URLs in step 6 and the backend terminal. The local health response can include the database error; do not post passwords or connection strings.
- **Connection refused / `ECONNREFUSED`:** check that your chosen WampServer MySQL or MariaDB service is running and `DB_HOST` and `DB_PORT` match it. If there is a port conflict, inspect which service owns the port and use the intended server; do not stop another service without checking what uses it.
- **`Access denied`:** verify the database username and password in `backend/.env`, and confirm that account has access to the `notes` database.
- **`Unknown database` or `notes_logs` doesn't exist / unknown column:** check the database name and table structure in phpMyAdmin and repeat the appropriate creation step only after checking for existing data. The health endpoint can succeed even when the table is missing.
- **Dashboard or bot cannot reach the API:** ensure the backend is running on port `5000`. If you change that port, update both the frontend's Vite proxy and the bot's `NOTES_API_URL` accordingly.
- **Discord deprecation warnings:** warnings about `ready` or `ephemeral` are separate from the HTTP 500 and do not by themselves mean the database setup failed.

WampServer is a local development environment, not a public hosting setup; see the [WampServer site](https://wampserver.aviatechno.net/).

For backend-proxied Hardcover features, configure `HARDCOVER_TOKEN` in `backend\.env` and restart the backend. The GraphQL Example uses the proxy and its server-side token. The legacy Hardcover page can also use `VITE_HARDCOVER_TOKEN` in `frontend\.env.local` or a token entered in the page, but Vite embeds `VITE_` variables in frontend code visible to visitors. Do not put a private token there on a LAN-accessible deployment.

Search Books and My Books show covers, ratings, genres, and series when available from Hardcover. Cover images load directly from their external image URLs in each browser; a placeholder appears if a cover is missing or fails to load.

Both projects provide `npm.cmd run typecheck`, `npm.cmd run lint`, and `npm.cmd run check`.

### Usage

- Open your browser and navigate to `http://localhost:3000` to access the notes application.
- You can create, view, edit, and delete notes using the interface provided.

### Deployment

The app has three parts to host: a static frontend (`npm run build` in `frontend`, output in `frontend/dist`), a Node/Express backend, and a MySQL/MariaDB database. The frontend calls a relative `/api`, so serve both from the same domain (or add a reverse-proxy rule that forwards `/api` to the backend).

Recommended options:

| Option | Best for | Notes |
|--------|----------|-------|
| **Railway** or **Render** | Easiest all-in-one | Deploy the backend as a Node web service, add a managed MySQL (Railway) or an external one (Render has no MySQL), and host the frontend as a static site. Set `DATABASE_URL`, `PORT` and `HARDCOVER_TOKEN` as environment variables. |
| **Fly.io** | Low cost, close to Docker | Run the backend in a container; attach MySQL via a managed provider such as PlanetScale or Aiven. |
| **VPS** (Hetzner, DigitalOcean, Linode) | Full control, cheapest at scale | Install Node, MariaDB and nginx. Run the backend with `pm2` or systemd, serve `frontend/dist` from nginx and proxy `/api` to port 5000. Add HTTPS with Let's Encrypt (certbot). |
| **Shared hosting with Node + MySQL** (e.g. cPanel hosts) | Closest to your XAMPP setup | Use "Setup Node.js App" for the backend and the included MySQL; upload `frontend/dist` to `public_html`. |
| **Vercel / Netlify** (frontend only) | Static frontend | Pair with one of the above for the backend and add a rewrite from `/api/*` to the backend URL. |

Before going live:

- Run migrations 003, 004, and 005 on the production database.
- Build the backend with `npx tsc` and start it with `node dist/...` (or keep `ts-node` for small deployments); don't use `nodemon` in production.
- Keep `backend/.env` and tokens out of git; set them as host environment variables.
- The app has no login, so anyone who can reach it can read, edit and delete notes. Put it behind authentication (e.g. HTTP basic auth at nginx, Cloudflare Access) or keep it private.
- Back up the database regularly. The Export JSON/CSV buttons on Home give a quick copy of your notes.

### Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

### License

This project is licensed under the MIT License.

## Features

### Note Management

- Create notes with a title and body.
- Edit existing notes and delete notes from the note list.
- Add optional short and full source references to a note.
- Manage shared source tags that map a short source code to a full source and a Hardcover book.
- Display creation timestamps in the local date and time format.
- Refresh note data automatically after create, update, and delete actions.
- Refresh visible pages every 10 seconds and when returning to a tab, so changes from other clients appear without a manual reload. The current page, search, and unsaved editor text are retained.
- Concurrent edits are not merged: saving an older editor draft can overwrite another client's changes.

### Search and Navigation

- Search note titles and content in real time.
- Backend search also includes short and full source fields.
- Search input is debounced by 300 ms to reduce repeated API requests.
- Search results reset to the first page.
- Browse notes in pages of five records with previous, numbered, and next-page controls.
- Select a note's source badge to browse notes with the exact same full source, five per page. Matching is case-sensitive and does not require a saved shared tag.

### User Interface

- Responsive Orb Weaver interface built with Tailwind CSS, featuring Spider Fizz artwork and a spider-web motif.
- Choose system, light, or dark appearance and a violet, teal, or blue accent in the header. Preferences are saved in the current browser.
- Mobile-friendly stacked dashboard and desktop editor-and-notes layout.
- Resizable content textarea.
- Clear loading and empty-note states.
- LAN-ready Vite development server that listens on all network interfaces.

### Backend and Data

- REST API implemented with Node.js and Express.
- MySQL-backed persistence using `mysql2` connection pooling.
- Database configuration through `DATABASE_URL` or individual environment variables.
- Parameterized SQL queries for note retrieval and writes.
- Manual setup for the `notes_logs` table and an additive migration for source metadata.
- Backend database debugging routes mounted under `/api/db`.

### API Overview

| Method   | Endpoint                             | Purpose                                                      |
| -------- | ------------------------------------ | ------------------------------------------------------------ |
| `GET`    | `/api/notes?page=1&limit=5&q=search` | Retrieve a page of notes, optionally filtered by search text |
| `GET`    | `/api/notes/export?format=json\|csv` | Export all notes                                             |
| `GET`    | `/api/notes/:id`                     | Retrieve one note by ID, including source fields             |
| `POST`   | `/api/notes`                         | Create a note                                                |
| `POST`   | `/api/notes/by-source?page=1&limit=5` | List notes matching an exact, case-sensitive full source    |
| `PUT`    | `/api/notes/:id`                     | Update a note by ID                                          |
| `DELETE` | `/api/notes/:id`                     | Delete a note by ID                                          |
| `GET`    | `/api/source-tags`                   | List saved source tags                                       |
| `POST`   | `/api/source-tags`                   | Create a source tag and synchronize matching notes           |
| `PUT`    | `/api/source-tags/:id`               | Update a tag and synchronize matching notes                  |

The list endpoints return `{ data, total, page, limit, q }`. The by-source endpoint accepts `{ "sourceFull": "..." }` as JSON and supports the same pagination and optional search parameters as the list endpoint. Successful creates and updates return the saved note including its source fields, and deletes return HTTP `204 No Content`. GET, PUT, and DELETE by ID return `404` when the note does not exist and `400` for an invalid ID.

### Shared source tags

Open **Source Tags** to create a short code, full source, and linked Hardcover book. Save prompts for confirmation because it replaces the full source and book on all existing notes with that exact, case-sensitive short source. Renaming also updates notes matching the new code, so review both codes before confirming. The response reports how many notes matched; duplicate saved codes are rejected.

Adding a source or a book directly to an individual note does not create a shared tag. To manage those notes together, create a tag with their existing short source in **Source Tags**.

Choose a saved tag in the note editor, or supply its short code when creating or updating a note through the API or Discord. When a matching short source is supplied, the saved full source and book take precedence over values in the same request. Notes with other codes retain their own source and book. If an update omits the short source, only the supplied fields are changed. Unsaved drafts in other browsers can overwrite newer changes, as with other note edits.

## Configuration

Create a `.env` file in the backend directory. You can configure MySQL using a single connection URL:

```env
DATABASE_URL=mysql://user:password@localhost:3306/notes
PORT=5000
```

Alternatively, configure the connection with separate values:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=notes
PORT=5000
```

The frontend uses `/api/notes` and Vite proxies `/api` requests to `http://localhost:5000` during development.

### Dashboard appearance

The header's Theme and Accent controls apply to the current browser and are remembered using local storage. System mode follows the device's light or dark preference. If browser storage is unavailable, the dashboard displays a warning and settings apply only until the page is reloaded.

The supplied Spider Fizz artwork appears in the header, dashboard banner, note editor, and dashboard footer. Its tint follows the selected accent. To add optional banner background artwork, place an image in `frontend/public` and set `--hero-art-image` in `frontend/src/styles/index.css`, for example `url('/orb-weaver-banner.png')`. It appears behind the banner artwork.

## Future Proposals: Security and Discord Command Registration

The following are proposals, **not implemented protections or configuration settings**. Today, the notes API has no authentication, the backend mounts `/api/db` debug routes, and the Vite development server proxies all `/api` requests. Anyone who can reach these services may be able to read or change notes and access debug endpoints. Restricting the Discord bot's dashboard to localhost does not protect the notes API, and Discord still processes bot commands and replies.

### Notes API authentication and debug routes

**Goal:** keep the notes UI available on the local network while controlling access to notes and database diagnostics. The access policy needs a decision first: either every LAN user can continue reading and editing without signing in, or LAN users must authenticate. A login necessarily changes the current open-access experience. Restricting only Discord commands does not prevent direct API access.

**Recommended approach if authentication is desired:**

1. Serve the frontend and API through a single LAN-facing HTTPS entry point, with a certificate trusted by participating devices. Bind the backend to loopback and use firewall rules to prevent direct LAN access to the backend and database. Do not treat the Vite development server as a hardened production gateway.
2. Require a browser login at that entry point or in the backend, and enforce authorization on **every** notes API operation, not just the page. Use server-managed sessions with `HttpOnly`, `Secure`, and appropriate `SameSite` cookies; protect state-changing requests against CSRF and validate the request origin. Use strong credentials and store password hashes rather than plaintext passwords.
3. Give the bot a separate, revocable service credential supplied through its local environment, never through frontend code, URLs, logs, or version control. Authenticate it on the backend, limit it to the required note operations, and return explicit `401` or `403` responses on failure. Continue to restrict Discord command use with an owner or allowlist policy; a service credential alone cannot distinguish Discord users.
4. Disable `/api/db` routes by default by not mounting them. If diagnostics are ever needed, enable them explicitly and require separate administrator authorization, including through any proxy. Loopback checks alone are insufficient: Vite or another proxy can forward a LAN request to the backend from localhost. Prefer a local administrative tool over exposing arbitrary table previews.
5. Restrict CORS and allowed hosts, apply reasonable request limits, avoid logging note contents or secrets, and keep dependencies updated. These measures supplement authentication; CORS, host checks, and LAN firewalls are not substitutes for it.

Before enabling this design, choose who can read, create, update, and delete notes, how browser credentials are distributed and revoked, and how the bot credential is rotated. Verify direct backend and proxied requests, unauthenticated and unauthorized requests, CSRF protection, debug-route denial, and continued LAN and bot access. HTTPS protects traffic on the LAN but does not stop authorized users or Discord from receiving content.

### Discord slash-command registration

The bot currently uses Discord's guild-command bulk replacement endpoint. Running its registration script replaces **all guild commands for that bot application in the configured guild** with the definitions supplied by the script, currently `/word` and `/note`. It does not replace commands belonging to other bot applications or the application's global commands. Registration is a deliberate action, not an automatic consequence of changing the code.

Options:

1. **Keep bulk replacement (simplest):** keep every intended guild command in the bot's command list and register them together. This gives a predictable, repeatable command set and removes stale commands, but it will also remove guild commands for the same application that are maintained elsewhere. Review the full payload before registering and retain the previous definitions for rollback.
2. **Manage individual commands:** retrieve the application's guild commands, then create or update only the commands this project owns. Preserve unrelated commands, detect name conflicts rather than overwriting them silently, and make deletion of obsolete managed commands an explicit operation. This is safer when multiple tools manage the same application, but needs extra logic for ownership, stale commands, failures, and concurrent updates.
3. **Merge before bulk replacement:** retrieve existing guild commands, merge the managed definitions, then submit the complete list. This preserves commands in the retrieved snapshot but remains a wholesale replacement and can overwrite changes made between the read and write. It also needs conflict handling and explicit rules for removing stale managed commands.

For a single bot managed entirely by this project, option 1 is the least complicated; use option 2 if other tools or projects also manage the same application's guild commands. In either case, verify `/word` and `/note` after registration, surface API failures, and avoid logging the bot token.

## Development Scripts

Frontend:

- `npm run dev` — start the Vite development server on port 3000.
- `npm run build` — create a production build.
- `npm start` — preview the built frontend.

Backend:

- `npm run dev` — start the backend with nodemon.
- `npm start` — start the backend with `ts-node`.
- `npm run build` — compile the TypeScript backend.

The backend prints localhost and detected LAN addresses at startup, while the Vite server can also accept connections from devices on the same network.

## Database Schema

The application uses a `notes_logs` table with the following core fields:

- `id` — primary key.
- `title` — note title.
- `content` — note body.
- `source_short` — optional short source label or citation.
- `source_full` — optional full source reference or URL.
- `book_id`, `book_title`, `book_slug` — optional linked Hardcover book.
- `created_at` — note creation timestamp.
- `updated_at` — last update timestamp.

Use [db/schema.sql](db/schema.sql) for a new database, or migrations 003, 004, and 005. The first two migrations are legacy.

## Technology Stack

- **Frontend:** React, TypeScript, React Router, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express, TypeScript, `mysql2`, `dotenv`, CORS
- **Database:** MySQL
- **Styling:** Tailwind CSS and PostCSS

## Error and Loading Behavior

The backend returns JSON error responses when database operations fail. The frontend displays an error when requests fail and loading feedback while note lists are being fetched. The API layer also supports empty-result states by rendering a no-notes message in the note list.
