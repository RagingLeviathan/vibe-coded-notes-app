import React from 'react';
import { Link } from 'react-router-dom';
import SourceTag from './SourceTag';
import BookTag from './BookTag';

interface NoteData {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    sourceShort?: string;
    sourceFull?: string;
    bookId?: number | null;
    bookTitle?: string | null;
    bookSlug?: string | null;
}

interface NoteItemProps {
    note: NoteData;
    onDelete?: (id: number) => void;
    onEdit?: (note: Omit<NoteData, 'createdAt'>) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onEdit }) => {
    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-4 border-l-4 border-blue-200 dark:border-blue-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-blue-800 dark:text-blue-300">{note.title}</h2>
                    {note.sourceShort && <div className="text-sm text-blue-400 dark:text-blue-200">{note.sourceShort}</div>}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-300">{note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-200 mt-2">{note.content}</p>
            {(note.sourceFull || (note.bookId && note.bookTitle)) && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {note.sourceFull && <SourceTag value={note.sourceFull} />}
                    {note.bookId && note.bookTitle && <BookTag title={note.bookTitle} slug={note.bookSlug} />}
                </div>
            )}
            <div className="mt-3">
                <div className="flex space-x-2">
                    <Link
                        to={`/notes/${note.id}`}
                        className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        View
                    </Link>
                    {onEdit && (
                        <button
                            className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                            onClick={() => {
                                console.log('NoteItem: Edit clicked', note.id);
                                onEdit({ id: note.id, title: note.title, content: note.content, sourceShort: note.sourceShort, sourceFull: note.sourceFull, bookId: note.bookId, bookTitle: note.bookTitle, bookSlug: note.bookSlug });
                            }}
                        >
                            Edit
                        </button>
                    )}

                    {onDelete && (
                        <button
                            className="bg-red-500 dark:bg-red-600 text-white py-1 px-3 rounded hover:bg-red-600 dark:hover:bg-red-700"
                            onClick={() => onDelete(note.id)}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteItem;