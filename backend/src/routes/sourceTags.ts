import { Router, Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../db';
import { validateNoteInput } from '../validation/noteInput';

const router = Router();
const COLUMNS = 'id, source_short AS sourceShort, source_full AS sourceFull, book_id AS bookId, book_title AS bookTitle, book_slug AS bookSlug, taken_from_copybook AS takenFromCopybook, taken_from_book AS takenFromBook';

interface SourceTag extends RowDataPacket {
  id: number;
  sourceShort: string;
  sourceFull: string;
  bookId: number;
  bookTitle: string;
  bookSlug: string | null;
  takenFromCopybook: number;
  takenFromBook: number;
}

router.get('/source-tags', async (_req: Request, res: Response) => {
  try {
    const tags = await db.query(`SELECT ${COLUMNS} FROM source_tags ORDER BY source_short`) as SourceTag[];
    res.json(tags.map(tag => ({ ...tag, takenFromCopybook: Boolean(tag.takenFromCopybook), takenFromBook: Boolean(tag.takenFromBook) })));
  } catch (error) {
    console.error('Error retrieving source tags:', error);
    res.status(500).json({ message: 'Error retrieving source tags. Check that migrations 005 and 006 have been applied.' });
  }
});

async function saveTag(req: Request, res: Response, id?: number): Promise<void> {
  const { errors, value } = validateNoteInput(req.body, 'update');
  if (!value.sourceShort) errors.sourceShort = errors.sourceShort || 'Short source is required';
  if (!value.sourceFull) errors.sourceFull = errors.sourceFull || 'Full source is required';
  if (!value.bookId || !value.bookTitle) errors.bookId = errors.bookId || 'A linked book is required';
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  for (const key of ['takenFromCopybook', 'takenFromBook']) {
    if (body[key] !== undefined && typeof body[key] !== 'boolean') errors[key] = `${key} must be a boolean`;
  }
  if (Object.keys(errors).length) {
    res.status(400).json({ message: 'Invalid source tag', errors });
    return;
  }
  try {
    const result = await db.transaction(async connection => {
      let oldShort = value.sourceShort;
      let takenFromCopybook = body.takenFromCopybook;
      let takenFromBook = body.takenFromBook;
      if (id !== undefined) {
        const [existing] = await connection.query<SourceTag[]>('SELECT source_short AS sourceShort, taken_from_copybook AS takenFromCopybook, taken_from_book AS takenFromBook FROM source_tags WHERE id = ? FOR UPDATE', [id]);
        if (!existing.length) return null;
        oldShort = existing[0].sourceShort;
        if (takenFromCopybook === undefined) takenFromCopybook = Boolean(existing[0].takenFromCopybook);
        if (takenFromBook === undefined) takenFromBook = Boolean(existing[0].takenFromBook);
        await connection.query('UPDATE source_tags SET source_short = ?, source_full = ?, book_id = ?, book_title = ?, book_slug = ?, taken_from_copybook = ?, taken_from_book = ? WHERE id = ?',
          [value.sourceShort, value.sourceFull, value.bookId, value.bookTitle, value.bookSlug || null, takenFromCopybook, takenFromBook, id]);
      } else {
        if (takenFromCopybook === undefined) takenFromCopybook = false;
        if (takenFromBook === undefined) takenFromBook = false;
        const [insert] = await connection.query<ResultSetHeader>('INSERT INTO source_tags (source_short, source_full, book_id, book_title, book_slug, taken_from_copybook, taken_from_book) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [value.sourceShort, value.sourceFull, value.bookId, value.bookTitle, value.bookSlug || null, takenFromCopybook, takenFromBook]);
        id = insert.insertId;
      }
      const [updated] = await connection.query<ResultSetHeader>(
        'UPDATE notes_logs SET source_short = ?, source_full = ?, book_id = ?, book_title = ?, book_slug = ? WHERE BINARY source_short = BINARY ? OR BINARY source_short = BINARY ?',
        [value.sourceShort, value.sourceFull, value.bookId, value.bookTitle, value.bookSlug || null, oldShort, value.sourceShort]
      );
      return { id, ...value, takenFromCopybook, takenFromBook, updatedNotes: updated.affectedRows };
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
    res.status(500).json({ message: 'Error saving source tag. Check that migrations 005 and 006 have been applied.' });
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
