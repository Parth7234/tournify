'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function SportPage({ params }) {
  const { sportId } = use(params);
  const [sport, setSport] = useState(null);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [activeTab, setActiveTab] = useState('live');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [sportId]);

  async function fetchData() {
    try {
      const [sportsRes, matchesRes, standingsRes] = await Promise.all([
        fetch('/api/public/sports'),
        fetch(`/api/public/matches?sportId=${sportId}`),
        fetch(`/api/public/standings?sportId=${sportId}`),
      ]);
      const sports = await sportsRes.json();
      const matchData = await matchesRes.json();
      const standingsData = await standingsRes.json();
      const s = Array.isArray(sports) ? sports.find(sp => sp._id === sportId) : null;
      setSport(s);
      setMatches(Array.isArray(matchData) ? matchData : []);
      setStandings(Array.isArray(standingsData) ? standingsData : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const live = matches.filter(m => m.status === 'live');
  const upcoming = matches.filter(m => m.status === 'upcoming');
  const past = matches.filter(m => m.status === 'completed');
  const displayMatches = activeTab === 'live' ? live : activeTab === 'upcoming' ? upcoming : past;

  const isRoundRobin = sport?.tournamentFormat === 'round_robin' || sport?.tournamentFormat === 'double_round_robin' || sport?.tournamentFormat === 'hybrid';
  const isKnockout = sport?.tournamentFormat === 'knockout';

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      <span className="text-on-surface-variant text-sm">Loading...</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-16 md:pb-0 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">{sport?.name || 'Sport'}</h1>
          <span className="inline-flex items-center bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-outline-variant/30">
            {sport?.tournamentFormat?.replace(/_/g, ' ') || '—'}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">
          Current standings and matches for the {sport?.name?.toLowerCase() || ''} tournament.
        </p>
      </header>

      {/* Points Table */}
      {isRoundRobin && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">Standings</h2>
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/25">
            {standings.length === 0 ? (
              <p className="text-on-surface-variant text-center py-10 text-sm">No matches completed yet — standings will appear here</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-primary">
                      <th className="px-4 md:px-5 py-3 text-center w-16 text-xs font-bold uppercase tracking-wider text-on-primary">Rank</th>
                      <th className="px-4 md:px-5 py-3 text-xs font-bold uppercase tracking-wider text-on-primary">Team</th>
                      <th className="px-3 py-3 text-center w-14 text-xs font-bold uppercase tracking-wider text-on-primary">P</th>
                      <th className="px-3 py-3 text-center w-14 text-xs font-bold uppercase tracking-wider text-on-primary">W</th>
                      <th className="px-3 py-3 text-center w-14 text-xs font-bold uppercase tracking-wider text-on-primary">D</th>
                      <th className="px-3 py-3 text-center w-14 text-xs font-bold uppercase tracking-wider text-on-primary">L</th>
                      <th className="px-3 py-3 text-center w-20 text-xs font-bold uppercase tracking-wider text-on-primary">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, i) => (
                      <tr key={i} className={`border-b border-outline-variant/15 transition-colors hover:bg-surface-container-low ${i === 0 ? 'bg-primary-fixed/25' : 'bg-surface-container-lowest'}`}>
                        <td className="px-4 md:px-5 py-3 text-center font-bold text-on-surface-variant">{i + 1}</td>
                        <td className="px-4 md:px-5 py-3 font-semibold text-on-surface">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-primary-container/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                              {(row.team || '?')[0]}
                            </div>
                            {row.team}
                            {i === 0 && <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-on-surface-variant">{row.played}</td>
                        <td className="px-3 py-3 text-center text-on-surface-variant">{row.won}</td>
                        <td className="px-3 py-3 text-center text-on-surface-variant">{row.drawn}</td>
                        <td className="px-3 py-3 text-center text-on-surface-variant">{row.lost}</td>
                        <td className="px-3 py-3 text-center font-extrabold text-on-surface">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Knockout Bracket */}
      {isKnockout && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">Knockout Bracket</h2>
          {matches.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-10 text-center text-on-surface-variant border border-outline-variant/25 text-sm">No bracket generated yet</div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/25 shadow-sm overflow-x-auto">
              <BracketView matches={matches} />
            </div>
          )}
        </section>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'live', label: 'Live', count: live.length, hasLiveDot: true },
          { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { key: 'past', label: 'Completed', count: past.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-secondary-container text-on-secondary-container border-transparent shadow-sm'
                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-low'
            }`}
          >
            {tab.hasLiveDot && <span className="w-2 h-2 rounded-full bg-error animate-live-pulse" />}
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Match list */}
      {displayMatches.length === 0 ? (
        <div className="text-center py-14 text-on-surface-variant text-sm flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-outline-variant">inbox</span>
          No {activeTab === 'past' ? 'completed' : activeTab} matches{activeTab === 'live' ? ' right now' : ''}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {displayMatches.map(match => (
            <MatchScorecard key={match._id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function BracketView({ matches }) {
  const roundOrder = {};
  const rounds = [];
  matches.forEach(m => {
    if (!roundOrder[m.round]) { roundOrder[m.round] = []; rounds.push(m.round); }
    roundOrder[m.round].push(m);
  });
  const roundPriority = (r) => {
    if (r === 'Final') return 1000;
    if (r === 'Semi Final') return 999;
    if (r === 'Quarter Final') return 998;
    return parseInt(r.replace(/\D/g, '')) || 0;
  };
  rounds.sort((a, b) => roundPriority(a) - roundPriority(b));

  return (
    <div className="flex gap-5 min-w-fit">
      {rounds.map(round => (
        <div key={round} className="w-64 shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary pl-3 mb-4" style={{ borderLeft: '2px solid var(--color-primary-container)' }}>{round}</h3>
          <div className="flex flex-col gap-3">
            {roundOrder[round].map(match => {
              const isCompleted = match.status === 'completed';
              const isLive = match.status === 'live';
              let winnerSide = null;
              if (isCompleted) {
                if (match.scoreA > match.scoreB) winnerSide = 'A';
                else if (match.scoreB > match.scoreA) winnerSide = 'B';
              }
              return (
                <Link href={`/match/${match._id}`} key={match._id} className={`bg-surface-container-low rounded-xl p-3.5 border flex flex-col gap-2 card-hover ${isLive ? 'border-secondary-container/40 shadow-lg shadow-secondary-container/15' : isCompleted ? 'border-primary-container/20' : 'border-outline-variant/25'}`}>
                  <div className={`flex justify-between items-center px-3 py-2 rounded-lg border transition-colors ${winnerSide === 'A' ? 'bg-primary-fixed/25 border-primary-container/25' : winnerSide === 'B' ? 'opacity-50 border-outline-variant/15' : 'border-outline-variant/15 hover:bg-surface-container'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${winnerSide === 'A' ? 'bg-primary-container/25 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {(match.squadA?.teamId?.name || 'T')[0]}
                      </div>
                      <span className="text-sm font-semibold text-on-surface">{match.squadA?.teamId?.name || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-on-surface">{match.scoreA}</span>
                      {winnerSide === 'A' && <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                    </div>
                  </div>
                  <div className={`flex justify-between items-center px-3 py-2 rounded-lg border transition-colors ${winnerSide === 'B' ? 'bg-primary-fixed/25 border-primary-container/25' : winnerSide === 'A' ? 'opacity-50 border-outline-variant/15' : 'border-outline-variant/15 hover:bg-surface-container'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${winnerSide === 'B' ? 'bg-primary-container/25 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {(match.squadB?.teamId?.name || 'T')[0]}
                      </div>
                      <span className="text-sm font-semibold text-on-surface">{match.squadB?.teamId?.name || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-on-surface">{match.scoreB}</span>
                      {winnerSide === 'B' && <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                    </div>
                  </div>
                  {isLive && (
                    <span className="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit mt-0.5 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-live-pulse" /> LIVE
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchScorecard({ match }) {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const isUpcoming = match.status === 'upcoming';

  let timeLabel = '';
  if (isUpcoming && match.scheduledAt) {
    try { timeLabel = `Starts ${formatDistanceToNow(new Date(match.scheduledAt), { addSuffix: true })}`; } catch { timeLabel = ''; }
  } else if (isCompleted) { timeLabel = 'Full Time'; }

  let winnerName = '';
  if (isCompleted) {
    if (match.scoreA > match.scoreB) winnerName = match.squadA?.teamId?.name;
    else if (match.scoreB > match.scoreA) winnerName = match.squadB?.teamId?.name;
    else winnerName = 'Draw';
  }

  return (
    <Link href={`/match/${match._id}`} className={`bg-surface-container-lowest rounded-xl p-4 border flex flex-col gap-3 card-hover ${isLive ? 'border-secondary-container/40 shadow-lg shadow-secondary-container/15' : 'border-outline-variant/25 shadow-sm'}`}>
      <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{match.round}{match.group ? ` · ${match.group}` : ''}</span>
        {isLive ? (
          <span className="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-live-pulse" /> LIVE
          </span>
        ) : isCompleted && winnerName ? (
          <span className="text-primary text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            {winnerName}
          </span>
        ) : (
          <span className="text-outline text-xs font-medium">{timeLabel}</span>
        )}
      </div>
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCompleted && match.scoreA > match.scoreB ? 'bg-primary-container/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>{(match.squadA?.teamId?.name || 'A')[0]}</div>
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
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <span className="text-sm font-semibold text-on-surface truncate text-right">{match.squadB?.teamId?.name || '—'}</span>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCompleted && match.scoreB > match.scoreA ? 'bg-primary-container/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>{(match.squadB?.teamId?.name || 'B')[0]}</div>
        </div>
      </div>
    </Link>
  );
}
