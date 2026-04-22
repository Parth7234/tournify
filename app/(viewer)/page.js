'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function HomePage() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [stats, setStats] = useState({ live: 0, upcoming: 0, completed: 0, sports: 0 });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [liveRes, upcomingRes, completedRes, sportsRes] = await Promise.all([
        fetch('/api/public/matches?status=live'),
        fetch('/api/public/matches?status=upcoming'),
        fetch('/api/public/matches?status=completed'),
        fetch('/api/public/sports'),
      ]);
      const live = await liveRes.json();
      const upcoming = await upcomingRes.json();
      const completed = await completedRes.json();
      const sports = await sportsRes.json();

      setLiveMatches(Array.isArray(live) ? live : []);
      setUpcomingMatches(Array.isArray(upcoming) ? upcoming.slice(0, 6) : []);
      setStats({
        live: Array.isArray(live) ? live.length : 0,
        upcoming: Array.isArray(upcoming) ? upcoming.length : 0,
        completed: Array.isArray(completed) ? completed.length : 0,
        sports: Array.isArray(sports) ? sports.length : 0,
      });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col gap-10 pb-16 md:pb-0">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-5 max-w-2xl mx-auto py-6 md:py-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-primary-fixed/30 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          Live Tournament Tracker
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
          College Sports,<br />
          <span className="text-primary-container">Live & Loud</span>
        </h1>
        <p className="text-base md:text-lg text-on-surface-variant max-w-lg leading-relaxed">
          Track every match, score, and moment across all sports in real-time.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
        {[
          { label: 'Live Now', value: stats.live, icon: 'live_tv', accent: true },
          { label: 'Upcoming', value: stats.upcoming, icon: 'event_upcoming', accent: false },
          { label: 'Completed', value: stats.completed, icon: 'task_alt', accent: false },
          { label: 'Sports', value: stats.sports, icon: 'sports_basketball', accent: false },
        ].map(s => (
          <div
            key={s.label}
            className="bg-surface-container-lowest rounded-xl px-5 py-4 border border-outline-variant/20 flex flex-col gap-1.5 relative overflow-hidden group shadow-sm card-hover"
            style={{ borderLeftWidth: '3px', borderLeftColor: s.accent ? 'var(--color-peach)' : 'var(--color-primary-container)' }}
          >
            <span className="material-symbols-outlined absolute -bottom-2 -right-2 text-6xl text-primary/5 group-hover:scale-110 group-hover:text-primary/10 transition-all duration-500">
              {s.icon}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{s.label}</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-extrabold ${s.accent ? 'text-secondary' : 'text-primary'}`}>{s.value}</span>
              {s.accent && s.value > 0 && (
                <span className="w-2 h-2 rounded-full bg-peach animate-live-pulse" />
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Live Now */}
      {liveMatches.length > 0 && (
        <section className="flex flex-col gap-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">Live Now</h2>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error animate-live-pulse" />
              {liveMatches.length} LIVE
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {liveMatches.map(match => (
              <MatchScorecard key={match._id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Coming Up */}
      {upcomingMatches.length > 0 && (
        <section className="flex flex-col gap-5 animate-fade-in">
          <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">Coming Up</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {upcomingMatches.map(match => (
              <MatchScorecard key={match._id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {liveMatches.length === 0 && upcomingMatches.length === 0 && (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-14 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-primary-fixed/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">notifications_paused</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-on-surface font-semibold">No Matches Scheduled</p>
            <p className="text-on-surface-variant text-sm">Check back soon for live scores and upcoming games!</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchScorecard({ match }) {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const isUpcoming = match.status === 'upcoming';

  let timeLabel = '';
  if (isUpcoming && match.scheduledAt) {
    try {
      timeLabel = `Starts ${formatDistanceToNow(new Date(match.scheduledAt), { addSuffix: true })}`;
    } catch { timeLabel = ''; }
  } else if (isCompleted) {
    timeLabel = 'Full Time';
  }

  let winnerName = '';
  if (isCompleted) {
    if (match.scoreA > match.scoreB) winnerName = match.squadA?.teamId?.name;
    else if (match.scoreB > match.scoreA) winnerName = match.squadB?.teamId?.name;
    else winnerName = 'Draw';
  }

  const teamAInitial = (match.squadA?.teamId?.name || 'A')[0];
  const teamBInitial = (match.squadB?.teamId?.name || 'B')[0];

  return (
    <Link
      href={`/match/${match._id}`}
      className={`bg-surface-container-lowest rounded-xl p-4 border flex flex-col gap-3 card-hover ${
        isLive ? 'border-secondary-container/40 shadow-lg shadow-secondary-container/15' : 'border-outline-variant/25 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2.5">
        <span className="bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">sports</span>
          {match.sportId?.name || 'Sport'}
        </span>
        {isLive ? (
          <span className="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-live-pulse" />
            LIVE
          </span>
        ) : isCompleted && winnerName ? (
          <span className="text-primary text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            {winnerName}
          </span>
        ) : (
          <span className="text-outline text-xs font-medium">{timeLabel || match.round}</span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isCompleted && match.scoreA > match.scoreB ? 'bg-primary-container/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            {teamAInitial}
          </div>
          <span className="text-sm font-semibold text-on-surface truncate">{match.squadA?.teamId?.name || '—'}</span>
        </div>
        {isUpcoming ? (
          <span className="text-xs text-outline bg-surface-container px-2.5 py-1 rounded font-bold uppercase mx-2">VS</span>
        ) : (
          <div className="flex items-center gap-2 mx-2">
            <span className={`text-xl font-extrabold ${isCompleted && match.scoreA > match.scoreB ? 'text-primary' : 'text-on-surface'}`}>{match.scoreA}</span>
            <span className="text-xs text-outline-variant">–</span>
            <span className={`text-xl font-extrabold ${isCompleted && match.scoreB > match.scoreA ? 'text-primary' : 'text-on-surface'}`}>{match.scoreB}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end">
          <span className="text-sm font-semibold text-on-surface truncate text-right">{match.squadB?.teamId?.name || '—'}</span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isCompleted && match.scoreB > match.scoreA ? 'bg-primary-container/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            {teamBInitial}
          </div>
        </div>
      </div>
    </Link>
  );
}
