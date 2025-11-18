import db from '../db/index';

// Minimal Note shape for this SQL-based service
export interface Note {
    id?: number;
    title: string;
    content: string;
    sourceShort?: string;
    sourceFull?: string;
    createdAt?: string;
}

export class NotesService {
    async getAllNotes(page = 1, limit = 5, q?: string): Promise<{ rows: Note[]; total: number }> {
        const offset = (page - 1) * limit;
        let total = 0;
    let rows: any = [];

        if (q && q.trim().length > 0) {
            // Simple fuzzy search using LIKE on title and content (case-insensitive for most MySQL setups)
            const like = `%${q}%`;
            const countRows: any = await db.query('SELECT COUNT(*) AS total FROM notes_logs WHERE title LIKE ? OR content LIKE ? OR source_short LIKE ? OR source_full LIKE ?', [like, like, like, like]);
            total = (countRows && countRows[0] && countRows[0].total) ? Number(countRows[0].total) : 0;
            rows = await db.query('SELECT id, title, content, source_short AS sourceShort, source_full AS sourceFull, created_at AS createdAt FROM notes_logs WHERE title LIKE ? OR content LIKE ? OR source_short LIKE ? OR source_full LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [like, like, like, like, limit, offset]);
        } else {
            const countRows: any = await db.query('SELECT COUNT(*) AS total FROM notes_logs');
            total = (countRows && countRows[0] && countRows[0].total) ? Number(countRows[0].total) : 0;
            rows = await db.query('SELECT id, title, content, source_short AS sourceShort, source_full AS sourceFull, created_at AS createdAt FROM notes_logs ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
        }

        return { rows: rows as Note[], total };
    }

    async getNoteById(id: number): Promise<Note | null> {
        const rows: any = await db.query('SELECT id, title, content, created_at AS createdAt FROM notes_logs WHERE id = ?', [id]);
        const note = (rows as any[])[0];
        return note || null;
    }

    async createNote(noteData: Omit<Note, 'id' | 'created_at'>): Promise<Note> {
        // Using parameterized queries to avoid SQL injection
        const result: any = await db.query('INSERT INTO notes_logs (title, content, source_short, source_full) VALUES (?, ?, ?, ?)', [noteData.title, noteData.content, (noteData as any).sourceShort || null, (noteData as any).sourceFull || null]);
        const insertId = result.insertId as number;
        const rows: any = await db.query('SELECT id, title, content, created_at AS createdAt FROM notes_logs WHERE id = ?', [insertId]);
        return rows[0] as Note;
    }

    async updateNote(id: number, noteData: Partial<Note>): Promise<Note | null> {
        const fields: string[] = [];
        const params: any[] = [];
        if (noteData.title !== undefined) {
            fields.push('title = ?');
            params.push(noteData.title);
        }
        if ((noteData as any).content !== undefined) {
            fields.push('content = ?');
            params.push((noteData as any).content);
        }
        // allow updating source fields
        if ((noteData as any).sourceShort !== undefined) {
            fields.push('source_short = ?');
            params.push((noteData as any).sourceShort);
        }
        if ((noteData as any).sourceFull !== undefined) {
            fields.push('source_full = ?');
            params.push((noteData as any).sourceFull);
        }
        // Backwards-compat: accept 'body' field if some client still sends that key
        if ((noteData as any).content === undefined && (noteData as any).body !== undefined) {
            fields.push('content = ?');
            params.push((noteData as any).body);
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