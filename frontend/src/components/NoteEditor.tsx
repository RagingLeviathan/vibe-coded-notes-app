import React, { useState, useEffect } from 'react';
import BookPicker, { LinkedBook } from './BookPicker';
import { Link } from 'react-router-dom';
import { fetchSourceTags, getErrorMessage, SourceTag } from '../services/api';

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
    const [tags, setTags] = useState<SourceTag[]>([]);
    const [tagError, setTagError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchSourceTags().then(result => { if (!cancelled) setTags(result); })
            .catch(err => { if (!cancelled) setTagError(getErrorMessage(err)); });
        return () => { cancelled = true; };
    }, []);

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
            <div className="editor-intro">
                <div>
                    <div className="editor-topline"><span className="editor-icon" aria-hidden="true">✦</span><span>THE START OF SOMETHING</span></div>
                    <h2 id="editor-heading">{initialNote?.id ? 'Edit note' : 'Create a note'}</h2>
                    <p className="editor-description">{initialNote?.id ? 'Pick up where you left off.' : 'Capture a thought before it floats away.'}</p>
                </div>
                <img className="spider-fizz editor-mascot" src={new URL('../../spider-fizz-hanging.png', import.meta.url).href} alt="" loading="lazy" />
            </div>
            <div className="editor-fields">
                <label>Title<input type="text" placeholder="Title" value={title} onChange={event => setTitle(event.target.value)} /></label>
                <label>Content<textarea placeholder="Content" value={content} onChange={event => setContent(event.target.value)} rows={7} /></label>
                <div className="source-heading"><span>ADD A SOURCE</span><span>OPTIONAL</span></div>
                <label>Saved source tag
                    <select value="" onChange={event => {
                        const tag = tags.find(item => String(item.id) === event.target.value);
                        if (tag) {
                            setSourceShort(tag.sourceShort);
                            setSourceFull(tag.sourceFull);
                            setBook({ bookId: tag.bookId, bookTitle: tag.bookTitle, bookSlug: tag.bookSlug });
                        }
                    }}>
                        <option value="">Choose a saved tag</option>
                        {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.sourceShort} — {tag.bookTitle}</option>)}
                    </select>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-300"><Link className="underline" to="/source-tags">Manage source tags</Link>. A matching short source uses the saved full source and book.</p>
                {tagError && <p className="feedback feedback-error" role="alert">Source tags unavailable: {tagError}</p>}
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
