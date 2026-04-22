'use client';

import { useState, useEffect } from 'react';
import { getEvents } from '@/app/actions/eventActions';
import { getTeams, createTeam, updateTeam, deleteTeam, getPlayers, createPlayer, deletePlayer } from '@/app/actions/teamActions';
import { getSports } from '@/app/actions/sportActions';
import styles from '../shared.module.css';

export default function TeamsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [teams, setTeams] = useState([]);
  const [sports, setSports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', optOutSports: [] });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadTeams();
      loadSports();
    }
  }, [selectedEvent]);

  async function loadEvents() {
    const data = await getEvents();
    setEvents(data);
    if (data.length > 0) {
      setSelectedEvent(data[0]._id);
    }
    setLoading(false);
  }

  async function loadTeams() {
    const data = await getTeams(selectedEvent);
    setTeams(data);
  }

  async function loadSports() {
    const data = await getSports(selectedEvent);
    setSports(data);
  }

  function openCreate() {
    setEditingTeam(null);
    setForm({ name: '', optOutSports: [] });
    setShowModal(true);
  }

  function openEdit(team) {
    setEditingTeam(team);
    setForm({
      name: team.name,
      optOutSports: team.optOutSports?.map(s => s._id || s) || [],
    });
    setShowModal(true);
  }

  async function openPlayers(team) {
    setSelectedTeam(team);
    const data = await getPlayers(team._id);
    setPlayers(data);
    setShowPlayerModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingTeam) {
        await updateTeam(editingTeam._id, form);
      } else {
        await createTeam({ ...form, eventId: selectedEvent });
      }
      setShowModal(false);
      loadTeams();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddPlayer(e) {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    await createPlayer({ name: newPlayerName, teamId: selectedTeam._id });
    setNewPlayerName('');
    const data = await getPlayers(selectedTeam._id);
    setPlayers(data);
  }

  async function handleDeletePlayer(id) {
    await deletePlayer(id);
    const data = await getPlayers(selectedTeam._id);
    setPlayers(data);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this team and all its players?')) return;
    await deleteTeam(id);
    loadTeams();
  }

  function toggleOptOut(sportId) {
    setForm(prev => {
      const optOut = prev.optOutSports.includes(sportId)
        ? prev.optOutSports.filter(s => s !== sportId)
        : [...prev.optOutSports, sportId];
      return { ...prev, optOutSports: optOut };
    });
  }

  if (loading) return <div className={styles.emptyState}><p>Loading...</p></div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Teams</h1>
          <p className={styles.pageSubtitle}>Manage teams and players for each event</p>
        </div>
        <button onClick={openCreate} className={styles.primaryBtn} disabled={!selectedEvent}>+ Add Team</button>
      </div>

      <div className={styles.selectGroup}>
        <select
          className={styles.select}
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          style={{ width: '300px' }}
        >
          <option value="">Select Event</option>
          {events.map(ev => (
            <option key={ev._id} value={ev._id}>{ev.name}</option>
          ))}
        </select>
      </div>

      {teams.length === 0 ? (
        <div className={styles.emptyState}>


          <p className={styles.emptyText}>No teams yet. Add teams to this event!</p>
        </div>
      ) : (
        <div className={styles.itemsList}>
          {teams.map((team) => (
            <div key={team._id} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{team.name}</span>
                <span className={styles.itemMeta}>
                  {team.optOutSports?.length > 0
                    ? `Opted out of ${team.optOutSports.length} sport(s)`
                    : 'Participating in all sports'}
                </span>
              </div>
              <div className={styles.itemActions}>
                <button onClick={() => openPlayers(team)} className={styles.secondaryBtn}>👤 Players</button>
                <button onClick={() => openEdit(team)} className={styles.secondaryBtn}>Edit</button>
                <button onClick={() => handleDelete(team._id)} className={styles.dangerBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Create/Edit Modal */}
      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editingTeam ? 'Edit Team' : 'Add Team'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup} style={{ marginBottom: 20 }}>
                <label className={styles.label}>Team Name</label>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Year 1, Engineering"
                  required
                />
              </div>
              {sports.length > 0 && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Opt-out from Sports (optional)</label>
                  {sports.map(sport => (
                    <div key={sport._id} className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        id={`opt-${sport._id}`}
                        checked={form.optOutSports.includes(sport._id)}
                        onChange={() => toggleOptOut(sport._id)}
                      />
                      <label htmlFor={`opt-${sport._id}`} className={styles.checkboxLabel}>
                        {sport.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.secondaryBtn}>Cancel</button>
                <button type="submit" className={styles.primaryBtn}>{editingTeam ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Players Modal */}
      {showPlayerModal && selectedTeam && (
        <div className={styles.modal} onClick={() => setShowPlayerModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Players — {selectedTeam.name}</h2>
            <form onSubmit={handleAddPlayer} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className={styles.input}
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player name"
                style={{ flex: 1 }}
              />
              <button type="submit" className={styles.primaryBtn}>Add</button>
            </form>
            {players.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20 }}>No players yet</p>
            ) : (
              <div className={styles.itemsList}>
                {players.map(p => (
                  <div key={p._id} className={styles.itemRow}>
                    <span className={styles.itemName}>{p.name}</span>
                    <button onClick={() => handleDeletePlayer(p._id)} className={styles.dangerBtn}>Remove</button>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowPlayerModal(false)} className={styles.secondaryBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
