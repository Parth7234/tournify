'use client';

import { useState, useEffect } from 'react';
import { getEvents } from '@/app/actions/eventActions';
import { getSports } from '@/app/actions/sportActions';
import { getTeams, getPlayers } from '@/app/actions/teamActions';
import { getSquads, createSquad, updateSquad, deleteSquad } from '@/app/actions/squadActions';
import styles from '../shared.module.css';

export default function SquadsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [teams, setTeams] = useState([]);
  const [squads, setSquads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => {
    if (selectedEvent) { loadSports(); loadTeams(); }
  }, [selectedEvent]);
  useEffect(() => {
    if (selectedSport) loadSquads();
  }, [selectedSport]);

  async function loadEvents() {
    const data = await getEvents();
    setEvents(data);
    if (data.length > 0) setSelectedEvent(data[0]._id);
    setLoading(false);
  }
  async function loadSports() {
    const data = await getSports(selectedEvent);
    setSports(data);
    if (data.length > 0) setSelectedSport(data[0]._id);
  }
  async function loadTeams() {
    const data = await getTeams(selectedEvent);
    setTeams(data);
  }
  async function loadSquads() {
    const data = await getSquads(selectedSport);
    setSquads(data);
  }

  async function openCreate() {
    setSelectedTeam('');
    setSelectedPlayers([]);
    setTeamPlayers([]);
    setShowModal(true);
  }

  async function handleTeamSelect(teamId) {
    setSelectedTeam(teamId);
    if (teamId) {
      const players = await getPlayers(teamId);
      setTeamPlayers(players);
      setSelectedPlayers(players.map(p => p._id));
    }
  }

  function togglePlayer(id) {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createSquad({ teamId: selectedTeam, sportId: selectedSport, players: selectedPlayers });
      setShowModal(false);
      loadSquads();
    } catch (err) { alert(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this squad?')) return;
    await deleteSquad(id);
    loadSquads();
  }

  // Filter teams that don't have squad for this sport and haven't opted out
  const availableTeams = teams.filter(t => {
    const hasSquad = squads.some(s => (s.teamId?._id || s.teamId) === t._id);
    const optedOut = t.optOutSports?.some(s => (s._id || s) === selectedSport);
    return !hasSquad && !optedOut;
  });

  if (loading) return <div className={styles.emptyState}><p>Loading...</p></div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Squads</h1>
          <p className={styles.pageSubtitle}>Register team rosters for each sport</p>
        </div>
        <button onClick={openCreate} className={styles.primaryBtn} disabled={!selectedSport || availableTeams.length === 0}>
          + Register Squad
        </button>
      </div>

      <div className={styles.selectGroup}>
        <select className={styles.select} value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} style={{width:'240px'}}>
          <option value="">Select Event</option>
          {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
        </select>
        <select className={styles.select} value={selectedSport} onChange={(e) => setSelectedSport(e.target.value)} style={{width:'240px'}}>
          <option value="">Select Sport</option>
          {sports.map(sp => <option key={sp._id} value={sp._id}>{sp.name}</option>)}
        </select>
      </div>

      {squads.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No squads registered yet.</p>
        </div>
      ) : (
        <div className={styles.itemsList}>
          {squads.map(sq => (
            <div key={sq._id} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{sq.teamId?.name || 'Unknown Team'}</span>
                <span className={styles.itemMeta}>{sq.players?.length || 0} players · Group: {sq.groupLabel || 'Unassigned'}</span>
              </div>
              <div className={styles.itemActions}>
                <button onClick={() => handleDelete(sq._id)} className={styles.dangerBtn}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Register Squad</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup} style={{marginBottom:16}}>
                <label className={styles.label}>Team</label>
                <select className={styles.select} value={selectedTeam} onChange={(e) => handleTeamSelect(e.target.value)} required>
                  <option value="">Select Team</option>
                  {availableTeams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              {teamPlayers.length > 0 && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Select Players</label>
                  {teamPlayers.map(p => (
                    <div key={p._id} className={styles.checkboxRow}>
                      <input type="checkbox" className={styles.checkbox} checked={selectedPlayers.includes(p._id)} onChange={() => togglePlayer(p._id)} id={`pl-${p._id}`} />
                      <label htmlFor={`pl-${p._id}`} className={styles.checkboxLabel}>{p.name}</label>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.secondaryBtn}>Cancel</button>
                <button type="submit" className={styles.primaryBtn}>Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
