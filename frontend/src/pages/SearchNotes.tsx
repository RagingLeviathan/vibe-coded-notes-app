import React, { useEffect, useState } from 'react';
import NoteList from '../components/NoteList';
import { fetchNotes } from '../services/api';

const FIELD_OPTIONS = [
    { key: 'title', label: 'Title' },
    { key: 'content', label: 'Description' },
    { key: 'sourceShort', label: 'Source (short)' },
    { key: 'sourceFull', label: 'Source (full)' },
    { key: 'bookTitle', label: 'Book' },
];

const PAGE_SIZE = 10;

const SearchNotes: React.FC = () => {
    const [query, setQuery] = useState('');
    const [fields, setFields] = useState<string[]>(FIELD_OPTIONS.map((f) => f.key));
    const [page, setPage] = useState(1);
    const [notes, setNotes] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Any change to the query or fields goes back to page 1
    useEffect(() => {
        setPage(1);
    }, [query, fields]);

    // Debounced server-side search over the full dataset; `cancelled` drops stale responses
    useEffect(() => {
        let cancelled = false;
        const t = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const res: any = await fetchNotes(page, PAGE_SIZE, query.trim(), fields);
                if (cancelled) return;
                setNotes(res.data || []);
                setTotal(res.total || 0);
            } catch (err) {
                if (!cancelled) setError('Search failed. Is the backend running?');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [query, fields, page]);

    const toggleField = (key: string) => {
        setFields((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
    };

    const noFields = fields.length === 0;
    const searching = query.trim().length > 0;

    return (
        <div className="mx-auto p-4 max-w-3xl">
            <h1 className="text-4xl font-extrabold text-blue-700 dark:text-blue-300 mb-4">Search Notes</h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                <input
                    type="search"
                    autoFocus
                    placeholder="Search for part of a word or phrase..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300"
                />

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Search in:</span>
                    {FIELD_OPTIONS.map((opt) => (
                        <label key={opt.key} className="inline-flex items-center text-sm text-gray-800 dark:text-gray-100 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={fields.includes(opt.key)}
                                onChange={() => toggleField(opt.key)}
                                className="mr-2"
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
                {noFields && <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">No fields selected, so all fields are searched.</p>}
            </div>

            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                {loading ? 'Searching...' : searching ? `${total} ${total === 1 ? 'match' : 'matches'} across all notes` : `${total} notes in total`}
            </p>

            {error && <p className="mb-3 text-red-600 dark:text-red-400">{error}</p>}

            <NoteList notes={notes} />

            <div className="mt-6 flex items-center space-x-2">
                <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 dark:text-white rounded disabled:opacity-50">Prev</button>
                <span className="text-sm text-gray-700 dark:text-gray-200">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 dark:text-white rounded disabled:opacity-50">Next</button>
            </div>
        </div>
    );
};

export default SearchNotes;
