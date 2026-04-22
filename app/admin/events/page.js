'use client';

import { useState, useEffect } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/app/actions/eventActions';
import styles from '../shared.module.css';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', description: '', startDate: '', endDate: '', status: 'draft',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingEvent(null);
    setForm({ name: '', description: '', startDate: '', endDate: '', status: 'draft' });
    setShowModal(true);
  }

  function openEdit(event) {
    setEditingEvent(event);
    setForm({
      name: event.name,
      description: event.description || '',
      startDate: event.startDate?.split('T')[0] || '',
      endDate: event.endDate?.split('T')[0] || '',
      status: event.status,
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateEvent(editingEvent._id, form);
      } else {
        await createEvent(form);
      }
      setShowModal(false);
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    await deleteEvent(id);
    loadEvents();
  }

  const statusClass = (s) => {
    if (s === 'draft') return styles.statusDraft;
    if (s === 'active') return styles.statusActive;
    return styles.statusCompleted;
  };

  if (loading) return <div className={styles.emptyState}><p>Loading events...</p></div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Events</h1>
          <p className={styles.pageSubtitle}>Manage your tournament events</p>
        </div>
        <button onClick={openCreate} className={styles.primaryBtn}>+ New Event</button>
      </div>

      {events.length === 0 ? (
        <div className={styles.emptyState}>


          <p className={styles.emptyText}>No events yet. Create your first event!</p>
        </div>
      ) : (
        <div className={styles.itemsList}>
          {events.map((event) => (
            <div key={event._id} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{event.name}</span>
                <span className={styles.itemMeta}>
                  {new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()}
                  {event.description && ` · ${event.description}`}
                </span>
              </div>
              <div className={styles.itemActions}>
                <span className={`${styles.statusBadge} ${statusClass(event.status)}`}>
                  {event.status}
                </span>
                <button onClick={() => openEdit(event)} className={styles.secondaryBtn}>Edit</button>
                <button onClick={() => handleDelete(event._id)} className={styles.dangerBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Event Name</label>
                  <input
                    className={styles.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. General Championship 2026"
                    required
                  />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the event..."
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Start Date</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>End Date</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status</label>
                  <select
                    className={styles.select}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.secondaryBtn}>Cancel</button>
                <button type="submit" className={styles.primaryBtn}>
                  {editingEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
