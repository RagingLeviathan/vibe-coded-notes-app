# Frontend local setup

This folder runs the Vite-powered React frontend. Small notes about local configuration and the Hardcover GraphQL helper page.

Environment
--
- Create `frontend/.env.local` (this file should NOT be committed). You can copy the example included here:

```text
VITE_HARDCOVER_TOKEN=your_hardcover_token_here
VITE_HARDCOVER_URL=https://api.hardcover.app/v1/graphql
```

- Restart the dev server after editing `.env.local` because Vite reads env vars at startup.

Running the dev server
--
- Development (default HMR):

```powershell
cd frontend
npm run dev
```

- Development with polling (useful on Windows/WSL/network drives):

```powershell
npm start
# or
npm run dev:poll
```

Hardcover GraphQL page
--
- Open the app in your browser (Vite will print the URL) and click the `Hardcover` link in the header.
- If `VITE_HARDCOVER_TOKEN` is present in `.env.local` the page will automatically run a sample query on load and show results.
- If you prefer, paste a token into the token field on the page and click `Send` to run queries manually.

Security
--
- Never commit `.env.local` with real tokens. The repo `.gitignore` already ignores `.env*` files.
# Frontend - Local LAN access

This README explains how to run the frontend dev server (Vite) so you can access it from other devices on your local network, plus useful troubleshooting steps.

## Start the frontend dev server
From the project `frontend` folder (PowerShell):

```powershell
cd 'c:\Users\nicki\Documents\booknotes\notes-app\frontend'
npm install    # if you haven't already
npm run dev
```

Vite is configured to listen on all network interfaces (`host: true`) and serve on port 3000 by default.

## Find your dev machine's LAN IP
In PowerShell run:

```powershell
ipconfig
```

Look for the IPv4 address of the adapter that's connected to your LAN (e.g. `192.168.1.42`).

Open this URL on another device in the same network:

```
http://<YOUR_DEV_IP>:3000/
```

Example:

```
http://192.168.1.42:3000/
```

## Firewall notes (Windows)
If the other device can't reach `http://<DEV_IP>:3000`, Windows Firewall may be blocking the port. You can allow the port with PowerShell (run as Administrator):

```powershell
# Allow TCP port 3000 for Private networks
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Private
```

If you want to remove the rule later:

```powershell
Remove-NetFirewallRule -DisplayName "Vite Dev Server"
```

Alternatively, open Windows Security → Firewall & network protection → Advanced settings → Inbound Rules → New Rule → Port → TCP port 3000 → Allow.

## Backend note
The frontend proxies `/api` to the backend running on port 5000. You must run the backend locally too. Start the backend in the `backend` folder:

```powershell
cd 'c:\Users\nicki\Documents\booknotes\notes-app\backend'
npm install
npm run dev
```

When the backend starts it will print the LAN addresses it detected, e.g.:

```
Server is running on http://localhost:5000
Server is also available on your LAN at http://192.168.1.42:5000
```

With the Vite proxy in place, remote browsers visiting `http://<DEV_IP>:3000` will have `/api` requests forwarded to the backend automatically.

## Security reminder
Only enable LAN exposure on trusted networks. Dev servers are unauthenticated. When you're finished testing, remove any firewall rules you added or stop the dev servers.

## Troubleshooting
- If Vite doesn't start, check for errors in the terminal output and paste them here.
- If styles or Tailwind utilities are missing, run `npm install` then restart the dev server.
- If `/api` requests fail from the remote device, make sure the backend is running and that Vite's proxy is active (the frontend console will show network errors with full URLs).

If you want, I can also add a short script to print the LAN IPs automatically from the root `README.md` or print them from the backend (already done).