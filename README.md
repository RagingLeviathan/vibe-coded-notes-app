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
│       ├── main.tsx        # Entry point for React app
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
│       ├── models
│       │   └── noteModel.ts # Note model
│       └── db
│           └── index.ts # Database connection setup
├── db
│   ├── schema.sql     # Legacy SQL schema (see setup instructions)
│   └── migrations
│       ├── 001_create_notes_table.sql # Legacy notes table
│       └── 002_add_source_fields.sql # Adds fields to an existing notes_logs table
├── .gitignore         # Files to ignore in version control
└── README.md          # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 20 or newer and npm
- MySQL or MariaDB (the Windows instructions below use WampServer)

### Installation

The following steps are for Windows and a **new, empty** local database. If you already have notes or an existing `notes` database, back it up and inspect it first; do not drop or overwrite any existing tables.

1. **Start WampServer.** Launch WampServer and use its system-tray menu to start its services, including Apache and your chosen MySQL or MariaDB service. Wait for the tray icon to turn green. WampServer can include both database servers; they are separate instances and can use different ports. Choose one and use it consistently. You don't need XAMPP; running both stacks can cause port conflicts.

2. **Create the database.** On the same computer, open [phpMyAdmin](http://localhost/phpmyadmin/) or choose phpMyAdmin from WampServer's tray menu. Log in using the database credentials for the chosen server. If phpMyAdmin offers a server choice, select the MySQL or MariaDB instance you intend to use. In its **SQL** tab run `SELECT @@port;` and note the result for step 4. Click **New** in the left sidebar, enter `notes` as the database name, choose `utf8mb4_unicode_ci` if available, and click **Create**. If `notes` already exists, do not recreate or delete it: inspect it and back it up before proceeding.

3. **Create the table.** In phpMyAdmin, select the `notes` database in the left sidebar, then open its **SQL** tab. For a new database with no `notes_logs` table, paste the following and click **Go**:

   ```sql
   CREATE TABLE notes_logs (
     id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     content TEXT NOT NULL,
     source_short VARCHAR(255) NULL DEFAULT NULL,
     source_full TEXT NULL DEFAULT NULL,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

   The command fails rather than overwriting an existing table. Confirm that `notes_logs` appears under `notes` and contains the six columns above. If it already exists, inspect its structure and preserve its data rather than rerunning the command blindly.

   **Important:** the existing `db/schema.sql` and `001_create_notes_table.sql` create a table named `notes`, not the `notes_logs` table the backend uses. Do not use them for this fresh setup. `002_add_source_fields.sql` is only for an existing `notes_logs` table without source columns; do not run it after the SQL above.

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

### Troubleshooting database setup

- **Bot says `Notes API returned HTTP 500`:** the bot reached the API, but the API failed while processing the request. A stopped database, wrong credentials, missing database, or missing table are possible causes; the message alone does not prove which. Check the two URLs in step 6 and the backend terminal. The local health response can include the database error; do not post passwords or connection strings.
- **Connection refused / `ECONNREFUSED`:** check that your chosen WampServer MySQL or MariaDB service is running and `DB_HOST` and `DB_PORT` match it. If there is a port conflict, inspect which service owns the port and use the intended server; do not stop another service without checking what uses it.
- **`Access denied`:** verify the database username and password in `backend/.env`, and confirm that account has access to the `notes` database.
- **`Unknown database` or `notes_logs` doesn't exist / unknown column:** check the database name and table structure in phpMyAdmin and repeat the appropriate creation step only after checking for existing data. The health endpoint can succeed even when the table is missing.
- **Dashboard or bot cannot reach the API:** ensure the backend is running on port `5000`. If you change that port, update both the frontend's Vite proxy and the bot's `NOTES_API_URL` accordingly.
- **Discord deprecation warnings:** warnings about `ready` or `ephemeral` are separate from the HTTP 500 and do not by themselves mean the database setup failed.

WampServer is a local development environment, not a public hosting setup; see the [WampServer site](https://wampserver.aviatechno.net/).

### Usage

- Open your browser and navigate to `http://localhost:3000` to access the notes application.
- You can create, view, edit, and delete notes using the interface provided.

### Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

### License

This project is licensed under the MIT License.

## Features

### Note Management

- Create notes with a title and body.
- Edit existing notes and delete notes from the note list.
- Add optional short and full source references to a note.
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

### User Interface

- Responsive Orb Weaver interface built with Tailwind CSS, with a spider-web motif and space for optional banner artwork.
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
| `GET`    | `/api/notes/:id`                     | Retrieve one note by ID, including source fields             |
| `POST`   | `/api/notes`                         | Create a note                                                |
| `PUT`    | `/api/notes/:id`                     | Update a note by ID                                          |
| `DELETE` | `/api/notes/:id`                     | Delete a note by ID                                          |

The list endpoint returns `{ data, total, page, limit, q }`. Successful creates and updates return the saved note including its source fields, and deletes return HTTP `204 No Content`. GET, PUT, and DELETE by ID return `404` when the note does not exist and `400` for an invalid ID.

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

The banner uses a built-in decorative web and spider; no image files are required. To add your own optional artwork, place an image in `frontend/public` and set `--hero-art-image` in `frontend/src/styles/index.css`, for example `url('/orb-weaver-banner.png')`. The image is decorative and appears behind the banner artwork.

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
- `created_at` — note creation timestamp.

Use the SQL in [Getting Started](#getting-started) for a new database. The legacy `db/schema.sql` and first migration create a different table, `notes`, and are not a complete setup for the current backend. The second migration adds source columns to a pre-existing `notes_logs` table.

## Technology Stack

- **Frontend:** React, TypeScript, React Router, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express, TypeScript, `mysql2`, `dotenv`, CORS
- **Database:** MySQL
- **Styling:** Tailwind CSS and PostCSS

## Error and Loading Behavior

The backend returns JSON error responses when database operations fail. The frontend displays an error when requests fail and loading feedback while note lists are being fetched. The API layer also supports empty-result states by rendering a no-notes message in the note list.
