import React, { useState, useEffect } from 'react';

interface Note {
    id?: number;
    title: string;
    content: string;
    sourceShort?: string;
    sourceFull?: string;
}

interface NoteEditorProps {
    onSave: (note: Note) => void; // may include id for editing
    initialNote?: Partial<Note> | null;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ onSave, initialNote }) => {
    const [title, setTitle] = useState(initialNote ? initialNote.title || '' : '');
    const [content, setContent] = useState(initialNote ? initialNote.content || '' : '');
    const [sourceShort, setSourceShort] = useState(initialNote ? (initialNote.sourceShort || '') : '');
    const [sourceFull, setSourceFull] = useState(initialNote ? (initialNote.sourceFull || '') : '');

    useEffect(() => {
        if (initialNote) {
            setTitle(initialNote.title || '');
            setContent(initialNote.content || '');
            setSourceShort((initialNote as any).sourceShort || '');
            setSourceFull((initialNote as any).sourceFull || '');
        }
    }, [initialNote]);

    const handleSave = () => {
        const note: Note = { title, content, sourceShort: sourceShort || undefined, sourceFull: sourceFull || undefined };
        if (initialNote && (initialNote as any).id) {
            note.id = (initialNote as any).id;
        }
        console.log('NoteEditor: saving note', note);
        onSave(note);
        setTitle('');
        setContent('');
        setSourceShort('');
        setSourceFull('');
    };

    return (
        <div className="note-editor p-6 border border-gray-300 dark:border-gray-700 rounded shadow-lg bg-white dark:bg-gray-800">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-300">{initialNote ? 'Edit Note' : 'Note Editor'}</h2>

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

                {/* Row 3: button centered on larger screens, full width on mobile */}
                <div className="col-span-1 sm:col-span-12 flex justify-center">
                    <button
                        onClick={handleSave}
                        className="w-full sm:w-auto bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 text-lg"
                    >
                        {initialNote ? 'Update' : 'Save Note'}
                    </button>
                </div>
            </div>
            </div>
        </div>
    );
};

export default NoteEditor;