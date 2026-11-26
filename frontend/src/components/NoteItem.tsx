import React from 'react';
import { Link } from 'react-router-dom';
import SourceTag from './SourceTag';
import BookTag from './BookTag';

export interface NoteData {
    id: number;
    title: string;
    content: string;
    createdAt?: string;
    sourceShort?: string | null;
    sourceFull?: string | null;
    bookId?: number | null;
    bookTitle?: string | null;
    bookSlug?: string | null;
}

interface NoteItemProps {
    note: NoteData;
    onDelete?: (id: number) => void;
    onEdit?: (note: Omit<NoteData, 'createdAt'>) => void;
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
        {(note.sourceFull || (note.bookId && note.bookTitle)) && (
            <div className="mt-3 flex flex-wrap gap-2">
                {note.sourceFull && <SourceTag value={note.sourceFull} />}
                {note.bookId && note.bookTitle && <BookTag title={note.bookTitle} slug={note.bookSlug} />}
            </div>
        )}
        <div className="note-actions flex items-center gap-2">
            <Link to={`/notes/${note.id}`}>View</Link>
            {onEdit && <button type="button" onClick={() => onEdit(note)}>Edit</button>}
            {onDelete && <button type="button" className="delete-button" onClick={() => onDelete(note.id)}>Delete</button>}
        </div>
    </article>
);

export default NoteItem;
