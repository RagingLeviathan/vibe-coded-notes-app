import { Request, Response } from 'express';
import { NotesService, Note } from '../services/notesService';
import { LIMITS, validateNoteInput } from '../validation/noteInput';
import { randomUUID } from 'crypto';

const MAX_PAGE_SIZE = 100;

function logNoteError(operation: string, error: unknown): string {
    const errorId = randomUUID();
    const details: Record<string, string | number> = {};
    if (typeof error === 'object' && error !== null) {
        const fields = error as Record<string, unknown>;
        for (const key of ['name', 'code', 'sqlState', 'syscall']) {
            const value = fields[key];
            if (typeof value === 'string' && /^[A-Za-z0-9_]{1,40}$/.test(value)) details[key] = value;
        }
        if (typeof fields.errno === 'number' && Number.isFinite(fields.errno)) details.errno = fields.errno;
    }
    console.error(new Date().toISOString(), '[notes error]', { errorId, operation, ...details });
    return errorId;
}

const CSV_COLUMNS: Array<keyof Note> = ['id', 'title', 'content', 'sourceShort', 'sourceFull', 'bookId', 'bookTitle', 'bookSlug', 'createdAt'];

// Quotes every cell and neutralizes spreadsheet formulas (cells starting with = + - @ or a control character)
const csvCell = (value: unknown): string => {
    if (value === null || value === undefined) return '""';
    let text = value instanceof Date ? value.toISOString() : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
};

const toCsv = (notes: Note[]): string => {
    const lines = [CSV_COLUMNS.map((c) => csvCell(c)).join(',')];
    for (const note of notes) {
        lines.push(CSV_COLUMNS.map((c) => csvCell((note as any)[c])).join(','));
    }
    // BOM so Excel opens the file as UTF-8
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
};

function getNoteId(req: Request, res: Response): number | undefined {
    const raw = String(req.params.id);
    const id = Number(raw);
    if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(id)) {
        res.status(400).json({ message: 'Invalid note ID' });
        return undefined;
    }
    return id;
}

class NotesController {
    private notesService: NotesService;

    constructor() {
        this.notesService = new NotesService();
    }

    public async getNoteById(req: Request, res: Response): Promise<void> {
        const id = getNoteId(req, res);
        if (id === undefined) return;
        try {
            const note = await this.notesService.getNoteById(id);
            if (!note) {
                res.status(404).json({ message: 'Note not found' });
                return;
            }
            res.status(200).json(note);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving note', errorId: logNoteError('get note', error) });
        }
    }

    public async getAllNotes(req: Request, res: Response): Promise<void> {
        try {
            const rawPage = req.query.page ? parseInt(String(req.query.page), 10) : 1;
            const rawLimit = req.query.limit ? parseInt(String(req.query.limit), 10) : 5;
            const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
            const limit = Number.isNaN(rawLimit) ? 5 : Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit));
            const q = req.query.q ? String(req.query.q) : undefined;
            const fields = req.query.fields ? String(req.query.fields).split(',').map((f) => f.trim()) : undefined;
            const sourceFull: unknown = req.method === 'POST' ? req.body?.sourceFull : undefined;
            if (req.method === 'POST' && (typeof sourceFull !== 'string' || sourceFull.trim() === '' || sourceFull.length > LIMITS.sourceFull)) {
                res.status(400).json({ message: 'sourceFull must be non-empty text of at most 10000 characters' });
                return;
            }
            const result = await this.notesService.getAllNotes(page, limit, q, fields, typeof sourceFull === 'string' ? sourceFull : undefined);
            console.log(`${req.method} ${req.path} ->`, result.rows.length, 'rows (total', result.total, ')');
            res.status(200).json({ data: result.rows, total: result.total, page, limit, q, fields });
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving notes', errorId: logNoteError('list notes', error) });
        }
    }

    public async exportNotes(req: Request, res: Response): Promise<void> {
        try {
            const format = String(req.query.format || 'json').toLowerCase();
            if (format !== 'json' && format !== 'csv') {
                res.status(400).json({ message: 'format must be "json" or "csv"' });
                return;
            }
            const notes = await this.notesService.getAllNotesForExport();
            const stamp = new Date().toISOString().slice(0, 10);
            res.setHeader('Content-Disposition', `attachment; filename="booknotes-export-${stamp}.${format}"`);
            if (format === 'csv') {
                res.type('text/csv; charset=utf-8').send(toCsv(notes));
            } else {
                res.type('application/json; charset=utf-8').send(JSON.stringify({ exportedAt: new Date().toISOString(), count: notes.length, notes }, null, 2));
            }
        } catch (error) {
            res.status(500).json({ message: 'Error exporting notes', errorId: logNoteError('export notes', error) });
        }
    }

    public async createNote(req: Request, res: Response): Promise<void> {
        try {
            const { errors, value } = validateNoteInput(req.body, 'create');
            if (Object.keys(errors).length > 0) {
                res.status(400).json({ message: 'Invalid note', errors });
                return;
            }
            const newNote = await this.notesService.createNote(value as Note);
            res.status(201).json(newNote);
        } catch (error) {
            res.status(500).json({ message: 'Error creating note', errorId: logNoteError('create note', error) });
        }
    }

    public async updateNote(req: Request, res: Response): Promise<void> {
        const id = getNoteId(req, res);
        if (id === undefined) return;
        try {
            const { errors, value } = validateNoteInput(req.body, 'update');
            if (Object.keys(errors).length > 0) {
                res.status(400).json({ message: 'Invalid note', errors });
                return;
            }
            const updatedNote = await this.notesService.updateNote(id, value);
            if (!updatedNote) {
                res.status(404).json({ message: 'Note not found' });
                return;
            }
            res.status(200).json(updatedNote);
        } catch (error) {
            res.status(500).json({ message: 'Error updating note', errorId: logNoteError('update note', error) });
        }
    }

    public async deleteNote(req: Request, res: Response): Promise<void> {
        const id = getNoteId(req, res);
        if (id === undefined) return;
        try {
            const deleted = await this.notesService.deleteNote(id);
            if (!deleted) {
                res.status(404).json({ message: 'Note not found' });
                return;
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting note', errorId: logNoteError('delete note', error) });
        }
    }
}

export default NotesController;
