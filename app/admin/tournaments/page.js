'use client';

import { useState, useEffect } from 'react';
import { getEvents } from '@/app/actions/eventActions';
import { getSports, updateSport } from '@/app/actions/sportActions';
import { getSquads, updateSquad } from '@/app/actions/squadActions';
import { generateTournamentMatches, getMatches, updateMatchSchedule } from '@/app/actions/matchActions';

const inputCls = "w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary-container/50 focus:border-primary outline-none transition-all";
const labelCls = "text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block";

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

  async function loadEvents() { const data = await getEvents(); setEvents(data); if (data.length > 0) setSelectedEvent(data[0]._id); setLoading(false); }
  async function loadSports() { setSports(await getSports(selectedEvent)); }

  async function selectSport(sport) { setSelectedSport(sport); setSquads(await getSquads(sport._id)); setMatches(await getMatches(sport._id)); setMsg(''); }

  async function handleGenerate() {
    if (!selectedSport) return;
    if (selectedSport.tournamentGenerated && !confirm('Re-generate? This will delete existing matches.')) return;
    setGenerating(true);
    try { await generateTournamentMatches(selectedSport._id); setMatches(await getMatches(selectedSport._id)); setMsg('Tournament matches generated!'); loadSports(); }
    catch (err) { setMsg(`Error: ${err.message}`); }
    setGenerating(false);
  }

  async function handleRandomGroups() {
    if (!selectedSport || squads.length < groupCount * 2) { alert('Not enough squads'); return; }
    const shuffled = [...squads].sort(() => Math.random() - 0.5);
    const labels = 'ABCDEFGHIJKLMNOP'.split('');
    const groups = [];
    for (let i = 0; i < groupCount; i++) groups.push({ label: `Group ${labels[i]}`, squads: [] });
    shuffled.forEach((sq, i) => groups[i % groupCount].squads.push(sq._id));
    for (const group of groups) for (const sqId of group.squads) await updateSquad(sqId, { groupLabel: group.label });
    await updateSport(selectedSport._id, { ...selectedSport, groups });
    setShowGroupModal(false);
    await selectSport(selectedSport);
    setMsg('Groups assigned randomly!');
  }

  async function handleSchedule(matchId, datetime) { await updateMatchSchedule(matchId, datetime); setMatches(await getMatches(selectedSport._id)); }

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
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Tournaments</h1>
          <p className="text-sm text-on-surface-variant mt-1">Generate brackets and manage schedules</p>
        </div>
      </div>

      <select className={inputCls + " max-w-[240px] mb-6"} value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
        {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
      </select>

      {msg && <div className={`rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2 ${msg.startsWith('Error') ? 'bg-error-container/40 text-error border border-error/20' : 'bg-primary-fixed/30 text-primary border border-primary/15'}`}>
        <span className="material-symbols-outlined text-sm">{msg.startsWith('Error') ? 'error' : 'check_circle'}</span>
        {msg}
      </div>}

      <div className="flex gap-2 flex-wrap mb-6">
        {sports.map(sp => (
          <button key={sp._id} onClick={() => selectSport(sp)} className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${selectedSport?._id === sp._id ? 'bg-primary text-on-primary shadow-md shadow-primary/15' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/25 hover:bg-surface-container-low'}`}>
            {sp.name} {sp.tournamentGenerated ? '✓' : ''}
          </button>
        ))}
      </div>

      {selectedSport && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden">
          <div className="bg-surface-container-low px-6 py-4 flex justify-between items-center border-b border-outline-variant/15">
            <div>
              <h3 className="font-extrabold text-on-surface">{selectedSport.name}</h3>
              <p className="text-xs text-outline mt-0.5">Format: {selectedSport.tournamentFormat.replace(/_/g, ' ')} · {squads.length} squads</p>
            </div>
            <div className="flex gap-2">
              {(selectedSport.tournamentFormat === 'hybrid' || selectedSport.tournamentFormat === 'round_robin') && (
                <button onClick={() => setShowGroupModal(true)} className="px-3 py-2 text-xs font-medium text-on-surface-variant border border-outline-variant/30 rounded-lg hover:bg-surface-container transition-colors">Manage Groups</button>
              )}
              <button onClick={handleGenerate} disabled={generating || squads.length < 2} className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm shadow-primary/10">
                {generating ? 'Generating...' : selectedSport.tournamentGenerated ? 'Regenerate' : 'Generate Matches'}
              </button>
            </div>
          </div>

          {matches.length > 0 && (
            <div className="p-4 flex flex-col gap-2">
              {matches.map(match => (
                <div key={match._id} className="bg-surface-container-low rounded-lg px-4 py-3 flex justify-between items-center hover:bg-surface-container transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-on-surface text-sm">{match.squadA?.teamId?.name || '?'} vs {match.squadB?.teamId?.name || '?'}</span>
                    <span className="text-xs text-outline uppercase tracking-wider">{match.round}{match.group ? ` · ${match.group}` : ''} · {match.status}</span>
                  </div>
                  <input type="datetime-local" className={inputCls + " w-48 text-xs !py-1.5"} defaultValue={match.scheduledAt ? new Date(match.scheduledAt).toISOString().slice(0,16) : ''} onChange={e => handleSchedule(match._id, e.target.value)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={() => setShowGroupModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl shadow-primary/10 border border-outline-variant/20 animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/15">
              <h2 className="text-lg font-extrabold text-on-surface">Manage Groups</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div><label className={labelCls}>Number of Groups</label><input type="number" className={inputCls} value={groupCount} onChange={e => setGroupCount(parseInt(e.target.value) || 2)} min={2} max={8} /></div>
              <p className="text-sm text-outline">{squads.length} squads across {groupCount} groups.</p>
              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/15">
                <button onClick={() => setShowGroupModal(false)} className="px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">Cancel</button>
                <button onClick={handleRandomGroups} className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm shadow-primary/10">Randomize</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
