import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, NavLink, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Hardcover from './pages/Hardcover';
import GraphqlExample from './pages/GraphqlExample';
import SearchBooks from './pages/SearchBooks';
import SearchNotes from './pages/SearchNotes';
import NoteDetail from './pages/NoteDetail';
const MyBooksLazy = lazy(() => import('./pages/MyBooks'));

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search Notes' },
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
    <header className="bg-blue-600 text-white dark:bg-blue-700">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-semibold">Notes App</Link>
        <nav className="hidden md:flex space-x-4" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>{l.label}</NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="md:hidden p-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-white"
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
        <nav id="mobile-nav" className="md:hidden border-t border-blue-500 dark:border-blue-600 px-4 pb-3" aria-label="Main">
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.to === '/'} className={(s) => `block py-3 ${linkClass(s)}`}>{l.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 dark:from-blue-900 dark:via-black dark:to-black">
        <Header />

        <main className="max-w-4xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchNotes />} />
            <Route path="/notes/:id" element={<NoteDetail />} />
            <Route path="/hardcover" element={<Hardcover />} />
            <Route path="/graphql-example" element={<GraphqlExample />} />
            <Route
              path="/my-books"
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <MyBooksLazy />
                </Suspense>
              }
            />
            <Route path="/search-books" element={<SearchBooks />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;