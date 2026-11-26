import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';

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

  return (
    <Router>
      <div className="app-shell min-h-screen">
        <header className="site-header">
          <div className="site-header-inner mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
            <a className="brand flex items-center gap-3" href="/" aria-label="Notes App home">
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none">
                  <path d="M24 3v42M3 24h42M9 9l30 30M39 9 9 39M24 11l9 4 4 9-4 9-9 4-9-4-4-9 4-9 9-4ZM24 17l5 2 2 5-2 5-5 2-5-2-2-5 2-5 5-2Z" />
                  <circle cx="24" cy="24" r="2.5" />
                </svg>
              </span>
              <span><span className="brand-name">Notes App</span><span className="brand-subtitle">YOUR PERSONAL WEB</span></span>
            </a>
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
          {storageError && <p className="storage-warning" role="status">Appearance settings could not be saved in this browser.</p>}
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <Routes><Route path="/" element={<Home />} /></Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
