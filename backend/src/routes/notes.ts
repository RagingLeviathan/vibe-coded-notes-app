import { Router, Application } from 'express';
import NotesController from '../controllers/notesController';

const router = Router();
const notesController = new NotesController();

router.get('/notes', notesController.getAllNotes.bind(notesController));
router.post('/notes', notesController.createNote.bind(notesController));
router.put('/notes/:id', notesController.updateNote.bind(notesController));
router.delete('/notes/:id', notesController.deleteNote.bind(notesController));

export const setRoutes = (app: Application) => {
	// Mount under /api so endpoints become /api/notes, /api/notes/:id, etc.
	app.use('/api', router);
};

export default router;