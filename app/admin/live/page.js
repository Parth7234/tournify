'use client';

import { useState, useEffect } from 'react';
import { getMatches, updateMatchScore, addMatchEvent, addGoalScorer, removeGoalScorer } from '@/app/actions/matchActions';
import { getSports } from '@/app/actions/sportActions';
import { getEvents } from '@/app/actions/eventActions';
import styles from '../shared.module.css';
import liveStyles from './live.module.css';

function getSportType(sportName) {
  const name = (sportName || '').toLowerCase();
  if (name === 'chess') return 'chess';
  if (name === 'football') return 'football';
  return 'standard';
}

export default function LiveDeskPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [sports, setSports] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [eventDesc, setEventDesc] = useState('');
  const [eventPlayer, setEventPlayer] = useState('');
  const [eventType, setEventType] = useState('other');
  const [goalPlayer, setGoalPlayer] = useState('');
  const [goalTeam, setGoalTeam] = useState('A');
  const [goalMinute, setGoalMinute] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { if (selectedEvent) loadData(); }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) return;
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [selectedEvent]);

  async function loadEvents() {
    const data = await getEvents();
    setEvents(data);
    if (data.length > 0) setSelectedEvent(data[0]._id);
    setLoading(false);
  }

  async function loadData() {
    const sp = await getSports(selectedEvent);
    setSports(sp);
    let matches = [];
    for (const sport of sp) {
      const m = await getMatches(sport._id);
      matches = [...matches, ...m];
    }
    matches.sort((a, b) => {
      const order = { live: 0, upcoming: 1, completed: 2 };
      return (order[a.status] || 3) - (order[b.status] || 3);
    });
    setAllMatches(matches);
    if (selectedMatch) {
      const updated = matches.find(m => m._id === selectedMatch._id);
      if (updated) setSelectedMatch(updated);
    }
  }

  async function handleScoreChange(matchId, team, delta) {
    const match = allMatches.find(m => m._id === matchId);
    if (!match) return;
    const data = {};
    if (team === 'A') data.scoreA = Math.max(0, Math.round((match.scoreA + delta) * 2) / 2);
    if (team === 'B') data.scoreB = Math.max(0, Math.round((match.scoreB + delta) * 2) / 2);
    await updateMatchScore(matchId, data);
    await loadData();
  }

  async function handleStatusChange(matchId, status) {
    const match = allMatches.find(m => m._id === matchId);
    const data = { status };
    if (status === 'completed' && match) {
      if (match.scoreA > match.scoreB) data.winner = match.squadA._id;
      else if (match.scoreB > match.scoreA) data.winner = match.squadB._id;
    }
    await updateMatchScore(matchId, data);
    await loadData();
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    if (!selectedMatch || !eventDesc.trim()) return;
    await addMatchEvent(selectedMatch._id, {
      description: eventDesc,
      player: eventPlayer,
      type: eventType,
    });
    setEventDesc('');
    setEventPlayer('');
    setEventType('other');
    await loadData();
  }

  async function handleAddGoalScorer(e) {
    e.preventDefault();
    if (!selectedMatch || !goalPlayer.trim()) return;
    await addGoalScorer(selectedMatch._id, {
      player: goalPlayer,
      team: goalTeam,
      minute: goalMinute,
    });
    const data = {};
    if (goalTeam === 'A') data.scoreA = selectedMatch.scoreA + 1;
    else data.scoreB = selectedMatch.scoreB + 1;
    await updateMatchScore(selectedMatch._id, data);
    await addMatchEvent(selectedMatch._id, {
      description: `Goal by ${goalPlayer}${goalMinute ? ` (${goalMinute}')` : ''}`,
      player: goalPlayer,
      type: 'goal',
    });
    setGoalPlayer('');
    setGoalMinute('');
    await loadData();
  }

  async function handleRemoveGoalScorer(scorerId) {
    if (!selectedMatch) return;
    await removeGoalScorer(selectedMatch._id, scorerId);
    await loadData();
  }

  const liveMatches = allMatches.filter(m => m.status === 'live');
  const upcomingMatches = allMatches.filter(m => m.status === 'upcoming');
  const completedMatches = allMatches.filter(m => m.status === 'completed');

  const selectedSportType = selectedMatch ? getSportType(selectedMatch.sportId?.name) : 'standard';

  if (loading) return <div className={styles.emptyState}><p>Loading...</p></div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Live Desk</h1>
          <p className={styles.pageSubtitle}>Update live scores and match events in real-time</p>
        </div>
      </div>

      <div className={styles.selectGroup}>
        <select className={styles.select} value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} style={{width:'240px'}}>
          {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
        </select>
      </div>

      <div className={liveStyles.deskLayout}>
        <div className={liveStyles.matchesList}>
          {liveMatches.length > 0 && (
            <>
              <h3 className={liveStyles.sectionLabel}><span className={liveStyles.liveDot}></span> Live Now</h3>
              {liveMatches.map(match => (
                <MatchCard
                  key={match._id}
                  match={match}
                  selected={selectedMatch?._id === match._id}
                  onSelect={() => setSelectedMatch(match)}
                  onScoreChange={handleScoreChange}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </>
          )}
          {upcomingMatches.length > 0 && (
            <>
              <h3 className={liveStyles.sectionLabel}>📅 Upcoming</h3>
              {upcomingMatches.map(match => (
                <MatchCard
                  key={match._id}
                  match={match}
                  selected={selectedMatch?._id === match._id}
                  onSelect={() => setSelectedMatch(match)}
                  onScoreChange={handleScoreChange}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </>
          )}
          {completedMatches.length > 0 && (
            <>
              <h3 className={liveStyles.sectionLabel}>✅ Completed ({completedMatches.length})</h3>
              {completedMatches.map(match => {
                let winnerName = '';
                if (match.scoreA > match.scoreB) winnerName = match.squadA?.teamId?.name;
                else if (match.scoreB > match.scoreA) winnerName = match.squadB?.teamId?.name;
                else winnerName = 'Draw';
                return (
                  <div key={match._id} className={liveStyles.matchCard} onClick={() => setSelectedMatch(match)} style={{ opacity: 0.8 }}>
                    <div className={liveStyles.matchSport}>{match.sportId?.name || 'Sport'} · {match.round}</div>
                    <div className={liveStyles.matchTeams}>
                      <div className={liveStyles.teamSide}>
                        <span className={liveStyles.teamName}>{match.squadA?.teamId?.name || '?'}</span>
                        <span className={liveStyles.score}>{match.scoreA}</span>
                      </div>
                      <span className={liveStyles.vs}>VS</span>
                      <div className={liveStyles.teamSide}>
                        <span className={liveStyles.teamName}>{match.squadB?.teamId?.name || '?'}</span>
                        <span className={liveStyles.score}>{match.scoreB}</span>
                      </div>
                    </div>
                    <div className={liveStyles.matchActions}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>Winner: {winnerName}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {liveMatches.length === 0 && upcomingMatches.length === 0 && completedMatches.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No matches found</p>
            </div>
          )}
        </div>

        <div className={liveStyles.eventPanel}>
          {selectedMatch ? (
            <>
              <h3 className={liveStyles.panelTitle}>
                Match Events — {selectedMatch.squadA?.teamId?.name} vs {selectedMatch.squadB?.teamId?.name}
              </h3>

              <div className={liveStyles.sportHint}>
                {selectedSportType === 'chess' && 'Chess Mode — Use +/- 0.5 for half-point increments'}
                {selectedSportType === 'football' && 'Football Mode — Add goal scorers below to auto-increment score'}
                {selectedSportType === 'standard' && `${selectedMatch.sportId?.name} — Standard scoring mode`}
              </div>

              {selectedSportType === 'football' && selectedMatch.status === 'live' && (
                <div className={liveStyles.goalSection}>
                  <h4 className={liveStyles.goalTitle}>Goal Scorers</h4>
                  <form onSubmit={handleAddGoalScorer} className={liveStyles.goalForm}>
                    <input className={styles.input} value={goalPlayer} onChange={(e) => setGoalPlayer(e.target.value)} placeholder="Player name" required style={{flex:1}} />
                    <input className={styles.input} value={goalMinute} onChange={(e) => setGoalMinute(e.target.value)} placeholder="Min" style={{width: 60}} />
                    <select className={styles.select} value={goalTeam} onChange={(e) => setGoalTeam(e.target.value)} style={{width: 140}}>
                      <option value="A">{selectedMatch.squadA?.teamId?.name || 'Team A'}</option>
                      <option value="B">{selectedMatch.squadB?.teamId?.name || 'Team B'}</option>
                    </select>
                    <button type="submit" className={styles.primaryBtn}>Add Goal</button>
                  </form>
                  {(selectedMatch.goalScorers || []).length > 0 && (
                    <div className={liveStyles.goalsList}>
                      {selectedMatch.goalScorers.map((gs, i) => (
                        <div key={gs._id || i} className={liveStyles.goalItem}>
                          <span>Goal: {gs.player} {gs.minute ? `(${gs.minute}')` : ''}</span>
                          <span className={liveStyles.goalTeamLabel}>
                            {gs.team === 'A' ? selectedMatch.squadA?.teamId?.name : selectedMatch.squadB?.teamId?.name}
                          </span>
                          <button onClick={() => handleRemoveGoalScorer(gs._id)} className={liveStyles.goalRemoveBtn}>x</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleAddEvent} className={liveStyles.eventForm}>
                <input className={styles.input} value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="Event description (e.g. Yellow Card)" required />
                <input className={styles.input} value={eventPlayer} onChange={(e) => setEventPlayer(e.target.value)} placeholder="Player name (optional)" />
                <select className={styles.select} value={eventType} onChange={(e) => setEventType(e.target.value)}>
                  <option value="goal">Goal</option>
                  <option value="foul">Foul</option>
                  <option value="card">Card</option>
                  <option value="substitution">Substitution</option>
                  <option value="timeout">Timeout</option>
                  <option value="other">Other</option>
                </select>
                <button type="submit" className={styles.primaryBtn}>Push Event</button>
              </form>

              <div className={liveStyles.timeline}>
                {(selectedMatch.matchEvents || []).slice().reverse().map((ev, i) => (
                  <div key={i} className={liveStyles.timelineItem}>
                    <span className={liveStyles.timelineTime}>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                    <div className={liveStyles.timelineContent}>
                      <span className={liveStyles.timelineType}>{ev.type}</span>
                      <span>{ev.description}</span>
                      {ev.player && <span className={liveStyles.timelinePlayer}>— {ev.player}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Select a match to manage events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, selected, onSelect, onScoreChange, onStatusChange }) {
  const sportType = getSportType(match.sportId?.name);
  const isChess = sportType === 'chess';
  const increment = isChess ? 0.5 : 1;

  return (
    <div className={`${liveStyles.matchCard} ${selected ? liveStyles.matchCardSelected : ''}`} onClick={onSelect}>
      <div className={liveStyles.matchSport}>{match.sportId?.name || 'Sport'}</div>
      <div className={liveStyles.matchTeams}>
        <div className={liveStyles.teamSide}>
          <span className={liveStyles.teamName}>{match.squadA?.teamId?.name || '?'}</span>
          <div className={liveStyles.scoreControls}>
            <button onClick={(e) => { e.stopPropagation(); onScoreChange(match._id, 'A', -increment); }} className={liveStyles.scoreBtn}>-{isChess ? '0.5' : ''}</button>
            <span className={liveStyles.score}>{match.scoreA}</span>
            <button onClick={(e) => { e.stopPropagation(); onScoreChange(match._id, 'A', increment); }} className={liveStyles.scoreBtn}>+{isChess ? '0.5' : ''}</button>
          </div>
        </div>
        <span className={liveStyles.vs}>VS</span>
        <div className={liveStyles.teamSide}>
          <span className={liveStyles.teamName}>{match.squadB?.teamId?.name || '?'}</span>
          <div className={liveStyles.scoreControls}>
            <button onClick={(e) => { e.stopPropagation(); onScoreChange(match._id, 'B', -increment); }} className={liveStyles.scoreBtn}>-{isChess ? '0.5' : ''}</button>
            <span className={liveStyles.score}>{match.scoreB}</span>
            <button onClick={(e) => { e.stopPropagation(); onScoreChange(match._id, 'B', increment); }} className={liveStyles.scoreBtn}>+{isChess ? '0.5' : ''}</button>
          </div>
        </div>
      </div>
      {isChess && match.status === 'live' && (
        <div className={liveStyles.matchActions} style={{ gap: 8 }}>
          <button onClick={(e) => {
            e.stopPropagation();
            onScoreChange(match._id, 'A', 0.5);
            setTimeout(() => onScoreChange(match._id, 'B', 0.5), 200);
          }} className={liveStyles.drawBtn}>
            Draw (0.5-0.5)
          </button>
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(match._id, 'completed'); }} className={liveStyles.endBtn}>
            End Match
          </button>
        </div>
      )}
      {!isChess && (
        <div className={liveStyles.matchActions}>
          {match.status === 'upcoming' && (
            <button onClick={(e) => { e.stopPropagation(); onStatusChange(match._id, 'live'); }} className={liveStyles.goLiveBtn}>
              Go Live
            </button>
          )}
          {match.status === 'live' && (
            <button onClick={(e) => { e.stopPropagation(); onStatusChange(match._id, 'completed'); }} className={liveStyles.endBtn}>
              End Match
            </button>
          )}
        </div>
      )}
      {isChess && match.status === 'upcoming' && (
        <div className={liveStyles.matchActions}>
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(match._id, 'live'); }} className={liveStyles.goLiveBtn}>
            Go Live
          </button>
        </div>
      )}
    </div>
  );
}
