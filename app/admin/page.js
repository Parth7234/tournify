'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      <span className="text-on-surface-variant text-sm">Loading...</span>
    </div>
  );

  const statCards = [
    { label: 'Events', value: stats.events, icon: 'event', accent: false },
    { label: 'Teams', value: stats.teams, icon: 'groups', accent: false },
    { label: 'Sports', value: stats.sports, icon: 'sports_kabaddi', accent: false },
    { label: 'Live', value: stats.liveMatches, icon: 'live_tv', accent: true },
    { label: 'Upcoming', value: stats.upcomingMatches, icon: 'schedule', accent: false },
    { label: 'Completed', value: stats.completedMatches, icon: 'done_all', accent: false },
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Dashboard</h1>
        <p className="text-sm text-on-surface-variant">Welcome to Tournify Admin Panel</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {statCards.map(card => (
          <div
            key={card.label}
            className={`bg-surface-container-lowest rounded-xl px-5 py-4 border border-outline-variant/20 relative overflow-hidden flex flex-col gap-1.5 group card-hover ${
              card.accent ? 'shadow-lg shadow-secondary-container/10' : 'shadow-sm'
            }`}
            style={{ borderLeftWidth: '3px', borderLeftColor: card.accent ? 'var(--color-peach)' : 'var(--color-primary-container)' }}
          >
            <span className="material-symbols-outlined absolute -bottom-2 -right-2 text-6xl text-primary/5 group-hover:scale-110 group-hover:text-primary/10 transition-all duration-500">{card.icon}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{card.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-on-surface">{card.value}</span>
              {card.accent && card.value > 0 && <span className="w-2 h-2 rounded-full bg-peach animate-live-pulse" />}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <Link href="/admin/events" className="bg-primary hover:bg-primary/90 text-on-primary rounded-xl p-5 flex flex-col items-start gap-3 card-hover shadow-md shadow-primary/10 text-left h-36">
            <div className="bg-white/20 p-2 rounded-lg"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span></div>
            <div className="mt-auto">
              <span className="text-sm font-bold block mb-0.5">Create Event</span>
              <span className="text-xs text-white/75">Start a new tournament</span>
            </div>
          </Link>
          <Link href="/admin/teams" className="bg-surface-container-lowest hover:bg-surface-container-low text-on-surface rounded-xl p-5 flex flex-col items-start gap-3 card-hover shadow-sm border border-outline-variant/20 text-left h-36">
            <div className="bg-primary-fixed/25 p-2 rounded-lg text-primary"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>manage_accounts</span></div>
            <div className="mt-auto">
              <span className="text-sm font-bold block mb-0.5">Manage Teams</span>
              <span className="text-xs text-outline">Edit rosters & info</span>
            </div>
          </Link>
          <Link href="/admin/tournaments" className="bg-surface-container-lowest hover:bg-surface-container-low text-on-surface rounded-xl p-5 flex flex-col items-start gap-3 card-hover shadow-sm border border-outline-variant/20 text-left h-36">
            <div className="bg-primary-fixed/25 p-2 rounded-lg text-primary"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span></div>
            <div className="mt-auto">
              <span className="text-sm font-bold block mb-0.5">Generate Brackets</span>
              <span className="text-xs text-outline">Auto-schedule matches</span>
            </div>
          </Link>
          <Link href="/admin/live" className="bg-secondary-container hover:bg-peach-dark text-on-secondary-container rounded-xl p-5 flex flex-col items-start gap-3 card-hover shadow-md shadow-secondary-container/15 text-left h-36">
            <div className="bg-white/30 p-2 rounded-lg"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>podium</span></div>
            <div className="mt-auto">
              <span className="text-sm font-bold block mb-0.5">Live Desk</span>
              <span className="text-xs opacity-80">Update ongoing games</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
