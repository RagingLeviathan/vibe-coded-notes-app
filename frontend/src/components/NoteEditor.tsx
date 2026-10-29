import React, { useState, useEffect } from 'react';
import BookPicker, { LinkedBook } from './BookPicker';

interface Note {
    id?: number;
    title: string;
    content: string;
    sourceShort?: string;
    sourceFull?: string;
    bookId?: number | null;
    bookTitle?: string | null;
    bookSlug?: string | null;
}

interface NoteEditorProps {
    // Resolve to an error message string when the save fails (the editor keeps its content), or null on success
    onSave: (note: Note) => Promise<string | null> | string | null | void;
    initialNote?: Partial<Note> | null;
    onCancel?: () => void;
}

const MAX_TITLE = 255;
const MAX_CONTENT = 15000;

const toLinkedBook = (n?: Partial<Note> | null): LinkedBook | null =>
    n && n.bookId ? { bookId: n.bookId, bookTitle: n.bookTitle || 'Untitled', bookSlug: n.bookSlug || null } : null;

const NoteEditor: React.FC<NoteEditorProps> = ({ onSave, initialNote, onCancel }) => {
    const [title, setTitle] = useState(initialNote ? initialNote.title || '' : '');
    const [content, setContent] = useState(initialNote ? initialNote.content || '' : '');
    const [sourceShort, setSourceShort] = useState(initialNote ? (initialNote.sourceShort || '') : '');
    const [sourceFull, setSourceFull] = useState(initialNote ? (initialNote.sourceFull || '') : '');
    const [book, setBook] = useState<LinkedBook | null>(toLinkedBook(initialNote));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialNote) {
            setTitle(initialNote.title || '');
            setContent(initialNote.content || '');
            setSourceShort(initialNote.sourceShort || '');
            setSourceFull(initialNote.sourceFull || '');
            setBook(toLinkedBook(initialNote));
            setError(null);
        }
    }, [initialNote]);

    const handleSave = async () => {
        if (saving) return;
        if (title.trim() === '' || content.trim() === '') {
            setError('Title and content are required.');
            return;
        }
        if (title.trim().length > MAX_TITLE) {
            setError(`Title must be at most ${MAX_TITLE} characters.`);
            return;
        }
        if (content.trim().length > MAX_CONTENT) {
            setError(`Content must be at most ${MAX_CONTENT} characters.`);
            return;
        }

        const note: Note = {
            title,
            content,
            sourceShort,
            sourceFull,
            bookId: book ? book.bookId : null,
            bookTitle: book ? book.bookTitle : null,
            bookSlug: book ? book.bookSlug || null : null,
        };
        if (initialNote && initialNote.id) {
            note.id = initialNote.id;
        }

        setSaving(true);
        setError(null);
        try {
            const failure = await onSave(note);
            if (failure) {
                // Keep everything the user typed so nothing is lost
                setError(failure);
            } else {
                setTitle('');
                setContent('');
                setSourceShort('');
                setSourceFull('');
                setBook(null);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="note-editor p-6 border border-gray-300 dark:border-gray-700 rounded shadow-lg bg-white dark:bg-gray-800">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-300">{initialNote && initialNote.id ? 'Edit Note' : 'Note Editor'}</h2>

            {/* Constrain width on large screens and center */}
            <div className="max-w-5xl mx-auto">
                {/**
                 * Responsive layout:
                 * - mobile: stack fields (1 column)
                 * - sm and up: 12-column layout
                 * - md and up: give content more room and enlarge textarea/button
                 */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                {/* Row 1: Title on its own full-width line */}
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-1 sm:col-span-12 p-3 mb-2 border rounded border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 w-full"
                />

                {/* Row 2: Content takes full available width beneath the title */}
                <textarea
                    placeholder="Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="col-span-1 sm:col-span-12 p-3 mb-2 border rounded border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 w-full h-40 md:h-56 resize-y"
                    rows={4}
                />

                {/* Row 2: source fields span full width on small screens, split on larger */}
                <input
                    type="text"
                    placeholder="Source (short)"
                    value={sourceShort}
                    onChange={(e) => setSourceShort(e.target.value)}
                    className="col-span-1 sm:col-span-6 p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full"
                />

                <input
                    type="text"
                    placeholder="Source (full)"
                    value={sourceFull}
                    onChange={(e) => setSourceFull(e.target.value)}
                    className="col-span-1 sm:col-span-6 p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full"
                />

                {/* Optional Hardcover book link */}
                <BookPicker value={book} onChange={setBook} />

                {error && (
                    <div role="alert" className="col-span-1 sm:col-span-12 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-sm text-red-800 dark:text-red-200 rounded">
                        {error}
                    </div>
                )}

                {/* Row 3: button centered on larger screens, full width on mobile */}
                <div className="col-span-1 sm:col-span-12 flex justify-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full sm:w-auto bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 text-lg disabled:opacity-60"
                    >
                        {saving ? 'Saving…' : initialNote && initialNote.id ? 'Update' : 'Save Note'}
                    </button>
                    {initialNote && onCancel && (
                        <button
                            onClick={onCancel}
                            disabled={saving}
                            className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-6 py-3 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-lg"
                        >
                            Cancel
                        </button>
                    )}
                </div>

            </div>
            </div>
        </div>
    );
};

export default NoteEditor;