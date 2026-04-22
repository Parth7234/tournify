'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './viewer.module.css';

export default function ViewerLayoutClient({ children }) {
  const [theme, setTheme] = useState('dark');
  const [sports, setSports] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) fetchSports(selectedEvent);
  }, [selectedEvent]);

  async function fetchEvents() {
    try {
      const res = await fetch('/api/public/events');
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) setSelectedEvent(data[0]._id);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchSports(eventId) {
    try {
      const res = await fetch(`/api/public/sports?eventId=${eventId}`);
      const data = await res.json();
      setSports(data);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className={styles.viewerLayout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>Tournify</span>
          </Link>

          <nav className={styles.sportTabs}>
            <Link
              href="/"
              className={`${styles.sportTab} ${pathname === '/' ? styles.sportTabActive : ''}`}
            >
              Home
            </Link>
            {sports.map(sport => (
              <Link
                key={sport._id}
                href={`/sport/${sport._id}`}
                className={`${styles.sportTab} ${pathname === `/sport/${sport._id}` ? styles.sportTabActive : ''}`}
              >
                {sport.name}
              </Link>
            ))}
          </nav>

          <div className={styles.headerActions}>
            {events.length > 1 && (
              <select
                className={styles.eventSelect}
                value={selectedEvent || ''}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                {events.map(ev => (
                  <option key={ev._id} value={ev._id}>{ev.name}</option>
                ))}
              </select>
            )}
            <button
              className={styles.themeToggle}
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>
      <main className={styles.mainContent}>
        {children}
      </main>
      <footer className={styles.footer}>
        <p>Tournify {new Date().getFullYear()} — College Sports Tournament Tracker</p>
      </footer>
    </div>
  );
}
