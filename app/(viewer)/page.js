'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import styles from './viewer.module.css';

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
    <div>
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>College Sports,<br />Live & Loud</h1>
        <p className={styles.heroSubtitle}>
          Track every match, score, and moment across all sports in real-time.
        </p>
      </section>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{stats.live}</span>
          <span className={styles.statLabel}>Live Now</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{stats.upcoming}</span>
          <span className={styles.statLabel}>Upcoming</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{stats.completed}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{stats.sports}</span>
          <span className={styles.statLabel}>Sports</span>
        </div>
      </div>

      {liveMatches.length > 0 && (
        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>🔴 Live Matches</h2>
          <div className={styles.matchGrid}>
            {liveMatches.map(match => (
              <MatchScorecard key={match._id} match={match} />
            ))}
          </div>
        </section>
      )}

      {upcomingMatches.length > 0 && (
        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>📅 Coming Up</h2>
          <div className={styles.matchGrid}>
            {upcomingMatches.map(match => (
              <MatchScorecard key={match._id} match={match} />
            ))}
          </div>
        </section>
      )}

      {liveMatches.length === 0 && upcomingMatches.length === 0 && (
        <div className={styles.emptyViewer}>
          <p>No matches scheduled yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}

function MatchScorecard({ match }) {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const isUpcoming = match.status === 'upcoming';
  const isFootball = (match.sportId?.name || '').toLowerCase() === 'football';

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
        {winnerName && <span className={styles.scorecardWinner}>🏆 {winnerName}</span>}
      </div>
    </Link>
  );
}
