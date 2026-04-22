'use client';

import { useState, useEffect } from 'react';
import { getEvents } from '@/app/actions/eventActions';
import { getSports, createSport, updateSport, deleteSport } from '@/app/actions/sportActions';

const inputCls = "w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary-container/50 focus:border-primary outline-none transition-all";
const labelCls = "text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block";

const ALLOWED_SPORTS = [
  { value: 'Basketball', label: 'Basketball' },
  { value: 'Volleyball', label: 'Volleyball' },
  { value: 'Chess', label: 'Chess' },
  { value: 'Table Tennis', label: 'Table Tennis' },
  { value: 'Badminton', label: 'Badminton' },
  { value: 'Football', label: 'Football' },
];

const formatLabels = { knockout: 'Knockout', round_robin: 'Round Robin', double_round_robin: 'Double Round Robin', hybrid: 'Hybrid (Group → Knockout)' };

const sportIcons = { Basketball: 'sports_basketball', Volleyball: 'sports_volleyball', Chess: 'chess', 'Table Tennis': 'sports_tennis', Badminton: 'sports_tennis', Football: 'sports_soccer' };

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

  async function loadEvents() { const data = await getEvents(); setEvents(data); if (data.length > 0) setSelectedEvent(data[0]._id); setLoading(false); }
  async function loadSports() { setSports(await getSports(selectedEvent)); }

  function openCreate() {
    setEditingSport(null);
    const existingNames = sports.map(s => s.name);
    const available = ALLOWED_SPORTS.find(s => !existingNames.includes(s.value));
    setForm({ name: available?.value || 'Basketball', tournamentFormat: 'knockout' });
    setShowModal(true);
  }
  function openEdit(sport) { setEditingSport(sport); setForm({ name: sport.name, tournamentFormat: sport.tournamentFormat }); setShowModal(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    try { if (editingSport) await updateSport(editingSport._id, form); else await createSport({ ...form, eventId: selectedEvent }); setShowModal(false); loadSports(); }
    catch (err) { alert(err.message); }
  }
  async function handleDelete(id) { if (!confirm('Delete this sport?')) return; await deleteSport(id); loadSports(); }

  const existingNames = sports.map(s => s.name);
  const availableSports = ALLOWED_SPORTS.filter(s => !existingNames.includes(s.value) || (editingSport && editingSport.name === s.value));

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
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Sports</h1>
          <p className="text-sm text-on-surface-variant mt-1">Configure sports and tournament formats</p>
        </div>
        <button onClick={openCreate} disabled={!selectedEvent || availableSports.length === 0} className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-primary/10">
          <span className="material-symbols-outlined text-sm">add</span> Add Sport
        </button>
      </div>

      <select className={inputCls + " max-w-xs mb-6"} value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
        <option value="">Select Event</option>
        {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
      </select>

      {sports.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-14 text-center border border-outline-variant/20 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-outline-variant">sports_kabaddi</span>
          <p className="text-on-surface-variant text-sm">No sports yet. Add sports to this event!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 stagger-children">
          {sports.map(sport => (
            <div key={sport._id} className="bg-surface-container-lowest rounded-xl px-5 py-4 border border-outline-variant/20 flex justify-between items-center card-hover">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-fixed/25 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">{sportIcons[sport.name] || 'sports'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-on-surface">{sport.name}</span>
                  <span className="text-xs text-outline">Format: {formatLabels[sport.tournamentFormat]}{sport.tournamentGenerated && ' · Tournament Generated'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(sport)} className="text-xs font-medium text-on-surface-variant hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors">Edit</button>
                <button onClick={() => handleDelete(sport._id)} className="text-xs font-medium text-outline hover:text-error px-2.5 py-1.5 rounded-lg hover:bg-error-container/20 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl shadow-primary/10 border border-outline-variant/20 animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/15">
              <h2 className="text-lg font-extrabold text-on-surface">{editingSport ? 'Edit Sport' : 'Add Sport'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div><label className={labelCls}>Sport</label>
                <select className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required>
                  {(editingSport ? ALLOWED_SPORTS : availableSports).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Tournament Format</label>
                <select className={inputCls} value={form.tournamentFormat} onChange={e => setForm({...form, tournamentFormat: e.target.value})}>
                  <option value="knockout">Knockout</option>
                  <option value="round_robin">Round Robin</option>
                  <option value="double_round_robin">Double Round Robin</option>
                  <option value="hybrid">Hybrid (Group Stage → Knockout)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-outline-variant/15">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm shadow-primary/10">{editingSport ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
