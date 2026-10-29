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
│       └── db
│           └── index.ts # Database connection setup
├── db
│   ├── schema.sql     # SQL schema for notes table
│   └── migrations
│       └── 001_create_notes_table.sql # Migration script
├── .gitignore         # Files to ignore in version control
└── README.md          # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher) and npm
- A MySQL or MariaDB server (for example via XAMPP), listening on `127.0.0.1:3306` by default
- A [Hardcover](https://hardcover.app) API token (for the book search features)

### Quick start

You need three things running: the database, the backend, and the frontend.

1. **Start MySQL.** Open the XAMPP Control Panel and start MySQL, or start your MySQL/MariaDB service.
   Check it is reachable with:

   ```powershell
   Test-NetConnection 127.0.0.1 -Port 3306
   ```

2. **Create the database and tables** (first time only). Create a database called `notes`, then run the SQL files in `db\`:

   ```sql
   CREATE DATABASE IF NOT EXISTS notes;
   USE notes;
   ```

   Then run [db/migrations/003_create_notes_logs_table.sql](db/migrations/003_create_notes_logs_table.sql) (or the equivalent [db/schema.sql](db/schema.sql)). It creates the `notes_logs` table the backend uses, including the source columns, and is safe to re-run.

   > `001_create_notes_table.sql` and `002_add_source_fields.sql` are legacy: `001` creates an unused `notes` table and `002` alters `notes_logs` before anything creates it. You don't need them.

   If you already ran 003 earlier, also run [db/migrations/004_add_book_link.sql](db/migrations/004_add_book_link.sql). It adds the optional Hardcover book link columns (`book_id`, `book_title`, `book_slug`) and is safe to re-run. (`schema.sql` already includes them for fresh installs.)

3. **Start the backend** (port 5000):

   ```powershell
   cd backend
   npm install      # first time only
   npm run dev      # auto-restarts on changes; use `npm start` for a plain run
   ```

4. **Start the frontend** (port 3000):

   ```powershell
   cd frontend
   npm install      # first time only
   npm run dev
   ```

5. Open http://localhost:3000.

### Configuration

**Backend**: `backend\.env`

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection URL, in the form `mysql://user:password@host:port/database`. If unset, the backend falls back to `DB_HOST` (default `127.0.0.1`), `DB_PORT` (default `3306`), and the other `DB_*` variables. |
| `PORT` | Backend port (default `5000`) |
| `HARDCOVER_URL` | Hardcover GraphQL endpoint |
| `HARDCOVER_TOKEN` | Hardcover API token (keep secret) |

**Frontend**: copy `frontend\.env.local.example` to `frontend\.env.local` and set `VITE_HARDCOVER_TOKEN`. Restart the dev server after editing it.

Never commit real tokens or passwords.

### Frontend scripts

- `npm run dev`: start the Vite dev server
- `npm run dev:poll` / `npm start`: same, with file polling (useful in Docker/WSL if hot reload misses changes)
- `npm run build`: production build
- `npm run preview`: serve the production build locally

The Vite dev server proxies `/api` requests to the backend at `http://localhost:5000`.

### Linting and type checking

Both `backend` and `frontend` use ESLint 9 (with typescript-eslint) and the TypeScript compiler. Run these from inside each folder:

```powershell
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run check       # typecheck + lint
```

Known issue: `frontend` type checking reports one pre-existing error (`react-dom/client` in `src/main.tsx`, because the project is on React 17). The lint scripts currently report only warnings (unused variables, hook dependencies), which don't fail the run.

### Troubleshooting

- **`connect ECONNREFUSED 127.0.0.1:3306`** (e.g. "Error creating note"): MySQL is not running or is on a different host/port. Start it and check `DATABASE_URL` in `backend\.env`. Reading data from the Hardcover proxy can still work while saving notes fails, because only notes need the database.
- **`Table 'notes.notes_logs' doesn't exist`**: run `db\migrations\003_create_notes_logs_table.sql` (step 2).
- **Frontend can't reach the API**: make sure the backend is running on port 5000.
- **Changed `.env.local` but nothing happened**: restart `npm run dev`.

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

- Run migrations 003 and 004 on the production database.
- Build the backend with `npx tsc` and start it with `node dist/...` (or keep `ts-node` for small deployments); don't use `nodemon` in production.
- Keep `backend/.env` and tokens out of git; set them as host environment variables.
- The app has no login, so anyone who can reach it can read, edit and delete notes. Put it behind authentication (e.g. HTTP basic auth at nginx, Cloudflare Access) or keep it private.
- Back up the database regularly. The Export JSON/CSV buttons on Home give a quick copy of your notes.

### Contributing

Feel free to submit issues or pull requests for improvements or bug fixes. 

### License

This project is licensed under the MIT License.