import React, { useState } from 'react';
import { searchBooks, BookHit } from '../services/hardcover';
import BookTag from './BookTag';

export interface LinkedBook {
    bookId: number;
    bookTitle: string;
    bookSlug?: string | null;
}

interface BookPickerProps {
    value: LinkedBook | null;
    onChange: (book: LinkedBook | null) => void;
    required?: boolean;
}

// Optional control for linking a note to a Hardcover book
const BookPicker: React.FC<BookPickerProps> = ({ value, onChange, required = false }) => {
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<BookHit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const runSearch = async () => {
        const q = term.trim();
        if (!q) return;
        setLoading(true);
        setError(null);
        try {
            const res = await searchBooks(q, 1, 8);
            setResults(res.hits);
            setSearched(true);
        } catch (err: any) {
            setError(err && err.message ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const choose = (b: BookHit) => {
        const id = Number(b.id);
        if (!Number.isInteger(id) || id < 1) return;
        onChange({ bookId: id, bookTitle: b.title || 'Untitled', bookSlug: b.slug || null });
        setOpen(false);
        setResults([]);
        setTerm('');
        setSearched(false);
    };

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Book ({required ? 'required' : 'optional'}):</span>
                {value ? <BookTag title={value.bookTitle} slug={value.bookSlug} /> : <span className="text-sm text-gray-500 dark:text-gray-400">none</span>}
                <button type="button" onClick={() => setOpen(!open)} className="text-sm px-2 py-1 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:hover:bg-purple-800">
                    {open ? 'Close' : value ? 'Change' : 'Link a book'}
                </button>
                {value && (
                    <button type="button" onClick={() => onChange(null)} className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        Remove link
                    </button>
                )}
            </div>

            {open && (
                <div className="mt-2 p-3 border rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    runSearch();
                                }
                            }}
                            placeholder="Search Hardcover by title or author"
                            className="flex-1 p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                        <button type="button" onClick={runSearch} disabled={loading || term.trim() === ''} className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
                            {loading ? 'Searching…' : 'Search'}
                        </button>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
                    {searched && !error && results.length === 0 && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No results.</p>}
                    {results.length > 0 && (
                        <ul className="mt-2 space-y-1">
                            {results.map((b) => (
                                <li key={b.id}>
                                    <button type="button" onClick={() => choose(b)} className="w-full text-left p-2 rounded hover:bg-blue-50 dark:hover:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
                                        <span className="font-medium">{b.title || 'Untitled'}</span>
                                        {b.authors.length > 0 && <span className="text-gray-600 dark:text-gray-300"> — {b.authors.join(', ')}</span>}
                                        {b.releaseYear && <span className="text-gray-500 dark:text-gray-400"> ({b.releaseYear})</span>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookPicker;
