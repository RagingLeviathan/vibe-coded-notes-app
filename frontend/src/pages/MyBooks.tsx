import React, { useState } from 'react';
import BookCard, { BookDetails } from '../components/BookCard';
import { safeCoverUrl } from '../services/hardcover';

interface HardcoverBook {
  id?: number | null;
  slug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  pages?: number | null;
  release_date?: string | null;
  release_year?: number | null;
  rating?: number | null;
  ratings_count?: number | null;
  image?: { url?: string | null } | null;
  cached_image?: { url?: string | null } | null;
  contributions?: Array<{ contribution?: string | null; author?: { name?: string | null } | null }>;
  book_series?: Array<{ series?: { name?: string | null } | null }>;
  cached_tags?: { Genre?: Array<{ tag?: string | null }> } | null;
}

const present = (value: string | null | undefined): value is string => typeof value === 'string' && value.length > 0;

const toBookDetails = (book: HardcoverBook): BookDetails => ({
  id: book.id ?? undefined,
  slug: book.slug ?? undefined,
  title: book.title ?? undefined,
  subtitle: book.subtitle ?? undefined,
  pages: book.pages ?? undefined,
  releaseYear: book.release_year ?? undefined,
  releaseDate: book.release_date ?? undefined,
  coverUrl: safeCoverUrl(book.image?.url) || safeCoverUrl(book.cached_image?.url),
  rating: typeof book.rating === 'number' && Number.isFinite(book.rating) && book.rating > 0 ? book.rating : undefined,
  ratingsCount: typeof book.ratings_count === 'number' && Number.isFinite(book.ratings_count) && book.ratings_count >= 0 ? book.ratings_count : undefined,
  authors: (book.contributions || []).filter(c => !c.contribution || c.contribution.toLowerCase() === 'author').map(c => c.author?.name).filter(present),
  series: (book.book_series || []).map(s => s.series?.name).filter(present),
  genres: (book.cached_tags?.Genre || []).map(g => g.tag).filter(present),
});

const payload = {
  query: `query MyQuery {
    user_books(where: { user_id: { _eq: 55380 } }, distinct_on: book_id, limit: 5, offset: 0) {
      book {
        id slug title subtitle pages release_date release_year rating ratings_count cached_tags cached_image
        image { url }
        contributions { contribution author { name } }
        book_series { series { name } }
      }
    }
  }`,
  operationName: 'MyQuery',
};

const MyBooks: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<BookDetails[]>([]);

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
      if (!Array.isArray(json.data?.user_books)) throw new Error('Invalid response from Hardcover');
      setBooks(json.data.user_books.map((item: { book: HardcoverBook | null }) => toBookDetails(item.book || {})));
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
              <BookCard key={b.id ?? i} book={b} />
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
