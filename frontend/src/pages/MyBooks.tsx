import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { addNoteLink } from '../services/hardcover';

const MyBooks: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<Array<{ id?: number; slug?: string; title?: string; pages?: number; release_date?: string }>>([]);

  const payload = {
    query: "query MyQuery {\n user_books(\n          where: {\n              user_id: {_eq: 55380}\n          },\n          distinct_on: book_id\n          limit: 5\n          offset: 0\n    ) {\n      book {\n            id\n            slug\n            title\n            pages\n            release_date\n      }\n    }\n}\n",
    operationName: 'MyQuery',
  };

  const fetchMyBooks = async () => {
    setLoading(true);
    setError(null);
    setBooks([]);
    try {
      const res = await fetch('/api/hardcover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      if (json.errors) {
        throw new Error(JSON.stringify(json.errors));
      }
      // Expect data.user_books to be an array of { book: { title, pages, release_date } }
      const arr = (json.data && json.data.user_books) || [];
      const mapped = arr.map((item: any) => item.book || {});
      setBooks(mapped);
    } catch (err: any) {
      setError(err && err.message ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-blue-700 dark:text-blue-300">My Books</h1>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">This will POST a GraphQL query for your books to the backend proxy at <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">/api/hardcover</code>.</p>

      <div className="mb-4">
        <button onClick={fetchMyBooks} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60">{loading ? 'Loading…' : 'Fetch my books'}</button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-sm text-red-800 dark:text-red-200 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {books.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-2">Results</h2>
          <ul className="space-y-3">
            {books.map((b, i) => (
              <li key={i} className="p-3 border rounded bg-gray-50 dark:bg-gray-900">
                <div className="font-semibold">{b.title || <em>No title</em>}</div>
                <div className="text-sm text-gray-600">Pages: {b.pages ?? '—'}</div>
                <div className="text-sm text-gray-600">Release date: {b.release_date ?? '—'}</div>
                {b.id && (
                  <Link to={addNoteLink({ id: b.id, title: b.title, slug: b.slug })} className="inline-block mt-2 text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">Add note</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No books loaded. Click "Fetch my books" to run the query.</div>
      )}
    </div>
  );
};

export default MyBooks;
