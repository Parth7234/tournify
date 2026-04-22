'use client';

import { useState, useEffect, use } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function MatchDetailPage({ params }) {
  const { matchId } = use(params);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 10000);
    return () => clearInterval(interval);
  }, [matchId]);

  async function fetchMatch() {
    try {
      const res = await fetch(`/api/public/matches?matchId=${matchId}`);
      const data = await res.json();
      setMatch(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      <span className="text-on-surface-variant text-sm">Loading match...</span>
    </div>
  );
  if (!match) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="material-symbols-outlined text-4xl text-outline-variant">search_off</span>
      <p className="text-on-surface-variant text-sm">Match not found</p>
    </div>
  );

  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  let timeLabel = '';
  if (match.status === 'upcoming' && match.scheduledAt) {
    try { timeLabel = `Starts ${formatDistanceToNow(new Date(match.scheduledAt), { addSuffix: true })}`; } catch { timeLabel = ''; }
  } else if (isLive) { timeLabel = 'LIVE'; }
  else if (isCompleted) { timeLabel = 'Full Time'; }

  let winnerName = '';
  let winnerSide = null;
  if (isCompleted) {
    if (match.scoreA > match.scoreB) { winnerName = match.squadA?.teamId?.name; winnerSide = 'A'; }
    else if (match.scoreB > match.scoreA) { winnerName = match.squadB?.teamId?.name; winnerSide = 'B'; }
    else winnerName = 'Draw';
  }

  const teamAInitial = (match.squadA?.teamId?.name || 'A')[0];
  const teamBInitial = (match.squadB?.teamId?.name || 'B')[0];

  const eventTypeColors = {
    goal: 'bg-primary/10 text-primary border-primary/20',
    foul: 'bg-secondary-container/40 text-secondary border-secondary/20',
    card: 'bg-error-container/60 text-error border-error/20',
    substitution: 'bg-tertiary-fixed/30 text-tertiary border-tertiary/20',
    timeout: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
    other: 'bg-surface-container text-on-surface-variant border-outline-variant/20',
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto pb-16 md:pb-0 animate-fade-in">
      {/* Scoreboard */}
      <div className={`bg-surface-container-lowest rounded-2xl border overflow-hidden shadow-sm ${
        isLive ? 'border-secondary-container/30 shadow-lg shadow-secondary-container/10' : 'border-outline-variant/25'
      }`}>
        {/* Accent top bar */}
        <div className={`h-1 w-full ${isLive ? 'bg-gradient-to-r from-peach via-secondary-container to-peach' : isCompleted ? 'bg-gradient-to-r from-primary-container via-primary to-primary-container' : 'bg-gradient-to-r from-outline-variant via-surface-container-highest to-outline-variant'}`} />

        <div className="p-6 md:p-8 text-center flex flex-col items-center gap-4">
          <span className="bg-surface-container text-on-surface-variant px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-outline-variant/20">
            {match.sportId?.name || 'Sport'}
          </span>
          <span className="text-xs text-outline">
            {match.round}{match.group ? ` · ${match.group}` : ''}
          </span>
          {isLive && (
            <span className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 uppercase tracking-wider animate-live-pulse">
              <span className="w-2 h-2 rounded-full bg-error" /> LIVE
            </span>
          )}

          {/* Teams & Score */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mt-2 w-full max-w-md">
            <div className="flex-1 flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${
                winnerSide === 'A' ? 'bg-primary-container/25 text-primary ring-2 ring-primary/20' : 'bg-surface-container-high text-on-surface-variant'
              }`}>{teamAInitial}</div>
              <span className={`text-sm font-semibold text-center ${winnerSide === 'A' ? 'text-primary' : 'text-on-surface'}`}>
                {match.squadA?.teamId?.name || '—'}
              </span>
              <span className={`text-4xl md:text-5xl font-extrabold ${winnerSide === 'A' ? 'text-primary' : 'text-on-surface'}`}>
                {match.scoreA}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-outline text-sm font-bold">VS</span>
              <div className="w-px h-8 bg-outline-variant/30" />
            </div>

            <div className="flex-1 flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${
                winnerSide === 'B' ? 'bg-primary-container/25 text-primary ring-2 ring-primary/20' : 'bg-surface-container-high text-on-surface-variant'
              }`}>{teamBInitial}</div>
              <span className={`text-sm font-semibold text-center ${winnerSide === 'B' ? 'text-primary' : 'text-on-surface'}`}>
                {match.squadB?.teamId?.name || '—'}
              </span>
              <span className={`text-4xl md:text-5xl font-extrabold ${winnerSide === 'B' ? 'text-primary' : 'text-on-surface'}`}>
                {match.scoreB}
              </span>
            </div>
          </div>

          <p className="text-xs text-outline mt-1">{timeLabel}</p>
          {winnerName && (
            <div className="flex items-center gap-2 bg-primary-fixed/25 text-primary px-4 py-2 rounded-full">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              <span className="text-sm font-bold">Winner: {winnerName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Squads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {[
          { squad: match.squadA, label: match.squadA?.teamId?.name, initial: teamAInitial, side: 'A' },
          { squad: match.squadB, label: match.squadB?.teamId?.name, initial: teamBInitial, side: 'B' },
        ].map(({ squad, label, initial, side }) => (
          <div key={side} className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden">
            <div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant/15 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${winnerSide === side ? 'bg-primary-container/25 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {initial}
              </div>
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">{label} Squad</h3>
            </div>
            <div className="p-4">
              {(squad?.players || []).length > 0 ? (
                <ul className="flex flex-col">
                  {squad.players.map((p, i) => (
                    <li key={p._id} className={`flex items-center gap-3 py-2.5 text-sm border-b border-outline-variant/10 last:border-0 ${i % 2 === 0 ? '' : 'bg-surface-container-low/30'}`}>
                      <span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-on-surface font-medium">{p.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-outline text-center py-6">No players listed</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden">
        <div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant/15 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-lg">timeline</span>
          <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">Match Timeline</h3>
        </div>
        <div className="p-5">
          {(match.matchEvents || []).length > 0 ? (
            <div className="flex flex-col gap-0 relative">
              <div className="absolute left-11 top-3 bottom-3 w-px bg-outline-variant/20" />
              {[...match.matchEvents].reverse().map((ev, i) => (
                <div key={i} className="flex gap-4 items-start py-3 relative">
                  <span className="text-xs font-bold text-outline whitespace-nowrap mt-1 w-12 text-right shrink-0">
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-surface-container-highest border-2 border-primary-container/40 mt-1.5 shrink-0 relative z-10" />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit ${eventTypeColors[ev.type] || eventTypeColors.other}`}>
                      {ev.type}
                    </span>
                    <span className="text-sm text-on-surface">{ev.description}</span>
                    {ev.player && <span className="text-xs text-outline">— {ev.player}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-outline-variant">pending</span>
              <p className="text-sm text-outline">No events recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
