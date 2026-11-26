import React, { useEffect, useState } from 'react';
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';
import { useNotes } from '../hooks/useNotes';

const Home: React.FC = () => {
    const { notes, fetchNotes, addNote, editNote, removeNote, loading, error, page, total, totalPages, goToPage, search, searchNotes } = useNotes();
    const [query, setQuery] = useState<string>(search || '');
    const [editingNote, setEditingNote] = useState<{ id: number; title: string; content: string } | null>(null);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

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
                    <svg className="hero-spider" viewBox="0 0 64 96" fill="none">
                        <path d="M32 0v29M24 43l-9-8-7 5m16 8-12-2-6 7m18 0-10 5-3 9m29-24 9-8 7 5m-16 8 12-2 6 7m-18 0 10 5 3 9" />
                        <circle cx="32" cy="40" r="7" /><ellipse cx="32" cy="53" rx="10" ry="12" />
                    </svg>
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

            <div className="workspace-grid">
                <NoteEditor onSave={note => {
                    if (note.id) {
                        editNote(note.id, { title: note.title, content: note.content });
                        setEditingNote(null);
                    } else {
                        addNote(note);
                    }
                }} initialNote={editingNote} />

                <section className="notes-section" aria-labelledby="notes-list-heading">
                    <div className="section-heading flex items-center justify-between gap-3">
                        <div><p className="eyebrow">THE COLLECTION</p><h2 id="notes-list-heading">Your notes <span className="note-count">{total}</span></h2></div>
                        <span className="section-meta">LATEST FIRST</span>
                    </div>
                    {loading && <p className="feedback" role="status">Loading notes...</p>}
                    {error && <p className="feedback feedback-error" role="alert">Could not update notes. Check the connection and try again.</p>}
                    <NoteList notes={notes} onDelete={removeNote} onEdit={setEditingNote} />
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
            <footer className="dashboard-footer"><span>MADE FOR YOUR MIND</span><span>Take it one thread at a time.</span></footer>
        </div>
    );
};

export default Home;
