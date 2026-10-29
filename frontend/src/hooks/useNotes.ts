import { useEffect, useState, useCallback } from 'react';
import { fetchNotes, createNote, updateNote, deleteNote, getErrorMessage } from '../services/api';

export const useNotes = () => {
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(5);
    const [total, setTotal] = useState<number>(0);
    const [search, setSearch] = useState<string>('');

    const loadNotes = useCallback(async (p = 1, q?: string) => {
        setLoading(true);
        try {
            const res: any = await fetchNotes(p, limit, q);
            // res: { data, total, page, limit, q }
            setNotes(res.data || res);
            setTotal(res.total || 0);
            setPage(res.page || p);
            if (q !== undefined) setSearch(q);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        loadNotes(1, search || undefined);
    }, []);

    // add/edit return null on success or an error message so the editor can keep the user's text on failure
    const addNote = async (note: any): Promise<string | null> => {
        try {
            await createNote(note);
            setError(null);
            await loadNotes(page, search || undefined);
            return null;
        } catch (err) {
            const message = getErrorMessage(err);
            setError(message);
            return message;
        }
    };

    const editNote = async (id: number, updatedNote: any): Promise<string | null> => {
        try {
            await updateNote(id, updatedNote);
            setError(null);
            await loadNotes(page, search || undefined);
            return null;
        } catch (err) {
            const message = getErrorMessage(err);
            setError(message);
            return message;
        }
    };

    const removeNote = async (id: number) => {
        try {
            await deleteNote(id);
            setError(null);
            // refresh current page (preserve search)
            const newPage = Math.max(1, page);
            loadNotes(newPage, search || undefined);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const goToPage = (p: number) => {
        const next = Math.max(1, Math.min(p, totalPages));
        setPage(next);
        loadNotes(next, search || undefined);
    };

    const nextPage = () => goToPage(page + 1);
    const prevPage = () => goToPage(page - 1);

    const searchNotes = (q: string) => {
        // execute search starting at page 1
        setPage(1);
        setSearch(q);
        loadNotes(1, q || undefined);
    };

    return { notes, loading, error, addNote, editNote, removeNote, fetchNotes: loadNotes, page, total, totalPages, goToPage, nextPage, prevPage, search, searchNotes };
};

export default useNotes;