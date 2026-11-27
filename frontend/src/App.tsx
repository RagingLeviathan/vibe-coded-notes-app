import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, NavLink, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Hardcover from './pages/Hardcover';
import GraphqlExample from './pages/GraphqlExample';
import SearchBooks from './pages/SearchBooks';
import SearchNotes from './pages/SearchNotes';
import NoteDetail from './pages/NoteDetail';
import SourceTags from './pages/SourceTags';
import SourceNotes from './pages/SourceNotes';
const MyBooksLazy = lazy(() => import('./pages/MyBooks'));

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search Notes' },
  { to: '/source-tags', label: 'Source Tags' },
  { to: '/my-books', label: 'My Books' },
  { to: '/search-books', label: 'Search Books' },
  { to: '/hardcover', label: 'Hardcover' },
  { to: '/graphql-example', label: 'GraphQL Example' },
];

// Inline links on md+ screens, a hamburger-toggled stacked menu on small screens
const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm hover:opacity-100 dark:text-white ${isActive ? 'opacity-100 font-semibold underline' : 'opacity-90'}`;

  return (
    <div className="site-nav mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <nav className="hidden md:flex flex-wrap gap-4" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>{l.label}</NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="md:hidden p-2 rounded"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" className="md:hidden pb-3" aria-label="Main">
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.to === '/'} className={(s) => `block py-3 ${linkClass(s)}`}>{l.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
};

type Theme = 'system' | 'light' | 'dark';
type Accent = 'violet' | 'teal' | 'blue';

const isTheme = (value: string | null): value is Theme =>
  value === 'system' || value === 'light' || value === 'dark';
const isAccent = (value: string | null): value is Accent =>
  value === 'violet' || value === 'teal' || value === 'blue';

function initialAppearance(): { theme: Theme; accent: Accent; storageError: boolean } {
  try {
    const theme = localStorage.getItem('notes-theme');
    const accent = localStorage.getItem('notes-accent');
    return { theme: isTheme(theme) ? theme : 'system', accent: isAccent(accent) ? accent : 'violet', storageError: false };
  } catch (error) {
    console.warn('Could not read appearance preferences:', error);
    return { theme: 'system', accent: 'violet', storageError: true };
  }
}

const App: React.FC = () => {
  const [appearance, setAppearance] = useState(initialAppearance);
  const { theme, accent, storageError } = appearance;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = accent;
    try {
      localStorage.setItem('notes-theme', theme);
      localStorage.setItem('notes-accent', accent);
      setAppearance(current => current.storageError ? { ...current, storageError: false } : current);
    } catch (error) {
      console.warn('Could not save appearance preferences:', error);
      setAppearance(current => current.storageError ? current : { ...current, storageError: true });
    }
  }, [theme, accent]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && preference.matches));
    applyTheme();
    preference.addEventListener('change', applyTheme);
    return () => preference.removeEventListener('change', applyTheme);
  }, [theme]);

  return (
    <Router>
      <div className="app-shell min-h-screen">
        <header className="site-header">
          <div className="site-header-inner mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
            <Link className="brand flex items-center gap-3" to="/" aria-label="Notes App home">
              <span className="brand-mark" aria-hidden="true">
                <img className="spider-fizz" src={new URL('../spider-fizz-head-icon.png', import.meta.url).href} alt="" />
              </span>
              <span><span className="brand-name">Notes App</span><span className="brand-subtitle">YOUR PERSONAL WEB</span></span>
            </Link>
            <div className="appearance-controls flex flex-wrap items-center gap-3" aria-label="Appearance settings">
              <label className="appearance-label">Theme
                <select value={theme} onChange={event => {
                  const value = event.target.value;
                  if (isTheme(value)) setAppearance(current => ({ ...current, theme: value }));
                }}>
                  <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
                </select>
              </label>
              <label className="appearance-label">Accent
                <select value={accent} onChange={event => {
                  const value = event.target.value;
                  if (isAccent(value)) setAppearance(current => ({ ...current, accent: value }));
                }}>
                  <option value="violet">Violet</option><option value="teal">Teal</option><option value="blue">Blue</option>
                </select>
              </label>
            </div>
          </div>
          <Header />
          {storageError && <p className="storage-warning" role="status">Appearance settings could not be saved in this browser.</p>}
        </header>
        <main className="site-main mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchNotes />} />
            <Route path="/source-tags" element={<SourceTags />} />
            <Route path="/source-notes" element={<SourceNotes />} />
            <Route path="/notes/:id" element={<NoteDetail />} />
            <Route path="/hardcover" element={<Hardcover />} />
            <Route path="/graphql-example" element={<GraphqlExample />} />
            <Route path="/my-books" element={<Suspense fallback={<div>Loading...</div>}><MyBooksLazy /></Suspense>} />
            <Route path="/search-books" element={<SearchBooks />} />
          </Routes>
        </main>
        <footer className="site-footer">
          <p>© {new Date().getFullYear()} Developed by <a href="https://github.com/RagingLeviathan">Raging Leviathan</a></p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
