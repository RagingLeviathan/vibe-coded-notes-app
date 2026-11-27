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
    takenFromCopybook?: boolean;
    takenFromBook?: boolean;
    createdAt?: string;
}

const SEARCHABLE_COLUMNS: Record<string, string> = {
    title: 'n.title',
    content: 'n.content',
    sourceShort: 'n.source_short',
    sourceFull: 'n.source_full',
    bookTitle: 'n.book_title',
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

const NOTE_SELECT = 'n.id, n.title, n.content, n.source_short AS sourceShort, n.source_full AS sourceFull, n.book_id AS bookId, n.book_title AS bookTitle, n.book_slug AS bookSlug, n.created_at AS createdAt, COALESCE(t.taken_from_copybook, 0) AS takenFromCopybook, COALESCE(t.taken_from_book, 0) AS takenFromBook';
const NOTE_FROM = 'FROM notes_logs n LEFT JOIN source_tags t ON BINARY n.source_short = BINARY t.source_short';

const normalizeNote = (note: Note): Note => ({
    ...note,
    takenFromCopybook: Boolean(note.takenFromCopybook),
    takenFromBook: Boolean(note.takenFromBook),
});

type Query = (sql: string, params?: any[]) => Promise<any>;

export class NotesService {
    async getAllNotes(page = 1, limit = 5, q?: string, fields?: string[], sourceFull?: string): Promise<{ rows: Note[]; total: number }> {
        const offset = (page - 1) * limit;
        const conditions: string[] = [];
        const params: string[] = [];

        if (sourceFull !== undefined) {
            conditions.push('BINARY n.source_full = BINARY ?');
            params.push(sourceFull);
        }

        if (q && q.trim().length > 0) {
            // Partial match (LIKE %term%) on the chosen fields; defaults to all searchable fields.
            const selected = (fields || []).filter((f) => f in SEARCHABLE_COLUMNS);
            const columns = (selected.length > 0 ? selected : Object.keys(SEARCHABLE_COLUMNS)).map((f) => SEARCHABLE_COLUMNS[f]);
            const escaped = q.trim().replace(/[\\%_]/g, '\\$&');
            const like = `%${escaped}%`;
            conditions.push(`(${columns.map((c) => `${c} LIKE ?`).join(' OR ')})`);
            params.push(...columns.map(() => like));
        }

        const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
        const countRows: any = await db.query(`SELECT COUNT(*) AS total FROM notes_logs n${where}`, params);
        const total = (countRows && countRows[0] && countRows[0].total) ? Number(countRows[0].total) : 0;
        const rows = await db.query(`SELECT ${NOTE_SELECT} ${NOTE_FROM}${where} ORDER BY n.created_at DESC, n.id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]) as Note[];
        return { rows: rows.map(normalizeNote), total };
    }

    async getAllNotesForExport(): Promise<Note[]> {
        const rows = await db.query(`SELECT ${NOTE_SELECT} ${NOTE_FROM} ORDER BY n.created_at ASC, n.id ASC`) as Note[];
        return rows.map(normalizeNote);
    }

    async getNoteById(id: number): Promise<Note | null> {
        const rows: any = await db.query(`SELECT ${NOTE_SELECT} ${NOTE_FROM} WHERE n.id = ?`, [id]);
        const note = (rows as any[])[0];
        return note ? normalizeNote(note) : null;
    }

    async createNote(noteData: Omit<Note, 'id' | 'createdAt'>): Promise<Note> {
        const save = async (query: Query, data: Omit<Note, 'id' | 'createdAt'>): Promise<Note> => {
            const result = await query(
                'INSERT INTO notes_logs (title, content, source_short, source_full, book_id, book_title, book_slug) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    data.title,
                    data.content,
                    data.sourceShort || null,
                    data.sourceFull || null,
                    data.bookId || null,
                    data.bookTitle || null,
                    data.bookSlug || null,
                ]
            );
            const rows = await query(`SELECT ${NOTE_SELECT} ${NOTE_FROM} WHERE n.id = ?`, [result.insertId]);
            const note: Note | undefined = rows[0];
            if (!note) throw new Error('Created note could not be retrieved');
            return normalizeNote(note);
        };
        if (!noteData.sourceShort) return save(db.query, noteData);
        return db.transaction(async connection => {
            const query: Query = async (sql, params) => (await connection.query(sql, params))[0];
            return save(query, await this.applySourceTag(query, noteData));
        });
    }

    async updateNote(id: number, noteData: Partial<Note>): Promise<Note | null> {
        const save = async (query: Query, data: Partial<Note>): Promise<Note | null> => {
            const fields: string[] = [];
            const params: any[] = [];
            for (const [key, column] of Object.entries(WRITABLE_COLUMNS)) {
                const value = (data as any)[key];
                if (value !== undefined) {
                    fields.push(`${column} = ?`);
                    params.push(value);
                }
            }
            if (fields.length) {
                params.push(id);
                await query(`UPDATE notes_logs SET ${fields.join(', ')} WHERE id = ?`, params);
            }
            const rows = await query(`SELECT ${NOTE_SELECT} ${NOTE_FROM} WHERE n.id = ?`, [id]);
            return rows[0] ? normalizeNote(rows[0]) : null;
        };
        if (!noteData.sourceShort) return save(db.query, noteData);
        return db.transaction(async connection => {
            const query: Query = async (sql, params) => (await connection.query(sql, params))[0];
            return save(query, await this.applySourceTag(query, noteData));
        });
    }

    private async applySourceTag<T extends Partial<Note>>(query: Query, note: T): Promise<T> {
        const rows = await query(
            'SELECT source_short AS sourceShort, source_full AS sourceFull, book_id AS bookId, book_title AS bookTitle, book_slug AS bookSlug FROM source_tags WHERE BINARY source_short = BINARY ? FOR UPDATE',
            [note.sourceShort]
        );
        return rows[0] ? { ...note, ...rows[0] } : note;
    }

    async deleteNote(id: number): Promise<boolean> {
        const result: any = await db.query('DELETE FROM notes_logs WHERE id = ?', [id]);
        if (typeof result.affectedRows !== 'number') throw new Error('Invalid delete result from database');
        return result.affectedRows > 0;
    }
}
