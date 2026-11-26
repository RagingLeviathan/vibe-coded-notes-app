import React from 'react';

interface NoteItemProps {
    note: {
        id: number;
        title: string;
        content: string;
        createdAt?: string;
        sourceShort?: string;
        sourceFull?: string;
    };
    onDelete: (id: number) => void;
    onEdit?: (note: { id: number; title: string; content: string }) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onEdit }) => (
    <article className="note-card">
        <div className="note-card-top flex items-center justify-between gap-3">
            <span className="note-marker"><span aria-hidden="true">✦</span> NOTE #{note.id}</span>
            {note.createdAt && <time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString()}</time>}
        </div>
        <h3>{note.title}</h3>
        {note.sourceShort && <p className="note-source-short">{note.sourceShort}</p>}
        <p className="note-content">{note.content}</p>
        {note.sourceFull && <p className="note-source-full">Source: {note.sourceFull}</p>}
        <div className="note-actions flex items-center gap-2">
            {onEdit && <button type="button" onClick={() => onEdit({ id: note.id, title: note.title, content: note.content })}>Edit</button>}
            <button type="button" className="delete-button" onClick={() => onDelete(note.id)}>Delete</button>
        </div>
    </article>
);

export default NoteItem;
