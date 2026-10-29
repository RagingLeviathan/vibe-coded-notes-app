import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';
import { useNotes } from '../hooks/useNotes';
import { exportNotes, getErrorMessage } from '../services/api';

const Home: React.FC = () => {
    const { notes, fetchNotes, addNote, editNote, removeNote, loading, error, page, totalPages, goToPage, search, searchNotes } = useNotes();
    const [searchParams, setSearchParams] = useSearchParams();

    // Local input state and debounce timer so we don't call search on every keystroke
    const [query, setQuery] = useState<string>(search || '');
    const [editingNote, setEditingNote] = useState<any | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const openEditorFor = (n: any) => {
        setEditingNote(n);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Arriving from a book page (?bookId=..&bookTitle=..&bookSlug=..) opens the editor pre-linked to that book
    useEffect(() => {
        const id = Number(searchParams.get('bookId'));
        const title = searchParams.get('bookTitle');
        if (Number.isInteger(id) && id > 0 && title) {
            setEditingNote({ bookId: id, bookTitle: title, bookSlug: searchParams.get('bookSlug') });
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const handleExport = async (format: 'json' | 'csv') => {
        setExporting(true);
        setExportError(null);
        try {
            await exportNotes(format);
        } catch (err) {
            setExportError(getErrorMessage(err));
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    useEffect(() => {
        const t = setTimeout(() => {
            // trigger search when query stabilizes
            searchNotes(query);
        }, 300);
        return () => clearTimeout(t);
    }, [query]);

    return (
        <div className="mx-auto p-4 max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h1 className="text-4xl font-extrabold text-blue-700 dark:text-blue-300">Notes</h1>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Backup:</span>
                    <button onClick={() => handleExport('json')} disabled={exporting} className="px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800 disabled:opacity-50">Export JSON</button>
                    <button onClick={() => handleExport('csv')} disabled={exporting} className="px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800 disabled:opacity-50">Export CSV</button>
                </div>
            </div>

            {exportError && (
                <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-sm text-red-800 dark:text-red-200 rounded">
                    Export failed: {exportError}
                </div>
            )}
            {error && (
                <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-sm text-red-800 dark:text-red-200 rounded">
                    {error}
                </div>
            )}

            {/* Search bar */}
            <div className="mb-4">
                <input
                    type="search"
                    placeholder="Search notes by title, content or source..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <NoteEditor
                    key={editingNote ? (editingNote.id ?? `book-${editingNote.bookId}`) : 'new'}
                    onSave={async (note) => {
                        const { id, ...fields } = note as any;
                        const failure = id ? await editNote(id, fields) : await addNote(fields);
                        if (!failure) setEditingNote(null);
                        return failure;
                    }}
                    onCancel={() => setEditingNote(null)}
                    initialNote={editingNote || undefined}
                />
            </div>

            <div className="mt-6">
                <NoteList notes={notes} onDelete={removeNote} onEdit={(n) => openEditorFor(n)} />
            </div>

            {loading && <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>}

            {/* Pagination */}
            <div className="mt-6 flex items-center space-x-2">
                <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 dark:text-white rounded disabled:opacity-50">Prev</button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                    const p = idx + 1;
                    return (
                        <button key={p} onClick={() => goToPage(p)} className={`px-3 py-1 rounded ${p === page ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-gray-700 dark:text-gray-200'}`}>
                            {p}
                        </button>
                    );
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 dark:text-white rounded disabled:opacity-50">Next</button>
            </div>
        </div>
    );
};

export default Home;