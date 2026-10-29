import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// POST /api/hardcover
// Forwards GraphQL requests to the external Hardcover API using a server-side token.
router.post('/hardcover', async (req: Request, res: Response) => {
  const body = req.body || {};
  const token = process.env.HARDCOVER_TOKEN || '';
  try {
    // Masked token preview for safe logging (first/last 6 chars if present)
    const maskedToken = token && token.trim() !== ''
      ? `${token.trim().slice(0,6)}...${token.trim().slice(-6)}`
      : null;
    console.log(`[hardcover proxy] incoming request, token present: ${!!token}, token preview: ${maskedToken}`);

    const headers: any = { 'Content-Type': 'application/json' };
    if (token && token.trim() !== '') headers['Authorization'] = `Bearer ${token.trim()}`;

    // Add a reasonable timeout so upstream hangs surface as an error quickly
    const r = await axios.post('https://api.hardcover.app/v1/graphql', body, { headers, timeout: 15000 });

    console.log(`[hardcover proxy] upstream responded: ${r.status}`);
    res.status(r.status).json(r.data);
  } catch (err: any) {
    // Log details to the backend console (do NOT print full token)
    try {
      if (err.response) {
        console.error('[hardcover proxy] upstream error status=', err.response.status, 'data=', typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data));
        // Forward upstream status and body where possible
        return res.status(err.response.status).json(err.response.data || { error: 'Upstream error' });
      }
      console.error('[hardcover proxy] request error:', err.message || err);
    } catch (logErr) {
      console.error('[hardcover proxy] error while handling error:', logErr);
    }

    res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
  }
});

export default router;
