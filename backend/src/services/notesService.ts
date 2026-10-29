import db from '../db/index';

// Minimal Note shape for this SQL-based service
export interface Note {
    id?: number;
    title: string;
    content: string;
    sourceShort?: string | null;
    sourceFull?: string | null;
    bookId?: number | null;
    bookTitle?: string | null;
    bookSlug?: string | null;
    createdAt?: string;
}

const SEARCHABLE_COLUMNS: Record<string, string> = {
    title: 'title',
    content: 'content',
    sourceShort: 'source_short',
    sourceFull: 'source_full',
    bookTitle: 'book_title',
};

// API field name -> column name for writes. Column names never come from user input.
const WRITABLE_COLUMNS: Record<string, string> = {
    title: 'title',
    content: 'content',
    sourceShort: 'source_short',
    sourceFull: 'source_full',
    bookId: 'book_id',
    bookTitle: 'book_title',
    bookSlug: 'book_slug',
};

const NOTE_SELECT = 'id, title, content, source_short AS sourceShort, source_full AS sourceFull, book_id AS bookId, book_title AS bookTitle, book_slug AS bookSlug, created_at AS createdAt';

export class NotesService {
    async getAllNotes(page = 1, limit = 5, q?: string, fields?: string[]): Promise<{ rows: Note[]; total: number }> {
        const offset = (page - 1) * limit;
        let total = 0;
        let rows: any = [];

        if (q && q.trim().length > 0) {
            // Partial match (LIKE %term%) on the chosen fields; defaults to all searchable fields.
            const selected = (fields || []).filter((f) => f in SEARCHABLE_COLUMNS);
            const columns = (selected.length > 0 ? selected : Object.keys(SEARCHABLE_COLUMNS)).map((f) => SEARCHABLE_COLUMNS[f]);
            const escaped = q.trim().replace(/[\\%_]/g, '\\$&');
            const like = `%${escaped}%`;
            const where = columns.map((c) => `${c} LIKE ?`).join(' OR ');
            const likeParams = columns.map(() => like);
            const countRows: any = await db.query(`SELECT COUNT(*) AS total FROM notes_logs WHERE ${where}`, likeParams);
            total = (countRows && countRows[0] && countRows[0].total) ? Number(countRows[0].total) : 0;
            rows = await db.query(`SELECT ${NOTE_SELECT} FROM notes_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...likeParams, limit, offset]);
        } else {
            const countRows: any = await db.query('SELECT COUNT(*) AS total FROM notes_logs');
            total = (countRows && countRows[0] && countRows[0].total) ? Number(countRows[0].total) : 0;
            rows = await db.query(`SELECT ${NOTE_SELECT} FROM notes_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
        }

        return { rows: rows as Note[], total };
    }

    async getAllNotesForExport(): Promise<Note[]> {
        const rows: any = await db.query(`SELECT ${NOTE_SELECT} FROM notes_logs ORDER BY created_at ASC, id ASC`);
        return rows as Note[];
    }

    async getNoteById(id: number): Promise<Note | null> {
        const rows: any = await db.query(`SELECT ${NOTE_SELECT} FROM notes_logs WHERE id = ?`, [id]);
        const note = (rows as any[])[0];
        return note || null;
    }

    async createNote(noteData: Omit<Note, 'id' | 'createdAt'>): Promise<Note> {
        // Using parameterized queries to avoid SQL injection
        const result: any = await db.query(
            'INSERT INTO notes_logs (title, content, source_short, source_full, book_id, book_title, book_slug) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                noteData.title,
                noteData.content,
                noteData.sourceShort || null,
                noteData.sourceFull || null,
                noteData.bookId || null,
                noteData.bookTitle || null,
                noteData.bookSlug || null,
            ]
        );
        const insertId = result.insertId as number;
        return (await this.getNoteById(insertId)) as Note;
    }

    async updateNote(id: number, noteData: Partial<Note>): Promise<Note | null> {
        const fields: string[] = [];
        const params: any[] = [];
        for (const [key, column] of Object.entries(WRITABLE_COLUMNS)) {
            const value = (noteData as any)[key];
            if (value !== undefined) {
                fields.push(`${column} = ?`);
                params.push(value);
            }
        }
        if (fields.length === 0) return this.getNoteById(id);

        params.push(id);
        await db.query(`UPDATE notes_logs SET ${fields.join(', ')} WHERE id = ?`, params);
        return this.getNoteById(id);
    }

    async deleteNote(id: number): Promise<boolean> {
        const result: any = await db.query('DELETE FROM notes_logs WHERE id = ?', [id]);
        // For MySQL, affectedRows indicates deletion count
        return (result.affectedRows || result.affectedRows === 0) ? result.affectedRows > 0 : true;
    }
}
