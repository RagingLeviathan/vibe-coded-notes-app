import { Request, Response } from 'express';
import { NotesService, Note } from '../services/notesService';
import { validateNoteInput } from '../validation/noteInput';

const MAX_PAGE_SIZE = 100;

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

class NotesController {
    private notesService: NotesService;

    constructor() {
        this.notesService = new NotesService();
    }

    public async getAllNotes(req: Request, res: Response): Promise<void> {
        try {
            const rawPage = req.query.page ? parseInt(String(req.query.page), 10) : 1;
            const rawLimit = req.query.limit ? parseInt(String(req.query.limit), 10) : 5;
            const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
            const limit = Number.isNaN(rawLimit) ? 5 : Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit));
            const q = req.query.q ? String(req.query.q) : undefined;
            const fields = req.query.fields ? String(req.query.fields).split(',').map((f) => f.trim()) : undefined;
            const result = await this.notesService.getAllNotes(page, limit, q, fields);
            console.log('GET /api/notes ->', result.rows.length, 'rows (total', result.total, ')', q ? `q=${q}` : '');
            res.status(200).json({ data: result.rows, total: result.total, page, limit, q, fields });
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving notes', error });
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
            res.status(500).json({ message: 'Error exporting notes' });
        }
    }

    public async getNoteById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (Number.isNaN(id)) {
                res.status(400).json({ message: 'Invalid note id' });
                return;
            }
            const note = await this.notesService.getNoteById(id);
            if (!note) {
                res.status(404).json({ message: 'Note not found' });
                return;
            }
            res.status(200).json(note);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving note', error });
        }
    }

    public async createNote(req: Request, res: Response): Promise<void> {
        try {
            console.log('POST /api/notes body ->', req.body);
            const { errors, value } = validateNoteInput(req.body, 'create');
            if (Object.keys(errors).length > 0) {
                res.status(400).json({ message: 'Invalid note', errors });
                return;
            }
            const newNote = await this.notesService.createNote(value as Note);
            res.status(201).json(newNote);
        } catch (error) {
            res.status(500).json({ message: 'Error creating note', error });
        }
    }

    public async updateNote(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (Number.isNaN(id)) {
                res.status(400).json({ message: 'Invalid note id' });
                return;
            }
            console.log(`PUT /api/notes/${id} body ->`, req.body);
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
            res.status(500).json({ message: 'Error updating note', error });
        }
    }

    public async deleteNote(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (Number.isNaN(id)) {
                res.status(400).json({ message: 'Invalid note id' });
                return;
            }
            await this.notesService.deleteNote(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting note', error });
        }
    }
}

export default NotesController;
