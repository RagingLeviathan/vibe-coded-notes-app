import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SourceTag from '../components/SourceTag';
import BookTag from '../components/BookTag';
import { fetchNote } from '../services/api';

interface Note {
    id: number;
    title: string;
    content: string;
    sourceShort?: string;
    sourceFull?: string;
    bookId?: number | null;
    bookTitle?: string | null;
    bookSlug?: string | null;
    createdAt?: string;
}

const NoteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchNote(id as string)
            .then((data) => {
                if (!cancelled) setNote(data);
            })
            .catch((err) => {
                if (cancelled) return;
                setNote(null);
                setError(err && err.response && err.response.status === 404 ? 'This note was not found. It may have been deleted.' : 'Could not load this note. Is the backend running?');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    return (
        <div className="mx-auto p-4 max-w-3xl">
            <Link to="/" className="text-sm text-blue-700 dark:text-blue-300 hover:underline">← Back to notes</Link>

            {loading && <p className="mt-6 text-gray-600 dark:text-gray-300">Loading...</p>}

            {error && (
                <div className="mt-6 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-sm text-red-800 dark:text-red-200 rounded">
                    {error}
                </div>
            )}

            {note && (
                <article className="mt-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border-l-4 border-blue-200 dark:border-blue-300">
                    <h1 className="text-4xl font-extrabold text-blue-800 dark:text-blue-300">{note.title}</h1>
                    {note.sourceShort && <div className="mt-1 text-sm text-blue-400 dark:text-blue-200">{note.sourceShort}</div>}
                    {note.createdAt && <div className="mt-1 text-sm text-gray-500 dark:text-gray-300">{new Date(note.createdAt).toLocaleString()}</div>}
                    <p className="mt-4 text-lg text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{note.content}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {note.sourceFull && <SourceTag value={note.sourceFull} />}
                            {note.bookId && note.bookTitle && <BookTag title={note.bookTitle} slug={note.bookSlug} />}
                        </div>
                </article>
            )}
        </div>
    );
};

export default NoteDetail;
