import React, { useState, useEffect } from 'react';
import BookPicker, { LinkedBook } from './BookPicker';

interface Note {
    id?: number;
    title: string;
    content: string;
    sourceShort?: string | null;
    sourceFull?: string | null;
    bookId?: number | null;
    bookTitle?: string | null;
    bookSlug?: string | null;
}

interface NoteEditorProps {
    onSave: (note: Note) => Promise<string | null> | string | null | void;
    initialNote?: Partial<Note> | null;
    onCancel?: () => void;
}

const toLinkedBook = (note?: Partial<Note> | null): LinkedBook | null =>
    note && note.bookId ? { bookId: note.bookId, bookTitle: note.bookTitle || 'Untitled', bookSlug: note.bookSlug || null } : null;

const NoteEditor: React.FC<NoteEditorProps> = ({ onSave, initialNote, onCancel }) => {
    const [title, setTitle] = useState(initialNote?.title || '');
    const [content, setContent] = useState(initialNote?.content || '');
    const [sourceShort, setSourceShort] = useState(initialNote?.sourceShort || '');
    const [sourceFull, setSourceFull] = useState(initialNote?.sourceFull || '');
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
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required.');
            return;
        }
        if (title.trim().length > 255 || content.trim().length > 15000) {
            setError(title.trim().length > 255 ? 'Title must be at most 255 characters.' : 'Content must be at most 15000 characters.');
            return;
        }
        const note: Note = {
            title, content, sourceShort, sourceFull,
            bookId: book ? book.bookId : null,
            bookTitle: book ? book.bookTitle : null,
            bookSlug: book ? book.bookSlug || null : null,
        };
        if (initialNote?.id) note.id = initialNote.id;
        setSaving(true);
        setError(null);
        try {
            const failure = await onSave(note);
            if (failure) {
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
        <section className="editor-panel" aria-labelledby="editor-heading">
            <div className="editor-topline"><span className="editor-icon" aria-hidden="true">✦</span><span>THE START OF SOMETHING</span></div>
            <h2 id="editor-heading">{initialNote?.id ? 'Edit note' : 'Create a note'}</h2>
            <p className="editor-description">{initialNote?.id ? 'Pick up where you left off.' : 'Capture a thought before it floats away.'}</p>
            <div className="editor-fields">
                <label>Title<input type="text" placeholder="Title" value={title} onChange={event => setTitle(event.target.value)} /></label>
                <label>Content<textarea placeholder="Content" value={content} onChange={event => setContent(event.target.value)} rows={7} /></label>
                <div className="source-heading"><span>ADD A SOURCE</span><span>OPTIONAL</span></div>
                <label>Short source<input type="text" placeholder="Source (short)" value={sourceShort} onChange={event => setSourceShort(event.target.value)} /></label>
                <label>Full source<input type="text" placeholder="Source (full)" value={sourceFull} onChange={event => setSourceFull(event.target.value)} /></label>
                <BookPicker value={book} onChange={setBook} />
                {error && <p className="feedback feedback-error" role="alert">{error}</p>}
                <button type="button" className="primary-button" onClick={handleSave} disabled={saving}><span aria-hidden="true">＋</span> {saving ? 'Saving…' : initialNote?.id ? 'Update note' : 'Save note'}</button>
                {initialNote && onCancel && <button type="button" onClick={onCancel} disabled={saving}>Cancel</button>}
            </div>
            <p className="editor-footnote"><span aria-hidden="true">✧</span> Every idea starts somewhere.</p>
        </section>
    );
};

export default NoteEditor;
