import React, { useEffect, useState } from 'react';
import BookPicker, { LinkedBook } from '../components/BookPicker';
import { fetchSourceTags, getErrorMessage, saveSourceTag, SourceTag } from '../services/api';

const SourceTags: React.FC = () => {
  const [tags, setTags] = useState<SourceTag[]>([]);
  const [editing, setEditing] = useState<SourceTag | null>(null);
  const [short, setShort] = useState('');
  const [full, setFull] = useState('');
  const [book, setBook] = useState<LinkedBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    try {
      setTags(await fetchSourceTags());
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const reset = () => {
    setEditing(null);
    setShort('');
    setFull('');
    setBook(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!short.trim() || !full.trim() || !book) {
      setError('Enter both source codes and choose a book.');
      return;
    }
    const codes = editing && editing.sourceShort !== short.trim()
      ? `“${editing.sourceShort}” or “${short.trim()}”`
      : `“${short.trim()}”`;
    if (!window.confirm(`Saving will replace the full source and linked book on every note with the exact short source ${codes}, including existing notes. Continue?`)) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await saveSourceTag({
        sourceShort: short,
        sourceFull: full,
        bookId: book.bookId,
        bookTitle: book.bookTitle,
        bookSlug: book.bookSlug || null,
      }, editing?.id);
      reset();
      await load();
      setMessage(`Saved. ${result.updatedNotes} matching ${result.updatedNotes === 1 ? 'note was' : 'notes were'} updated.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const edit = (tag: SourceTag) => {
    setEditing(tag);
    setShort(tag.sourceShort);
    setFull(tag.sourceFull);
    setBook({ bookId: tag.bookId, bookTitle: tag.bookTitle, bookSlug: tag.bookSlug });
    setError(null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-blue-700 dark:text-blue-300">Source Tags</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Connect a short source code to its full source and a book. Saving updates all notes with the same exact, case-sensitive short source.</p>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Sources and book links added directly to a note do not automatically create a saved tag. Create one below using the same short source to connect those notes.</p>
      <form className="editor-panel" onSubmit={submit}>
        <h2>{editing ? 'Edit source tag' : 'Create source tag'}</h2>
        <div className="editor-fields">
          <label>Short source<input value={short} onChange={event => setShort(event.target.value)} maxLength={255} required /></label>
          <label>Full source<textarea value={full} onChange={event => setFull(event.target.value)} maxLength={10000} required rows={3} /></label>
          <BookPicker value={book} onChange={setBook} required />
          {error && <p className="feedback feedback-error" role="alert">{error}</p>}
          {message && <p className="feedback" role="status">{message}</p>}
          <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update tag' : 'Create tag'}</button>
          {editing && <button type="button" onClick={reset} disabled={saving}>Cancel</button>}
        </div>
      </form>
      <h2 className="text-xl font-semibold mt-8 mb-3">Saved tags</h2>
      {loading ? <p role="status">Loading tags...</p> : tags.length === 0 ? !error && <p className="text-gray-600 dark:text-gray-300">No source tags yet.</p> : (
        <ul className="space-y-3">
          {tags.map(tag => (
            <li key={tag.id} className="note-card">
              <h3>{tag.sourceShort}</h3>
              <p className="note-content">{tag.sourceFull}</p>
              <p className="note-source-short">{tag.bookTitle}</p>
              <div className="note-actions"><button type="button" onClick={() => edit(tag)}>Edit</button></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SourceTags;
