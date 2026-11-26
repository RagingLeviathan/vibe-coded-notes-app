import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookHit, addNoteLink, bookUrl } from '../services/hardcover';

export type BookDetails = Omit<BookHit, 'id'> & { id?: string | number };

const BookCover: React.FC<{ book: BookDetails }> = ({ book }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="book-cover">
      {book.coverUrl && !failed ? (
        <img src={book.coverUrl} alt={`Cover of ${book.title || 'book'}`} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span>No cover available</span>
      )}
    </div>
  );
};

const BookCard: React.FC<{ book: BookDetails }> = ({ book }) => {
  const url = bookUrl(book.slug);
  return (
    <li className="book-result">
      <BookCover key={`${book.id}:${book.coverUrl || ''}`} book={book} />
      <div className="book-result-details">
        <div className="font-semibold text-gray-900 dark:text-gray-100">{book.title || <em>No title</em>}</div>
        {book.subtitle && <div className="text-sm text-gray-600 dark:text-gray-300">{book.subtitle}</div>}
        {book.authors.length > 0 && <div className="text-sm text-gray-600 dark:text-gray-300">by {book.authors.join(', ')}</div>}
        <div className="text-sm text-gray-600 dark:text-gray-300">Pages: {book.pages ?? '—'} · Year: {book.releaseYear ?? '—'}</div>
        {book.releaseDate && <div className="text-sm text-gray-600 dark:text-gray-300">Release date: {book.releaseDate}</div>}
        {book.rating !== undefined && <div className="text-sm text-gray-600 dark:text-gray-300">Rating: {book.rating.toFixed(1)} / 5{book.ratingsCount !== undefined && ` (${book.ratingsCount.toLocaleString()} ratings)`}</div>}
        {book.series.length > 0 && <div className="text-sm text-gray-600 dark:text-gray-300">Series: {book.series.join(', ')}</div>}
        {book.genres.length > 0 && <div className="text-sm text-gray-600 dark:text-gray-300">Genres: {book.genres.slice(0, 3).join(', ')}</div>}
        <div className="mt-2 flex flex-wrap gap-2">
          {book.id != null && <Link to={addNoteLink({ ...book, id: book.id })} className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">Add note</Link>}
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm px-3 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">View on Hardcover</a>}
        </div>
      </div>
    </li>
  );
};

export default BookCard;
