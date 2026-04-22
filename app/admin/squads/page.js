'use client';

import { useState, useEffect } from 'react';
import { getEvents } from '@/app/actions/eventActions';
import { getSports } from '@/app/actions/sportActions';
import { getTeams, getPlayers } from '@/app/actions/teamActions';
import { getSquads, createSquad, updateSquad, deleteSquad } from '@/app/actions/squadActions';

const inputCls = "w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary-container/50 focus:border-primary outline-none transition-all";
const labelCls = "text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block";

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
  useEffect(() => { if (selectedEvent) { loadSports(); loadTeams(); } }, [selectedEvent]);
  useEffect(() => { if (selectedSport) loadSquads(); }, [selectedSport]);

  async function loadEvents() { const data = await getEvents(); setEvents(data); if (data.length > 0) setSelectedEvent(data[0]._id); setLoading(false); }
  async function loadSports() { const data = await getSports(selectedEvent); setSports(data); if (data.length > 0) setSelectedSport(data[0]._id); }
  async function loadTeams() { setTeams(await getTeams(selectedEvent)); }
  async function loadSquads() { setSquads(await getSquads(selectedSport)); }

  async function openCreate() { setSelectedTeam(''); setSelectedPlayers([]); setTeamPlayers([]); setShowModal(true); }
  async function handleTeamSelect(teamId) { setSelectedTeam(teamId); if (teamId) { const p = await getPlayers(teamId); setTeamPlayers(p); setSelectedPlayers(p.map(x => x._id)); } }
  function togglePlayer(id) { setSelectedPlayers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }

  async function handleSubmit(e) { e.preventDefault(); try { await createSquad({ teamId: selectedTeam, sportId: selectedSport, players: selectedPlayers }); setShowModal(false); loadSquads(); } catch (err) { alert(err.message); } }
  async function handleDelete(id) { if (!confirm('Remove this squad?')) return; await deleteSquad(id); loadSquads(); }

  const availableTeams = teams.filter(t => {
    const hasSquad = squads.some(s => (s.teamId?._id || s.teamId) === t._id);
    const optedOut = t.optOutSports?.some(s => (s._id || s) === selectedSport);
    return !hasSquad && !optedOut;
  });

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
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Squads</h1>
          <p className="text-sm text-on-surface-variant mt-1">Register team rosters for each sport</p>
        </div>
        <button onClick={openCreate} disabled={!selectedSport || availableTeams.length === 0} className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-primary/10">
          <span className="material-symbols-outlined text-sm">add</span> Register Squad
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select className={inputCls + " max-w-[240px]"} value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
          <option value="">Select Event</option>
          {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
        </select>
        <select className={inputCls + " max-w-[240px]"} value={selectedSport} onChange={e => setSelectedSport(e.target.value)}>
          <option value="">Select Sport</option>
          {sports.map(sp => <option key={sp._id} value={sp._id}>{sp.name}</option>)}
        </select>
      </div>

      {squads.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-14 text-center border border-outline-variant/20 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-outline-variant">diversity_3</span>
          <p className="text-on-surface-variant text-sm">No squads registered yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 stagger-children">
          {squads.map(sq => (
            <div key={sq._id} className="bg-surface-container-lowest rounded-xl px-5 py-4 border border-outline-variant/20 flex justify-between items-center card-hover">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-fixed/25 flex items-center justify-center text-primary font-bold text-sm">{(sq.teamId?.name || '?')[0]}</div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-on-surface">{sq.teamId?.name || 'Unknown Team'}</span>
                  <span className="text-xs text-outline">{sq.players?.length || 0} players · Group: {sq.groupLabel || 'Unassigned'}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(sq._id)} className="text-xs font-medium text-outline hover:text-error px-2.5 py-1.5 rounded-lg hover:bg-error-container/20 transition-colors">Remove</button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl shadow-primary/10 border border-outline-variant/20 animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/15">
              <h2 className="text-lg font-extrabold text-on-surface">Register Squad</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div><label className={labelCls}>Team</label>
                <select className={inputCls} value={selectedTeam} onChange={e => handleTeamSelect(e.target.value)} required>
                  <option value="">Select Team</option>
                  {availableTeams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              {teamPlayers.length > 0 && (
                <div>
                  <label className={labelCls}>Select Players</label>
                  <div className="flex flex-col gap-2 mt-1 max-h-48 overflow-y-auto">
                    {teamPlayers.map(p => (
                      <label key={p._id} className="flex items-center gap-2.5 text-sm text-on-surface cursor-pointer hover:bg-surface-container-low px-2 py-1.5 rounded-lg transition-colors">
                        <input type="checkbox" className="accent-primary-container w-4 h-4 rounded" checked={selectedPlayers.includes(p._id)} onChange={() => togglePlayer(p._id)} />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-outline-variant/15">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm shadow-primary/10">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
