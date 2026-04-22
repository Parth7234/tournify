'use client';

import { useState, useEffect } from 'react';
import { getEvents } from '@/app/actions/eventActions';
import { getSports, updateSport } from '@/app/actions/sportActions';
import { getSquads, updateSquad } from '@/app/actions/squadActions';
import { generateTournamentMatches, getMatches, updateMatchSchedule } from '@/app/actions/matchActions';
import styles from '../shared.module.css';

export default function TournamentsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [squads, setSquads] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupCount, setGroupCount] = useState(2);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { if (selectedEvent) loadSports(); }, [selectedEvent]);

  async function loadEvents() {
    const data = await getEvents();
    setEvents(data);
    if (data.length > 0) setSelectedEvent(data[0]._id);
    setLoading(false);
  }

  async function loadSports() {
    const data = await getSports(selectedEvent);
    setSports(data);
  }

  async function selectSport(sport) {
    setSelectedSport(sport);
    const sq = await getSquads(sport._id);
    setSquads(sq);
    const m = await getMatches(sport._id);
    setMatches(m);
    setMsg('');
  }

  async function handleGenerate() {
    if (!selectedSport) return;
    if (selectedSport.tournamentGenerated && !confirm('Re-generate? This will delete existing matches.')) return;
    setGenerating(true);
    try {
      await generateTournamentMatches(selectedSport._id);
      const m = await getMatches(selectedSport._id);
      setMatches(m);
      setMsg('Tournament matches generated!');
      loadSports();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
    setGenerating(false);
  }

  async function handleRandomGroups() {
    if (!selectedSport || squads.length < groupCount * 2) {
      alert('Not enough squads for the number of groups');
      return;
    }
    const shuffled = [...squads].sort(() => Math.random() - 0.5);
    const labels = 'ABCDEFGHIJKLMNOP'.split('');
    const groups = [];

    for (let i = 0; i < groupCount; i++) {
      groups.push({ label: `Group ${labels[i]}`, squads: [] });
    }

    shuffled.forEach((sq, i) => {
      groups[i % groupCount].squads.push(sq._id);
    });

    // Update each squad with its group label
    for (const group of groups) {
      for (const sqId of group.squads) {
        await updateSquad(sqId, { groupLabel: group.label });
      }
    }

    // Update sport with groups
    await updateSport(selectedSport._id, {
      ...selectedSport,
      groups,
    });

    setShowGroupModal(false);
    await selectSport(selectedSport);
    setMsg('Groups assigned randomly!');
  }

  async function handleSchedule(matchId, datetime) {
    await updateMatchSchedule(matchId, datetime);
    const m = await getMatches(selectedSport._id);
    setMatches(m);
  }

  if (loading) return <div className={styles.emptyState}><p>Loading...</p></div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Tournaments</h1>
          <p className={styles.pageSubtitle}>Generate brackets and manage match schedules</p>
        </div>
      </div>

      <div className={styles.selectGroup}>
        <select className={styles.select} value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} style={{width:'240px'}}>
          {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
        </select>
      </div>

      {msg && <div className={msg.startsWith('Error') ? styles.errorMsg : styles.successMsg}>{msg}</div>}

      <div style={{display:'flex', gap: 12, flexWrap:'wrap', marginBottom: 24}}>
        {sports.map(sp => (
          <button
            key={sp._id}
            onClick={() => selectSport(sp)}
            className={selectedSport?._id === sp._id ? styles.primaryBtn : styles.secondaryBtn}
          >
            {sp.name} {sp.tournamentGenerated ? '(Generated)' : ''}
          </button>
        ))}
      </div>

      {selectedSport && (
        <div className={styles.card}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
            <div>
              <h3 style={{color:'#fff', margin:0}}>{selectedSport.name}</h3>
              <p style={{color:'rgba(255,255,255,0.4)', fontSize:13, margin:'4px 0 0'}}>
                Format: {selectedSport.tournamentFormat.replace(/_/g, ' ')} · {squads.length} squads
              </p>
            </div>
            <div style={{display:'flex', gap:8}}>
              {(selectedSport.tournamentFormat === 'hybrid' || selectedSport.tournamentFormat === 'round_robin') && (
                <button onClick={() => setShowGroupModal(true)} className={styles.secondaryBtn}>
                  🎲 Manage Groups
                </button>
              )}
              <button onClick={handleGenerate} className={styles.primaryBtn} disabled={generating || squads.length < 2}>
                {generating ? 'Generating...' : selectedSport.tournamentGenerated ? '🔄 Regenerate' : '⚡ Generate Matches'}
              </button>
            </div>
          </div>

          {matches.length > 0 && (
            <div className={styles.itemsList}>
              {matches.map(match => (
                <div key={match._id} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>
                      {match.squadA?.teamId?.name || '?'} vs {match.squadB?.teamId?.name || '?'}
                    </span>
                    <span className={styles.itemMeta}>
                      {match.round}{match.group ? ` · ${match.group}` : ''} · {match.status}
                    </span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <input
                      type="datetime-local"
                      className={styles.input}
                      defaultValue={match.scheduledAt ? new Date(match.scheduledAt).toISOString().slice(0,16) : ''}
                      onChange={(e) => handleSchedule(match._id, e.target.value)}
                      style={{width: 200, fontSize: 12}}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showGroupModal && (
        <div className={styles.modal} onClick={() => setShowGroupModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Manage Groups</h2>
            <div className={styles.formGroup} style={{marginBottom:16}}>
              <label className={styles.label}>Number of Groups</label>
              <input type="number" className={styles.input} value={groupCount} onChange={(e) => setGroupCount(parseInt(e.target.value) || 2)} min={2} max={8} />
            </div>
            <p style={{color:'rgba(255,255,255,0.5)', fontSize:13, marginBottom:16}}>
              {squads.length} squads will be distributed across {groupCount} groups.
            </p>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowGroupModal(false)} className={styles.secondaryBtn}>Cancel</button>
              <button onClick={handleRandomGroups} className={styles.primaryBtn}>🎲 Randomize</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
