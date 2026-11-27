import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import NoteList from '../components/NoteList';
import { useNotes } from '../hooks/useNotes';

const SourceNotesResults: React.FC<{ source: string }> = ({ source }) => {
    const { notes, loading, error, page, total, totalPages, goToPage } = useNotes(source);

    return (
        <>
            <h1 className="mt-4 text-3xl font-bold text-blue-700 dark:text-blue-300 break-words">Notes with source: {source}</h1>
            {!loading && !error && <p className="my-4 text-sm text-gray-600 dark:text-gray-300">{total} {total === 1 ? 'note' : 'notes'} with this exact source</p>}
            {loading && <p className="feedback" role="status">Loading notes...</p>}
            {error && <p className="feedback feedback-error" role="alert">{error}</p>}
            {!loading && !error && <NoteList notes={notes} />}
            <nav className="pagination flex flex-wrap items-center gap-2" aria-label="Source note pages">
                <button type="button" onClick={() => goToPage(page - 1)} disabled={loading || page <= 1}>Previous</button>
                <span className="text-sm text-gray-700 dark:text-gray-200">Page {page} of {totalPages}</span>
                <button type="button" onClick={() => goToPage(page + 1)} disabled={loading || page >= totalPages}>Next</button>
            </nav>
        </>
    );
};

const SourceNotes: React.FC = () => {
    const { hash } = useLocation();
    const params = new URLSearchParams(hash.slice(1));
    const source = params.get('source');
    return (
        <div className="mx-auto p-4 max-w-3xl">
            <Link to="/" className="text-sm text-blue-700 dark:text-blue-300 hover:underline">← Back to notes</Link>
            {source && source.trim() ? <SourceNotesResults key={source} source={source} /> : <p className="mt-4 feedback feedback-error" role="alert">No source was specified.</p>}
        </div>
    );
};

export default SourceNotes;
