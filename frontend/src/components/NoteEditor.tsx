import React, { useState, useEffect } from 'react';

interface Note {
    id?: number;
    title: string;
    content: string;
    sourceShort?: string;
    sourceFull?: string;
}

interface NoteEditorProps {
    onSave: (note: Note) => void;
    initialNote?: Partial<Note> | null;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ onSave, initialNote }) => {
    const [title, setTitle] = useState(initialNote?.title || '');
    const [content, setContent] = useState(initialNote?.content || '');
    const [sourceShort, setSourceShort] = useState(initialNote?.sourceShort || '');
    const [sourceFull, setSourceFull] = useState(initialNote?.sourceFull || '');

    useEffect(() => {
        if (initialNote) {
            setTitle(initialNote.title || '');
            setContent(initialNote.content || '');
            setSourceShort(initialNote.sourceShort || '');
            setSourceFull(initialNote.sourceFull || '');
        }
    }, [initialNote]);

    const handleSave = () => {
        const note: Note = { title, content, sourceShort: sourceShort || undefined, sourceFull: sourceFull || undefined };
        if (initialNote?.id) note.id = initialNote.id;
        onSave(note);
        setTitle('');
        setContent('');
        setSourceShort('');
        setSourceFull('');
    };

    return (
        <section className="editor-panel" aria-labelledby="editor-heading">
            <div className="editor-topline"><span className="editor-icon" aria-hidden="true">✦</span><span>THE START OF SOMETHING</span></div>
            <h2 id="editor-heading">{initialNote ? 'Edit note' : 'Create a note'}</h2>
            <p className="editor-description">{initialNote ? 'Pick up where you left off.' : 'Capture a thought before it floats away.'}</p>
            <div className="editor-fields">
                <label>Title<input type="text" placeholder="Title" value={title} onChange={event => setTitle(event.target.value)} /></label>
                <label>Content<textarea placeholder="Content" value={content} onChange={event => setContent(event.target.value)} rows={7} /></label>
                <div className="source-heading"><span>ADD A SOURCE</span><span>OPTIONAL</span></div>
                <label>Short source<input type="text" placeholder="Source (short)" value={sourceShort} onChange={event => setSourceShort(event.target.value)} /></label>
                <label>Full source<input type="text" placeholder="Source (full)" value={sourceFull} onChange={event => setSourceFull(event.target.value)} /></label>
                <button type="button" className="primary-button" onClick={handleSave}><span aria-hidden="true">＋</span> {initialNote ? 'Update note' : 'Save note'}</button>
            </div>
            <p className="editor-footnote"><span aria-hidden="true">✧</span> Every idea starts somewhere.</p>
        </section>
    );
};

export default NoteEditor;
