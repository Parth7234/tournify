'use client';

import { useState, useEffect } from 'react';
import { getEvents } from '@/app/actions/eventActions';
import { getTeams, createTeam, updateTeam, deleteTeam, getPlayers, createPlayer, deletePlayer } from '@/app/actions/teamActions';
import { getSports } from '@/app/actions/sportActions';

const inputCls = "w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary-container/50 focus:border-primary outline-none transition-all";
const labelCls = "text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block";

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

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { if (selectedEvent) { loadTeams(); loadSports(); } }, [selectedEvent]);

  async function loadEvents() { const data = await getEvents(); setEvents(data); if (data.length > 0) setSelectedEvent(data[0]._id); setLoading(false); }
  async function loadTeams() { setTeams(await getTeams(selectedEvent)); }
  async function loadSports() { setSports(await getSports(selectedEvent)); }

  function openCreate() { setEditingTeam(null); setForm({ name: '', optOutSports: [] }); setShowModal(true); }
  function openEdit(team) { setEditingTeam(team); setForm({ name: team.name, optOutSports: team.optOutSports?.map(s => s._id || s) || [] }); setShowModal(true); }
  async function openPlayers(team) { setSelectedTeam(team); setPlayers(await getPlayers(team._id)); setShowPlayerModal(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    try { if (editingTeam) await updateTeam(editingTeam._id, form); else await createTeam({ ...form, eventId: selectedEvent }); setShowModal(false); loadTeams(); }
    catch (err) { alert(err.message); }
  }

  async function handleAddPlayer(e) { e.preventDefault(); if (!newPlayerName.trim()) return; await createPlayer({ name: newPlayerName, teamId: selectedTeam._id }); setNewPlayerName(''); setPlayers(await getPlayers(selectedTeam._id)); }
  async function handleDeletePlayer(id) { await deletePlayer(id); setPlayers(await getPlayers(selectedTeam._id)); }
  async function handleDelete(id) { if (!confirm('Delete this team and all its players?')) return; await deleteTeam(id); loadTeams(); }
  function toggleOptOut(sportId) { setForm(p => ({ ...p, optOutSports: p.optOutSports.includes(sportId) ? p.optOutSports.filter(s => s !== sportId) : [...p.optOutSports, sportId] })); }

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
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Teams</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage teams and players</p>
        </div>
        <button onClick={openCreate} disabled={!selectedEvent} className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-primary/10">
          <span className="material-symbols-outlined text-sm">add</span> Add Team
        </button>
      </div>

      <select className={inputCls + " max-w-xs mb-6"} value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
        <option value="">Select Event</option>
        {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
      </select>

      {teams.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-14 text-center border border-outline-variant/20 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-outline-variant">group_add</span>
          <p className="text-on-surface-variant text-sm">No teams yet. Add teams to this event!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 stagger-children">
          {teams.map(team => (
            <div key={team._id} className="bg-surface-container-lowest rounded-xl px-5 py-4 border border-outline-variant/20 flex justify-between items-center card-hover">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-fixed/25 flex items-center justify-center text-primary font-bold text-sm">{team.name[0]}</div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-on-surface">{team.name}</span>
                  <span className="text-xs text-outline">{team.optOutSports?.length > 0 ? `Opted out of ${team.optOutSports.length} sport(s)` : 'Participating in all sports'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openPlayers(team)} className="text-xs font-medium text-primary hover:bg-primary-fixed/20 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-sm">person</span>Players</button>
                <button onClick={() => openEdit(team)} className="text-xs font-medium text-on-surface-variant hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors">Edit</button>
                <button onClick={() => handleDelete(team._id)} className="text-xs font-medium text-outline hover:text-error px-2.5 py-1.5 rounded-lg hover:bg-error-container/20 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl shadow-primary/10 border border-outline-variant/20 animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/15">
              <h2 className="text-lg font-extrabold text-on-surface">{editingTeam ? 'Edit Team' : 'Add Team'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div><label className={labelCls}>Team Name</label><input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              {sports.length > 0 && (
                <div>
                  <label className={labelCls}>Opt-out from Sports</label>
                  <div className="flex flex-col gap-2 mt-1">
                    {sports.map(s => (
                      <label key={s._id} className="flex items-center gap-2.5 text-sm text-on-surface cursor-pointer hover:bg-surface-container-low px-2 py-1.5 rounded-lg transition-colors">
                        <input type="checkbox" className="accent-primary-container w-4 h-4 rounded" checked={form.optOutSports.includes(s._id)} onChange={() => toggleOptOut(s._id)} />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-outline-variant/15">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm shadow-primary/10">{editingTeam ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPlayerModal && selectedTeam && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={() => setShowPlayerModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl shadow-primary/10 border border-outline-variant/20 animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/15">
              <h2 className="text-lg font-extrabold text-on-surface">Players — {selectedTeam.name}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
                <input className={inputCls + " flex-1"} value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Player name" />
                <button type="submit" className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm shadow-primary/10 whitespace-nowrap">Add</button>
              </form>
              {players.length === 0 ? <p className="text-outline text-center py-6 text-sm">No players yet</p> : (
                <div className="flex flex-col gap-0.5">
                  {players.map((p, i) => (
                    <div key={p._id} className="flex justify-between items-center px-3 py-2.5 rounded-lg hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-sm font-medium text-on-surface">{p.name}</span>
                      </div>
                      <button onClick={() => handleDeletePlayer(p._id)} className="text-xs text-outline hover:text-error transition-colors px-2 py-1 rounded hover:bg-error-container/20">Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-4 pt-4 border-t border-outline-variant/15">
                <button onClick={() => setShowPlayerModal(false)} className="px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
