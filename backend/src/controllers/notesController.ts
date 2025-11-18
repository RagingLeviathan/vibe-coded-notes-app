import { Request, Response } from 'express';
import { NotesService } from '../services/notesService';

class NotesController {
    private notesService: NotesService;

    constructor() {
        this.notesService = new NotesService();
    }

    public async getAllNotes(req: Request, res: Response): Promise<void> {
        try {
            const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
            const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 5;
            const q = req.query.q ? String(req.query.q) : undefined;
            const result = await this.notesService.getAllNotes(page, limit, q);
            console.log('GET /api/notes ->', result.rows.length, 'rows (total', result.total, ')', q ? `q=${q}` : '');
            res.status(200).json({ data: result.rows, total: result.total, page, limit, q });
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving notes', error });
        }
    }

    public async createNote(req: Request, res: Response): Promise<void> {
        try {
            console.log('POST /api/notes body ->', req.body);
            const newNote = await this.notesService.createNote(req.body);
            res.status(201).json(newNote);
        } catch (error) {
            res.status(500).json({ message: 'Error creating note', error });
        }
    }

    public async updateNote(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id), 10);
            console.log(`PUT /api/notes/${id} body ->`, req.body);
            const updatedNote = await this.notesService.updateNote(id, req.body);
            res.status(200).json(updatedNote);
        } catch (error) {
            res.status(500).json({ message: 'Error updating note', error });
        }
    }

    public async deleteNote(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id), 10);
            await this.notesService.deleteNote(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting note', error });
        }
    }
}

export default NotesController;