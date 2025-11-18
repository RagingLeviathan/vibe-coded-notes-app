import React, { useEffect, useState } from 'react';
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';
import { useNotes } from '../hooks/useNotes';

const Home: React.FC = () => {
    const { notes, fetchNotes, addNote, editNote, removeNote, loading, page, totalPages, goToPage, search, searchNotes } = useNotes();

    // Local input state and debounce timer so we don't call search on every keystroke
    const [query, setQuery] = useState<string>(search || '');
    const [editingNote, setEditingNote] = useState<any | null>(null);

    const openEditorFor = (n: any) => {
        console.log('Home: openEditorFor', n);
        setEditingNote(n);
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
            <h1 className="text-4xl font-extrabold text-blue-700 dark:text-blue-300 mb-4">Notes</h1>

            {/* Search bar */}
            <div className="mb-4">
                <input
                    type="search"
                    placeholder="Search notes by title or content..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <NoteEditor onSave={(note) => {
                    if ((note as any).id) {
                        // call edit
                        editNote((note as any).id, { title: note.title, content: note.content });
                        setEditingNote(null);
                    } else {
                        addNote(note as any);
                    }
                }} initialNote={editingNote || undefined} />
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