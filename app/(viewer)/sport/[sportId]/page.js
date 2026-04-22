'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import styles from '../../viewer.module.css';

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const live = matches.filter(m => m.status === 'live');
  const upcoming = matches.filter(m => m.status === 'upcoming');
  const past = matches.filter(m => m.status === 'completed');

  const displayMatches = activeTab === 'live' ? live : activeTab === 'upcoming' ? upcoming : past;

  const isRoundRobin = sport?.tournamentFormat === 'round_robin' || sport?.tournamentFormat === 'double_round_robin' || sport?.tournamentFormat === 'hybrid';
  const isKnockout = sport?.tournamentFormat === 'knockout';

  if (loading) return <div className={styles.emptyViewer}><p>Loading...</p></div>;

  return (
    <div>
      <h1 className={styles.sectionTitle}>{sport?.name || 'Sport'}</h1>
      <p className={styles.sectionSubtitle}>
        Format: {sport?.tournamentFormat?.replace(/_/g, ' ') || '—'}
      </p>

      {/* === ALWAYS VISIBLE: Points Table for Round Robin === */}
      {isRoundRobin && (
        <div className={styles.standingsCard} style={{ marginBottom: 28 }}>
          <h2 className={styles.standingsTitle}>📊 Points Table</h2>
          {standings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              No matches completed yet — standings will appear here
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.standingsTable}>
                <thead>
                  <tr>
                    <th className={styles.thPos}>#</th>
                    <th className={styles.thTeam}>Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th className={styles.thPts}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => (
                    <tr key={i} className={i === 0 ? styles.topRow : ''}>
                      <td className={styles.tdPos}>{i + 1}</td>
                      <td className={styles.tdTeam}>{row.team}</td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td className={styles.tdPts}>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* === ALWAYS VISIBLE: Knockout Bracket === */}
      {isKnockout && (
        <div className={styles.bracketCard} style={{ marginBottom: 28 }}>
          <h2 className={styles.standingsTitle}>🏆 Knockout Bracket</h2>
          {matches.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              No bracket generated yet
            </p>
          ) : (
            <BracketView matches={matches} />
          )}
        </div>
      )}

      {/* === Match Tabs === */}
      <div className={styles.viewerTabs}>
        <button className={`${styles.viewerTab} ${activeTab === 'live' ? styles.viewerTabActive : ''}`} onClick={() => setActiveTab('live')}>
          🔴 Live ({live.length})
        </button>
        <button className={`${styles.viewerTab} ${activeTab === 'upcoming' ? styles.viewerTabActive : ''}`} onClick={() => setActiveTab('upcoming')}>
          Upcoming ({upcoming.length})
        </button>
        <button className={`${styles.viewerTab} ${activeTab === 'past' ? styles.viewerTabActive : ''}`} onClick={() => setActiveTab('past')}>
          Completed ({past.length})
        </button>
      </div>

      {displayMatches.length === 0 ? (
        <div className={styles.emptyViewer}>
          <p>No {activeTab === 'past' ? 'completed' : activeTab} matches{activeTab === 'live' ? ' right now' : ''}</p>
        </div>
      ) : (
        <div className={styles.matchGrid}>
          {displayMatches.map(match => (
            <MatchScorecard key={match._id} match={match} sportName={sport?.name} />
          ))}
        </div>
      )}
    </div>
  );
}

