import { Router, Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../db';
import { validateNoteInput } from '../validation/noteInput';

const router = Router();
const COLUMNS = 'id, source_short AS sourceShort, source_full AS sourceFull, book_id AS bookId, book_title AS bookTitle, book_slug AS bookSlug';

interface SourceTag extends RowDataPacket {
  id: number;
  sourceShort: string;
  sourceFull: string;
  bookId: number;
  bookTitle: string;
  bookSlug: string | null;
}

router.get('/source-tags', async (_req: Request, res: Response) => {
  try {
    const tags = await db.query(`SELECT ${COLUMNS} FROM source_tags ORDER BY source_short`);
    res.json(tags);
  } catch (error) {
    console.error('Error retrieving source tags:', error);
    res.status(500).json({ message: 'Error retrieving source tags. Check that migration 005 has been applied.' });
  }
});

async function saveTag(req: Request, res: Response, id?: number): Promise<void> {
  const { errors, value } = validateNoteInput(req.body, 'update');
  if (!value.sourceShort) errors.sourceShort = errors.sourceShort || 'Short source is required';
  if (!value.sourceFull) errors.sourceFull = errors.sourceFull || 'Full source is required';
  if (!value.bookId || !value.bookTitle) errors.bookId = errors.bookId || 'A linked book is required';
  if (Object.keys(errors).length) {
    res.status(400).json({ message: 'Invalid source tag', errors });
    return;
  }
  try {
    const result = await db.transaction(async connection => {
      let oldShort = value.sourceShort;
      if (id !== undefined) {
        const [existing] = await connection.query<SourceTag[]>('SELECT source_short AS sourceShort FROM source_tags WHERE id = ? FOR UPDATE', [id]);
        if (!existing.length) return null;
        oldShort = existing[0].sourceShort;
        await connection.query('UPDATE source_tags SET source_short = ?, source_full = ?, book_id = ?, book_title = ?, book_slug = ? WHERE id = ?',
          [value.sourceShort, value.sourceFull, value.bookId, value.bookTitle, value.bookSlug || null, id]);
      } else {
        const [insert] = await connection.query<ResultSetHeader>('INSERT INTO source_tags (source_short, source_full, book_id, book_title, book_slug) VALUES (?, ?, ?, ?, ?)',
          [value.sourceShort, value.sourceFull, value.bookId, value.bookTitle, value.bookSlug || null]);
        id = insert.insertId;
      }
      const [updated] = await connection.query<ResultSetHeader>(
        'UPDATE notes_logs SET source_short = ?, source_full = ?, book_id = ?, book_title = ?, book_slug = ? WHERE BINARY source_short = BINARY ? OR BINARY source_short = BINARY ?',
        [value.sourceShort, value.sourceFull, value.bookId, value.bookTitle, value.bookSlug || null, oldShort, value.sourceShort]
      );
      return { id, ...value, updatedNotes: updated.affectedRows };
    });
    if (!result) {
      res.status(404).json({ message: 'Source tag not found' });
      return;
    }
    res.status(req.method === 'POST' ? 201 : 200).json(result);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'A source tag with this short code already exists.' });
      return;
    }
    console.error('Error saving source tag:', error);
    res.status(500).json({ message: 'Error saving source tag. Check that migration 005 has been applied.' });
  }
}

router.post('/source-tags', (req, res) => { void saveTag(req, res); });
router.put('/source-tags/:id', (req, res) => {
  const raw = String(req.params.id);
  const id = Number(raw);
  if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(id)) {
    res.status(400).json({ message: 'Invalid source tag ID' });
    return;
  }
  void saveTag(req, res, id);
});

export default router;
