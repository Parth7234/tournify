'use client';

import { useState, useEffect, use } from 'react';
import { formatDistanceToNow } from 'date-fns';
import styles from '../../viewer.module.css';

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className={styles.emptyViewer}><p>Loading match...</p></div>;
  if (!match) return <div className={styles.emptyViewer}><p>Match not found</p></div>;

  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  let timeLabel = '';
  if (match.status === 'upcoming' && match.scheduledAt) {
    try {
      timeLabel = `Starts ${formatDistanceToNow(new Date(match.scheduledAt), { addSuffix: true })}`;
    } catch { timeLabel = ''; }
  } else if (isLive) {
    timeLabel = 'LIVE';
  } else if (isCompleted) {
    timeLabel = 'Full Time';
  }

  let winnerName = '';
  if (isCompleted) {
    if (match.scoreA > match.scoreB) winnerName = match.squadA?.teamId?.name;
    else if (match.scoreB > match.scoreA) winnerName = match.squadB?.teamId?.name;
    else winnerName = 'Draw';
  }

  return (
    <div className={styles.matchDetail}>
      <div className={styles.matchDetailHeader}>
        <span className={styles.scorecardSport}>{match.sportId?.name || 'Sport'}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          {match.round}{match.group ? ` · ${match.group}` : ''}
        </span>

        {isLive && (
          <span className={styles.liveBadge} style={{ marginTop: 12, display: 'inline-flex' }}>
            <span className={styles.liveDot}></span> LIVE
          </span>
        )}

        <div className={styles.matchDetailTeams}>
          <div>
            <div className={styles.matchDetailTeamName}>{match.squadA?.teamId?.name || '—'}</div>
            <div className={styles.matchDetailScore}>{match.scoreA}</div>
          </div>
          <span className={styles.matchDetailVs}>VS</span>
          <div>
            <div className={styles.matchDetailTeamName}>{match.squadB?.teamId?.name || '—'}</div>
            <div className={styles.matchDetailScore}>{match.scoreB}</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{timeLabel}</p>
        {winnerName && (
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)', marginTop: 8 }}>
            🏆 Winner: {winnerName}
          </p>
        )}
      </div>

      {/* Squads */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className={styles.timelineSection}>
          <h3 className={styles.timelineSectionTitle}>{match.squadA?.teamId?.name} Squad</h3>
          {(match.squadA?.players || []).length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {match.squadA.players.map(p => (
                <li key={p._id} style={{ padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  {p.name}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No players listed</p>
          )}
        </div>
        <div className={styles.timelineSection}>
          <h3 className={styles.timelineSectionTitle}>{match.squadB?.teamId?.name} Squad</h3>
          {(match.squadB?.players || []).length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {match.squadB.players.map(p => (
                <li key={p._id} style={{ padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  {p.name}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No players listed</p>
          )}
        </div>
      </div>

      {/* Match Timeline */}
      <div className={styles.timelineSection}>
        <h3 className={styles.timelineSectionTitle}>Match Timeline</h3>
        {(match.matchEvents || []).length > 0 ? (
          <div className={styles.timelineList}>
            {[...match.matchEvents].reverse().map((ev, i) => (
              <div key={i} className={styles.timelineEntry}>
                <span className={styles.timelineEntryTime}>
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
                <div className={styles.timelineEntryBody}>
                  <div className={styles.timelineEntryType}>{ev.type}</div>
                  <div className={styles.timelineEntryDesc}>{ev.description}</div>
                  {ev.player && <div className={styles.timelineEntryPlayer}>— {ev.player}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            No events recorded yet
          </p>
        )}
      </div>
    </div>
  );
}
