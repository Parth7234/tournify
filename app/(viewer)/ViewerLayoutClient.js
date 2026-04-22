'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ViewerLayoutClient({ children }) {
  const [sports, setSports] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => { if (selectedEvent) fetchSports(selectedEvent); }, [selectedEvent]);
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  async function fetchEvents() {
    try {
      const res = await fetch('/api/public/events');
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) setSelectedEvent(data[0]._id);
    } catch (e) { console.error(e); }
  }

  async function fetchSports(eventId) {
    try {
      const res = await fetch(`/api/public/sports?eventId=${eventId}`);
      const data = await res.json();
      setSports(data);
    } catch (e) { console.error(e); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-primary-container/10 shadow-[0_1px_3px_rgba(138,154,91,0.06)]">
        <div className="flex justify-between items-center w-full px-5 md:px-6 py-3 max-w-[1200px] mx-auto min-h-[56px]">
          {/* Left — Brand + Nav */}
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-primary-container/30 group-hover:shadow-md group-hover:shadow-primary-container/40 transition-shadow">
                T
              </div>
              <span className="text-lg font-extrabold text-primary tracking-tight hidden sm:inline">
                Tournify
              </span>
            </Link>

            <nav className="hidden md:flex gap-1 text-xs font-semibold">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  pathname === '/'
                    ? 'text-primary bg-primary-fixed/30 shadow-sm shadow-primary/5'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                Home
              </Link>
              {sports.map(sport => (
                <Link
                  key={sport._id}
                  href={`/sport/${sport._id}`}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    pathname === `/sport/${sport._id}`
                      ? 'text-primary bg-primary-fixed/30 shadow-sm shadow-primary/5'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  {sport.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right — Event selector + Search */}
          <div className="flex items-center gap-2 md:gap-3">
            {events.length > 1 && (
              <select
                className="bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface-variant focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors cursor-pointer"
                value={selectedEvent || ''}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                {events.map(ev => (
                  <option key={ev._id} value={ev._id}>{ev.name}</option>
                ))}
              </select>
            )}
            <button className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined text-xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-outline-variant/20 bg-white/95 backdrop-blur-xl animate-fade-in">
            <nav className="flex flex-col px-5 py-3 gap-1">
              <Link
                href="/"
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === '/' ? 'text-primary bg-primary-fixed/30' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                Home
              </Link>
              {sports.map(sport => (
                <Link
                  key={sport._id}
                  href={`/sport/${sport._id}`}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    pathname === `/sport/${sport._id}` ? 'text-primary bg-primary-fixed/30' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {sport.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-[1200px] mx-auto px-5 md:px-6 py-8 w-full">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-outline-variant/20 bg-surface-container-lowest">
        <div className="max-w-[1200px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary-container flex items-center justify-center text-white text-xs font-bold">T</div>
            <span className="text-xs font-semibold text-on-surface-variant">Tournify</span>
          </div>
          <p className="text-xs text-outline">
            © {new Date().getFullYear()} Tournify — College Sports, Live & Loud
          </p>
        </div>
      </footer>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-primary-container/10 shadow-[0_-4px_20px_rgba(138,154,91,0.06)]">
        <div className="flex justify-around items-center px-4 pb-5 pt-2">
          <Link href="/" className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${pathname === '/' ? 'text-primary bg-primary-fixed/20' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-xl" style={pathname === '/' ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
            <span className="text-xs font-semibold">Home</span>
          </Link>
          <Link href={sports[0] ? `/sport/${sports[0]._id}` : '#'} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${pathname.startsWith('/sport') ? 'text-primary bg-primary-fixed/20' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-xl" style={pathname.startsWith('/sport') ? { fontVariationSettings: "'FILL' 1" } : {}}>search</span>
            <span className="text-xs font-semibold">Explore</span>
          </Link>
          <div className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-on-surface-variant">
            <span className="material-symbols-outlined text-xl">live_tv</span>
            <span className="text-xs font-semibold">Live</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-on-surface-variant">
            <span className="material-symbols-outlined text-xl">person</span>
            <span className="text-xs font-semibold">Profile</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
