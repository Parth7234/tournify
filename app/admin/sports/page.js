'use client';

import { useState, useEffect } from 'react';
import { getEvents } from '@/app/actions/eventActions';
import { getSports, createSport, updateSport, deleteSport } from '@/app/actions/sportActions';
import styles from '../shared.module.css';

const ALLOWED_SPORTS = [
  { value: 'Basketball', label: 'Basketball' },
  { value: 'Volleyball', label: 'Volleyball' },
  { value: 'Chess', label: 'Chess' },
  { value: 'Table Tennis', label: 'Table Tennis' },
  { value: 'Badminton', label: 'Badminton' },
  { value: 'Football', label: 'Football' },
];

const formatLabels = {
  knockout: 'Knockout',
  round_robin: 'Round Robin',
  double_round_robin: 'Double Round Robin',
  hybrid: 'Hybrid (Group → Knockout)',
};

export default function SportsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [sports, setSports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: 'Basketball', tournamentFormat: 'knockout' });

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

  function openCreate() {
    setEditingSport(null);
    // Default to first sport not already added
    const existingNames = sports.map(s => s.name);
    const available = ALLOWED_SPORTS.find(s => !existingNames.includes(s.value));
    setForm({ name: available?.value || 'Basketball', tournamentFormat: 'knockout' });
    setShowModal(true);
  }

  function openEdit(sport) {
    setEditingSport(sport);
    setForm({ name: sport.name, tournamentFormat: sport.tournamentFormat });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingSport) {
        await updateSport(editingSport._id, form);
      } else {
        await createSport({ ...form, eventId: selectedEvent });
      }
      setShowModal(false);
      loadSports();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this sport?')) return;
    await deleteSport(id);
    loadSports();
  }

  const existingNames = sports.map(s => s.name);
  const availableSports = ALLOWED_SPORTS.filter(s => !existingNames.includes(s.value) || (editingSport && editingSport.name === s.value));

  if (loading) return <div className={styles.emptyState}><p>Loading...</p></div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Sports</h1>
          <p className={styles.pageSubtitle}>Configure sports and tournament formats</p>
        </div>
        <button onClick={openCreate} className={styles.primaryBtn} disabled={!selectedEvent || availableSports.length === 0}>
          + Add Sport
        </button>
      </div>

      <div className={styles.selectGroup}>
        <select className={styles.select} value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} style={{ width: '300px' }}>
          <option value="">Select Event</option>
          {events.map(ev => (
            <option key={ev._id} value={ev._id}>{ev.name}</option>
          ))}
        </select>
      </div>

      {sports.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No sports yet. Add sports to this event!</p>
        </div>
      ) : (
        <div className={styles.itemsList}>
          {sports.map((sport) => (
            <div key={sport._id} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{sport.name}</span>
                <span className={styles.itemMeta}>
                  Format: {formatLabels[sport.tournamentFormat]}
                  {sport.tournamentGenerated && ' · Tournament Generated'}
                </span>
              </div>
              <div className={styles.itemActions}>
                <button onClick={() => openEdit(sport)} className={styles.secondaryBtn}>Edit</button>
                <button onClick={() => handleDelete(sport._id)} className={styles.dangerBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editingSport ? 'Edit Sport' : 'Add Sport'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup} style={{ marginBottom: 16 }}>
                <label className={styles.label}>Sport</label>
                <select className={styles.select} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required>
                  {(editingSport ? ALLOWED_SPORTS : availableSports).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tournament Format</label>
                <select className={styles.select} value={form.tournamentFormat} onChange={(e) => setForm({ ...form, tournamentFormat: e.target.value })}>
                  <option value="knockout">Knockout</option>
                  <option value="round_robin">Round Robin</option>
                  <option value="double_round_robin">Double Round Robin</option>
                  <option value="hybrid">Hybrid (Group Stage → Knockout)</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.secondaryBtn}>Cancel</button>
                <button type="submit" className={styles.primaryBtn}>{editingSport ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