/* Bracket View Component */
function BracketView({ matches }) {
  const roundOrder = {};
  const rounds = [];
  matches.forEach(m => {
    if (!roundOrder[m.round]) {
      roundOrder[m.round] = [];
      rounds.push(m.round);
    }
    roundOrder[m.round].push(m);
  });

  const roundPriority = (r) => {
    if (r === 'Final') return 1000;
    if (r === 'Semi Final') return 999;
    if (r === 'Quarter Final') return 998;
    const num = parseInt(r.replace(/\D/g, '')) || 0;
    return num;
  };
  rounds.sort((a, b) => roundPriority(a) - roundPriority(b));

  return (
    <div className={styles.bracketRounds}>
      {rounds.map(round => (
        <div key={round} className={styles.bracketRoundCol}>
          <div className={styles.bracketRoundLabel}>{round}</div>
          <div className={styles.bracketRoundMatches}>
            {roundOrder[round].map(match => {
              const isCompleted = match.status === 'completed';
              const isLive = match.status === 'live';
              let winnerName = '';
              if (isCompleted) {
                if (match.scoreA > match.scoreB) winnerName = match.squadA?.teamId?.name;
                else if (match.scoreB > match.scoreA) winnerName = match.squadB?.teamId?.name;
                else winnerName = 'Draw';
              }
              return (
                <Link href={`/match/${match._id}`} key={match._id} className={`${styles.bracketMatch} ${isLive ? styles.bracketMatchLive : ''} ${isCompleted ? styles.bracketMatchDone : ''}`}>
                  <div className={styles.bracketTeamRow}>
                    <span className={`${styles.bracketTeamName} ${isCompleted && match.scoreA > match.scoreB ? styles.bracketWinner : ''}`}>
                      {match.squadA?.teamId?.name || 'TBD'}
                    </span>
                    <span className={styles.bracketTeamScore}>{match.scoreA}</span>
                  </div>
                  <div className={styles.bracketTeamRow}>
                    <span className={`${styles.bracketTeamName} ${isCompleted && match.scoreB > match.scoreA ? styles.bracketWinner : ''}`}>
                      {match.squadB?.teamId?.name || 'TBD'}
                    </span>
                    <span className={styles.bracketTeamScore}>{match.scoreB}</span>
                  </div>
                  {isLive && <span className={styles.bracketLiveBadge}><span className={styles.liveDot}></span> LIVE</span>}
                  {winnerName && <span className={styles.bracketWinnerLabel}>Winner: {winnerName}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchScorecard({ match, sportName }) {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const isUpcoming = match.status === 'upcoming';
  const isFootball = (sportName || '').toLowerCase() === 'football';

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

  const goalScorersA = (match.goalScorers || []).filter(g => g.team === 'A');
  const goalScorersB = (match.goalScorers || []).filter(g => g.team === 'B');

  return (
    <Link href={`/match/${match._id}`} className={`${styles.scorecard} ${isLive ? styles.scorecardLive : ''}`}>
      <div className={styles.scorecardHeader}>
        <span className={styles.scorecardSport}>{match.sportId?.name || 'Sport'}</span>
        {isLive ? (
          <span className={styles.liveBadge}>
            <span className={styles.liveDot}></span> LIVE
          </span>
        ) : isCompleted && winnerName ? (
          <span className={styles.scorecardWinnerBadge}>🏆 {winnerName}</span>
        ) : (
          <span className={styles.scorecardRound}>{match.round}{match.group ? ` · ${match.group}` : ''}</span>
        )}
      </div>
      <div className={styles.scorecardBody}>
        <div className={styles.scorecardTeam}>
          <span className={styles.scorecardTeamName}>{match.squadA?.teamId?.name || '—'}</span>
          <span className={styles.scorecardScore}>{match.scoreA}</span>
          {isFootball && goalScorersA.length > 0 && (
            <div className={styles.goalScorersList}>
              {goalScorersA.map((g, i) => (
                <span key={i} className={styles.goalScorerName}>{g.player} {g.minute ? `${g.minute}'` : ''}</span>
              ))}
            </div>
          )}
        </div>
        <span className={styles.scorecardVs}>VS</span>
        <div className={styles.scorecardTeam}>
          <span className={styles.scorecardTeamName}>{match.squadB?.teamId?.name || '—'}</span>
          <span className={styles.scorecardScore}>{match.scoreB}</span>
          {isFootball && goalScorersB.length > 0 && (
            <div className={styles.goalScorersList}>
              {goalScorersB.map((g, i) => (
                <span key={i} className={styles.goalScorerName}>{g.player} {g.minute ? `${g.minute}'` : ''}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.scorecardFooter}>
        <span className={styles.scorecardTime}>{timeLabel}</span>
        {isCompleted && winnerName && <span className={styles.scorecardWinner}>🏆 {winnerName}</span>}
      </div>
    </Link>
  );
}
