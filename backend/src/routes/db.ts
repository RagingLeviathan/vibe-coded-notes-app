import { Router } from 'express';
import db from '../db/index';

const router = Router();

// Simple health check that runs a tiny query
router.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

// List tables in the current database
router.get('/tables', async (_req, res) => {
  try {
    const rows: any = await db.query("SHOW TABLES");
    // MySQL returns rows like { 'Tables_in_<db>': 'notes' }
    const tables = rows.map((r: any) => Object.values(r)[0]);
    res.json(tables);
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Preview rows from a table (limit safe)
router.get('/table/:name', async (req, res) => {
  const name = req.params.name;
  // simple validation: allow letters, numbers, underscore
  if (!/^[\w-]+$/.test(name)) return res.status(400).json({ error: 'invalid table name' });
  try {
    const rows: any = await db.query(`SELECT * FROM \`${name}\` LIMIT 50`);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
