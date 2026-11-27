import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';
import { useNotes } from '../hooks/useNotes';
import { exportNotes, getErrorMessage } from '../services/api';

const Home: React.FC = () => {
    const { notes, addNote, editNote, removeNote, loading, error, page, total, totalPages, goToPage, search, searchNotes } = useNotes();
    const [searchParams, setSearchParams] = useSearchParams();

    // Local input state and debounce timer so we don't call search on every keystroke
    const [query, setQuery] = useState<string>(search || '');
    const [editingNote, setEditingNote] = useState<any | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const openEditorFor = (n: any) => {
        setEditingNote(n);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Arriving from a book page (?bookId=..&bookTitle=..&bookSlug=..) opens the editor pre-linked to that book
    useEffect(() => {
        const id = Number(searchParams.get('bookId'));
        const title = searchParams.get('bookTitle');
        if (Number.isInteger(id) && id > 0 && title) {
            setEditingNote({ bookId: id, bookTitle: title, bookSlug: searchParams.get('bookSlug') });
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const handleExport = async (format: 'json' | 'csv') => {
        setExporting(true);
        setExportError(null);
        try {
            await exportNotes(format);
        } catch (err) {
            setExportError(getErrorMessage(err));
        } finally {
            setExporting(false);
        }
    };
    useEffect(() => {
        const timer = setTimeout(() => searchNotes(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="dashboard">
            <section className="hero-panel" aria-labelledby="dashboard-title">
                <div className="hero-copy">
                    <p className="eyebrow"><span className="status-dot" /> YOUR PERSONAL WEB</p>
                    <h1 id="dashboard-title">A little space for<br /><em>big ideas.</em></h1>
                    <p>Gather your thoughts, follow the threads, and keep everything connected.</p>
                </div>
                <div className="hero-art" aria-hidden="true">
                    <span className="web-orbit web-orbit-one" />
                    <span className="web-orbit web-orbit-two" />
                    <span className="web-orbit web-orbit-three" />
                    <img className="spider-fizz hero-spider" src={new URL('../../spider-fizz-hero-idle.png', import.meta.url).href} alt="" />
                    <span className="hero-art-label">A WEB OF YOUR OWN</span>
                </div>
            </section>

            <div className="dashboard-heading flex flex-wrap items-end justify-between gap-4">
                <div><p className="eyebrow">YOUR WORKSPACE <span className="eyebrow-line" /></p><h2>All notes</h2><p>Your ideas, all in one place.</p></div>
                <label className="search-field">
                    <span className="sr-only">Search notes</span>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
                    <input type="search" placeholder="Search notes by title or content..." value={query} onChange={event => setQuery(event.target.value)} />
                    <span className="search-hint" aria-hidden="true">⌕</span>
                </label>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 text-sm">
                <span>Backup:</span>
                <button onClick={() => handleExport('json')} disabled={exporting} className="px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800 disabled:opacity-50">Export JSON</button>
                <button onClick={() => handleExport('csv')} disabled={exporting} className="px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800 disabled:opacity-50">Export CSV</button>
            </div>
            {exportError && <p role="alert" className="feedback feedback-error">Export failed: {exportError}</p>}

            <div className="workspace-grid">
                <NoteEditor
                    key={editingNote ? (editingNote.id ?? `book-${editingNote.bookId}`) : 'new'}
                    onSave={async note => {
                        const { id, ...fields } = note;
                        const failure = id ? await editNote(id, fields) : await addNote(fields);
                        if (!failure) setEditingNote(null);
                        return failure;
                    }}
                    onCancel={() => setEditingNote(null)}
                    initialNote={editingNote}
                />

                <section className="notes-section" aria-labelledby="notes-list-heading">
                    <div className="section-heading flex items-center justify-between gap-3">
                        <div><p className="eyebrow">THE COLLECTION</p><h2 id="notes-list-heading">Your notes <span className="note-count">{total}</span></h2></div>
                        <span className="section-meta">LATEST FIRST</span>
                    </div>
                    {loading && <p className="feedback" role="status">Loading notes...</p>}
                    {error && <p className="feedback feedback-error" role="alert">{error}</p>}
                    <NoteList notes={notes} onDelete={removeNote} onEdit={openEditorFor} />
                    <nav className="pagination flex flex-wrap items-center gap-2" aria-label="Note pages">
                        <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1}>Previous</button>
                        {Array.from({ length: totalPages }).map((_, index) => {
                            const number = index + 1;
                            return <button type="button" key={number} onClick={() => goToPage(number)} aria-current={number === page ? 'page' : undefined} className={number === page ? 'is-current' : ''}>{number}</button>;
                        })}
                        <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>Next</button>
                    </nav>
                </section>
            </div>
            <div className="dashboard-footer">
                <span>MADE FOR YOUR MIND</span>
                <span className="footer-mascot"><span>Take it one thread at a time.</span><img className="spider-fizz" src={new URL('../../spider-fizz-crawl-side.png', import.meta.url).href} alt="" loading="lazy" /></span>
            </div>
        </div>
    );
};

export default Home;
