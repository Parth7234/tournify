'use client';

import { useState, useEffect } from 'react';
import { getMatches, updateMatchScore, addMatchEvent, addGoalScorer, removeGoalScorer } from '@/app/actions/matchActions';
import { getSports } from '@/app/actions/sportActions';
import { getEvents } from '@/app/actions/eventActions';

const inputCls = "w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary-container/50 focus:border-primary outline-none transition-all";

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
  useEffect(() => { if (!selectedEvent) return; const interval = setInterval(loadData, 10000); return () => clearInterval(interval); }, [selectedEvent]);

  async function loadEvents() { const data = await getEvents(); setEvents(data); if (data.length > 0) setSelectedEvent(data[0]._id); setLoading(false); }

  async function loadData() {
    const sp = await getSports(selectedEvent);
    setSports(sp);
    let matches = [];
    for (const sport of sp) { const m = await getMatches(sport._id); matches = [...matches, ...m]; }
    matches.sort((a, b) => { const order = { live: 0, upcoming: 1, completed: 2 }; return (order[a.status] || 3) - (order[b.status] || 3); });
    setAllMatches(matches);
    if (selectedMatch) { const updated = matches.find(m => m._id === selectedMatch._id); if (updated) setSelectedMatch(updated); }
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
    await addMatchEvent(selectedMatch._id, { description: eventDesc, player: eventPlayer, type: eventType });
    setEventDesc(''); setEventPlayer(''); setEventType('other');
    await loadData();
  }

  async function handleAddGoalScorer(e) {
    e.preventDefault();
    if (!selectedMatch || !goalPlayer.trim()) return;
    await addGoalScorer(selectedMatch._id, { player: goalPlayer, team: goalTeam, minute: goalMinute });
    const data = {};
    if (goalTeam === 'A') data.scoreA = selectedMatch.scoreA + 1; else data.scoreB = selectedMatch.scoreB + 1;
    await updateMatchScore(selectedMatch._id, data);
    await addMatchEvent(selectedMatch._id, { description: `Goal by ${goalPlayer}${goalMinute ? ` (${goalMinute}')` : ''}`, player: goalPlayer, type: 'goal' });
    setGoalPlayer(''); setGoalMinute('');
    await loadData();
  }

  async function handleRemoveGoalScorer(scorerId) { if (!selectedMatch) return; await removeGoalScorer(selectedMatch._id, scorerId); await loadData(); }

  const liveMatches = allMatches.filter(m => m.status === 'live');
  const upcomingMatches = allMatches.filter(m => m.status === 'upcoming');
  const completedMatches = allMatches.filter(m => m.status === 'completed');
  const selectedSportType = selectedMatch ? getSportType(selectedMatch.sportId?.name) : 'standard';

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      <span className="text-on-surface-variant text-sm">Loading...</span>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Live Desk</h1>
          <p className="text-sm text-on-surface-variant mt-1">Update live scores and match events in real-time</p>
        </div>
      </div>

      <select className={inputCls + " max-w-[240px] mb-6"} value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
        {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
      </select>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Match List */}
        <div className="lg:col-span-2 flex flex-col gap-3 max-h-[75vh] overflow-y-auto pr-1">
          {liveMatches.length > 0 && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e66c4f] animate-live-pulse" /> Live Now
              </h3>
              {liveMatches.map(match => (
                <MatchCard key={match._id} match={match} selected={selectedMatch?._id === match._id} onSelect={() => setSelectedMatch(match)} onScoreChange={handleScoreChange} onStatusChange={handleStatusChange} />
              ))}
            </>
          )}
          {upcomingMatches.length > 0 && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-sm text-outline">schedule</span> Upcoming
              </h3>
              {upcomingMatches.map(match => (
                <MatchCard key={match._id} match={match} selected={selectedMatch?._id === match._id} onSelect={() => setSelectedMatch(match)} onScoreChange={handleScoreChange} onStatusChange={handleStatusChange} />
              ))}
            </>
          )}
          {completedMatches.length > 0 && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-sm text-outline">task_alt</span> Completed ({completedMatches.length})
              </h3>
              {completedMatches.map(match => {
                let winnerName = '';
                if (match.scoreA > match.scoreB) winnerName = match.squadA?.teamId?.name;
                else if (match.scoreB > match.scoreA) winnerName = match.squadB?.teamId?.name;
                else winnerName = 'Draw';
                return (
                  <div key={match._id} onClick={() => setSelectedMatch(match)} className={`bg-surface-container-lowest rounded-xl p-4 border cursor-pointer transition-all duration-200 opacity-60 hover:opacity-100 ${selectedMatch?._id === match._id ? 'border-primary-container/30 opacity-100 shadow-sm' : 'border-outline-variant/20'}`}>
                    <div className="text-xs uppercase tracking-wider text-outline mb-2 font-semibold">{match.sportId?.name} · {match.round}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-on-surface">{match.squadA?.teamId?.name}</span>
                      <span className="text-sm font-extrabold text-on-surface">{match.scoreA} - {match.scoreB}</span>
                      <span className="text-sm font-semibold text-on-surface">{match.squadB?.teamId?.name}</span>
                    </div>
                    <p className="text-xs text-primary font-bold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                      {winnerName}
                    </p>
                  </div>
                );
              })}
            </>
          )}
          {liveMatches.length === 0 && upcomingMatches.length === 0 && completedMatches.length === 0 && (
            <div className="text-center py-14 text-on-surface-variant text-sm flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-outline-variant">inbox</span>
              No matches found
            </div>
          )}
        </div>

        {/* Event Panel */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 min-h-[400px] overflow-hidden">
          {selectedMatch ? (
            <div className="flex flex-col h-full">
              {/* Panel header */}
              <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/15">
                <h3 className="font-extrabold text-on-surface text-lg">{selectedMatch.squadA?.teamId?.name} vs {selectedMatch.squadB?.teamId?.name}</h3>
                <p className="text-xs text-outline mt-1 bg-surface-container rounded-lg px-3 py-1.5 inline-block">
                  {selectedSportType === 'chess' && 'Chess Mode — Use +/- 0.5 for half-point increments'}
                  {selectedSportType === 'football' && 'Football Mode — Add goal scorers below to auto-increment score'}
                  {selectedSportType === 'standard' && `${selectedMatch.sportId?.name} — Standard scoring mode`}
                </p>
              </div>

              <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto">
                {/* Football Goal Scorers */}
                {selectedSportType === 'football' && selectedMatch.status === 'live' && (
                  <div className="pb-4 border-b border-outline-variant/15">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Goal Scorers</h4>
                    <form onSubmit={handleAddGoalScorer} className="flex gap-2 mb-3">
                      <input className={inputCls + " flex-1"} value={goalPlayer} onChange={e => setGoalPlayer(e.target.value)} placeholder="Player name" required />
                      <input className={inputCls + " w-16"} value={goalMinute} onChange={e => setGoalMinute(e.target.value)} placeholder="Min" />
                      <select className={inputCls + " w-36"} value={goalTeam} onChange={e => setGoalTeam(e.target.value)}>
                        <option value="A">{selectedMatch.squadA?.teamId?.name || 'Team A'}</option>
                        <option value="B">{selectedMatch.squadB?.teamId?.name || 'Team B'}</option>
                      </select>
                      <button type="submit" className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 whitespace-nowrap shadow-sm shadow-primary/10">Add Goal</button>
                    </form>
                    {(selectedMatch.goalScorers || []).map((gs, i) => (
                      <div key={gs._id || i} className="flex items-center justify-between py-2 text-sm border-b border-outline-variant/10 last:border-0">
                        <span className="text-on-surface font-medium">⚽ {gs.player} {gs.minute ? `(${gs.minute}')` : ''}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-outline">{gs.team === 'A' ? selectedMatch.squadA?.teamId?.name : selectedMatch.squadB?.teamId?.name}</span>
                          <button onClick={() => handleRemoveGoalScorer(gs._id)} className="text-outline hover:text-error text-xs transition-colors px-1.5 py-0.5 rounded hover:bg-error-container/20">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Event */}
                <form onSubmit={handleAddEvent} className="flex flex-col gap-2 pb-4 border-b border-outline-variant/15">
                  <input className={inputCls} value={eventDesc} onChange={e => setEventDesc(e.target.value)} placeholder="Event description (e.g. Yellow Card)" required />
                  <div className="flex gap-2">
                    <input className={inputCls + " flex-1"} value={eventPlayer} onChange={e => setEventPlayer(e.target.value)} placeholder="Player name (optional)" />
                    <select className={inputCls + " w-36"} value={eventType} onChange={e => setEventType(e.target.value)}>
                      <option value="goal">Goal</option><option value="foul">Foul</option><option value="card">Card</option>
                      <option value="substitution">Substitution</option><option value="timeout">Timeout</option><option value="other">Other</option>
                    </select>
                    <button type="submit" className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 whitespace-nowrap shadow-sm shadow-primary/10">Push Event</button>
                  </div>
                </form>

                {/* Timeline */}
                <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                  {(selectedMatch.matchEvents || []).slice().reverse().map((ev, i) => (
                    <div key={i} className="flex gap-3 items-start py-2.5 border-b border-outline-variant/10 last:border-0">
                      <span className="text-xs font-bold text-outline whitespace-nowrap mt-1">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">{ev.type}</span>
                        <span className="text-sm text-on-surface">{ev.description}</span>
                        {ev.player && <span className="text-xs text-outline">— {ev.player}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-on-surface-variant text-sm flex-col gap-3 p-12">
              <span className="material-symbols-outlined text-4xl text-outline-variant">touch_app</span>
              <p>Select a match to manage events</p>
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
    <div onClick={onSelect} className={`rounded-xl p-4 border cursor-pointer transition-all duration-200 ${selected ? 'bg-primary-fixed/20 border-primary-container/30 shadow-md shadow-primary/10' : 'bg-surface-container-lowest border-outline-variant/20 hover:shadow-sm hover:border-outline-variant/40'}`}>
      <div className="text-xs uppercase tracking-wider text-outline mb-2.5 font-semibold">{match.sportId?.name || 'Sport'}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-center">
          <span className="text-sm font-semibold text-on-surface block mb-1.5">{match.squadA?.teamId?.name || '?'}</span>
          <div className="flex items-center justify-center gap-1.5">
            <button onClick={e => { e.stopPropagation(); onScoreChange(match._id, 'A', -increment); }} className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-surface-container-highest transition-colors flex items-center justify-center">-</button>
            <span className="text-lg font-extrabold text-on-surface min-w-[28px] text-center">{match.scoreA}</span>
            <button onClick={e => { e.stopPropagation(); onScoreChange(match._id, 'A', increment); }} className="w-7 h-7 rounded-lg bg-primary-fixed/30 text-primary text-xs font-bold hover:bg-primary-fixed/50 transition-colors flex items-center justify-center">+</button>
          </div>
        </div>
        <span className="text-xs text-outline font-bold">VS</span>
        <div className="flex-1 text-center">
          <span className="text-sm font-semibold text-on-surface block mb-1.5">{match.squadB?.teamId?.name || '?'}</span>
          <div className="flex items-center justify-center gap-1.5">
            <button onClick={e => { e.stopPropagation(); onScoreChange(match._id, 'B', -increment); }} className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-surface-container-highest transition-colors flex items-center justify-center">-</button>
            <span className="text-lg font-extrabold text-on-surface min-w-[28px] text-center">{match.scoreB}</span>
            <button onClick={e => { e.stopPropagation(); onScoreChange(match._id, 'B', increment); }} className="w-7 h-7 rounded-lg bg-primary-fixed/30 text-primary text-xs font-bold hover:bg-primary-fixed/50 transition-colors flex items-center justify-center">+</button>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-3">
        {isChess && match.status === 'live' && (
          <>
            <button onClick={e => { e.stopPropagation(); onScoreChange(match._id, 'A', 0.5); setTimeout(() => onScoreChange(match._id, 'B', 0.5), 200); }} className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg hover:bg-surface-container-high transition-colors">Draw (0.5-0.5)</button>
            <button onClick={e => { e.stopPropagation(); onStatusChange(match._id, 'completed'); }} className="text-xs font-bold text-error bg-error-container/30 px-3 py-1.5 rounded-lg hover:bg-error-container/50 transition-colors">End Match</button>
          </>
        )}
        {!isChess && match.status === 'upcoming' && (
          <button onClick={e => { e.stopPropagation(); onStatusChange(match._id, 'live'); }} className="text-xs font-bold text-on-primary bg-primary px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/10">Go Live</button>
        )}
        {!isChess && match.status === 'live' && (
          <button onClick={e => { e.stopPropagation(); onStatusChange(match._id, 'completed'); }} className="text-xs font-bold text-error bg-error-container/30 px-4 py-1.5 rounded-lg hover:bg-error-container/50 transition-colors">End Match</button>
        )}
        {isChess && match.status === 'upcoming' && (
          <button onClick={e => { e.stopPropagation(); onStatusChange(match._id, 'live'); }} className="text-xs font-bold text-on-primary bg-primary px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/10">Go Live</button>
        )}
      </div>
    </div>
  );
}
