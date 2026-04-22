'use client';

import { useState, useEffect } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/app/actions/eventActions';

const inputCls = "w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary-container/50 focus:border-primary outline-none transition-all";
const labelCls = "text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '', status: 'draft' });

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    try { const data = await getEvents(); setEvents(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditingEvent(null); setForm({ name: '', description: '', startDate: '', endDate: '', status: 'draft' }); setShowModal(true); }
  function openEdit(event) { setEditingEvent(event); setForm({ name: event.name, description: event.description || '', startDate: event.startDate?.split('T')[0] || '', endDate: event.endDate?.split('T')[0] || '', status: event.status }); setShowModal(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    try { if (editingEvent) await updateEvent(editingEvent._id, form); else await createEvent(form); setShowModal(false); loadEvents(); }
    catch (err) { alert(err.message); }
  }

  async function handleDelete(id) { if (!confirm('Delete this event?')) return; await deleteEvent(id); loadEvents(); }

  const statusColor = (s) => s === 'active' ? 'bg-primary-fixed/30 text-primary border border-primary/15' : s === 'ended' ? 'bg-inverse-surface text-inverse-on-surface border border-inverse-surface/20' : s === 'completed' ? 'bg-surface-container text-on-surface-variant border border-outline-variant/20' : 'bg-secondary-container/30 text-secondary border border-secondary/15';

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      <span className="text-on-surface-variant text-sm">Loading events...</span>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Events</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your tournament events</p>
        </div>
        <button onClick={openCreate} className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm shadow-primary/10">
          <span className="material-symbols-outlined text-sm">add</span> New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-14 text-center border border-outline-variant/20 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-outline-variant">event_note</span>
          <p className="text-on-surface-variant text-sm">No events yet. Create your first event!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 stagger-children">
          {events.map((event) => (
            <div key={event._id} className="bg-surface-container-lowest rounded-xl px-5 py-4 border border-outline-variant/20 flex justify-between items-center card-hover">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-on-surface">{event.name}</span>
                <span className="text-xs text-outline">
                  {new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()}
                  {event.description && ` · ${event.description}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor(event.status)}`}>{event.status}</span>
                <button onClick={() => openEdit(event)} className="text-xs font-medium text-on-surface-variant hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors">Edit</button>
                <button onClick={() => handleDelete(event._id)} className="text-xs font-medium text-outline hover:text-error px-2.5 py-1.5 rounded-lg hover:bg-error-container/20 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl shadow-primary/10 border border-outline-variant/20 animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/15">
              <h2 className="text-lg font-extrabold text-on-surface">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div><label className={labelCls}>Event Name</label><input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><label className={labelCls}>Description</label><textarea className={inputCls + " h-20 resize-none"} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Start Date</label><input type="date" className={inputCls} value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required /></div>
                <div><label className={labelCls}>End Date</label><input type="date" className={inputCls} value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required /></div>
              </div>
              <div><label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option><option value="ended">Ended</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-outline-variant/15">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm shadow-primary/10 transition-colors">{editingEvent ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
