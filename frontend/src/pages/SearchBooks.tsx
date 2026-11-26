import React, { useState } from 'react';
import BookCard from '../components/BookCard';
import { searchBooks, BookHit } from '../services/hardcover';

/**
 * SearchBooks page
 * Searches Hardcover's catalog through the backend proxy (see services/hardcover.ts).
 * Hardcover no longer allows `_ilike` filters, so this uses their `search` query
 * (Typesense-backed), which matches partial words and tolerates typos.
 */

const PER_PAGE = 25;

const SearchBooks: React.FC = () => {
  const [term, setTerm] = useState('');
  const [searchedTerm, setSearchedTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BookHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const runSearch = async (q: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const { hits, total: found } = await searchBooks(q, p, PER_PAGE);
      setResults(hits);
      setTotal(found);
      setPage(p);
      setSearchedTerm(q);
      setHasSearched(true);
    } catch (err: any) {
      setError(err && err.message ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim() !== '') runSearch(term.trim(), 1);
  };

  return (
    <div className="mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-blue-700 dark:text-blue-300">Search Books</h1>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Search Hardcover for books by title, author, series or ISBN. Partial words are fine.</p>

      <form onSubmit={submit} className="mb-4 flex space-x-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Enter a title, author or series"
          className="flex-1 p-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
        />
        <button type="submit" disabled={loading || term.trim() === ''} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60">{loading ? 'Searching…' : 'Search'}</button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-sm text-red-800 dark:text-red-200 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {hasSearched && !error && (
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          {total} {total === 1 ? 'result' : 'results'} for “{searchedTerm}”
        </p>
      )}

      <div>
        {results.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">{hasSearched ? 'No results. Try a different search term.' : 'Enter a search term to begin.'}</div>
        ) : (
          <ul className="space-y-3">
            {results.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </ul>
        )}
      </div>

      {total > PER_PAGE && (
        <div className="mt-6 flex items-center space-x-2">
          <button onClick={() => runSearch(searchedTerm, page - 1)} disabled={loading || page <= 1} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 dark:text-white rounded disabled:opacity-50">Prev</button>
          <span className="text-sm text-gray-700 dark:text-gray-200">Page {page} of {totalPages}</span>
          <button onClick={() => runSearch(searchedTerm, page + 1)} disabled={loading || page >= totalPages} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 dark:text-white rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
};

export default SearchBooks;
