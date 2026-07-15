import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, getDocs, writeBatch, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SportEvent, HouseColor, Sport, EventStatus, Bet } from '../types';
import { Shield, Plus, Edit2, Play, CheckCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn, getTeamName } from '../lib/utils';

const colorText = (color: string) => {
  switch (color) {
    case 'red': return 'text-red-500';
    case 'blue': return 'text-blue-500';
    case 'green': return 'text-green-500';
    case 'yellow': return 'text-yellow-500';
    default: return 'text-gray-400';
  }
};

export const Admin: React.FC = () => {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [sport, setSport] = useState<Sport>('football');
  const [phase, setPhase] = useState('Group Stage');
  const [teamA, setTeamA] = useState<HouseColor>('red');
  const [teamB, setTeamB] = useState<HouseColor>('blue');
  const [oddsA, setOddsA] = useState('1.5');
  const [oddsB, setOddsB] = useState('2.5');
  const [oddsDraw, setOddsDraw] = useState('3.0');
  const [startTime, setStartTime] = useState('');

  // Editing state
  const [editingEvent, setEditingEvent] = useState<SportEvent | null>(null);
  const [status, setStatus] = useState<EventStatus>('scheduled');
  const [scoreA, setScoreA] = useState('0');
  const [scoreB, setScoreB] = useState('0');
  const [winner, setWinner] = useState<string>('');

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startTime', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => d.data() as SportEvent));
      setLoading(false);
    });
    return unsub;
  }, []);

  const startEditing = (ev: SportEvent) => {
    setEditingEvent(ev);
    setSport(ev.sport);
    setPhase(ev.phase);
    setTeamA(ev.teamA);
    setTeamB(ev.teamB);
    setOddsA(ev.oddsA.toString());
    setOddsB(ev.oddsB.toString());
    setOddsDraw(ev.oddsDraw.toString());
    setStatus(ev.status);
    setScoreA(ev.scoreA.toString());
    setScoreB(ev.scoreB.toString());
    setWinner(ev.winner || '');
    
    // Format timestamp for datetime-local
    const date = new Date(ev.startTime);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const formatted = new Date(ev.startTime - tzoffset).toISOString().slice(0, 16);
    setStartTime(formatted);
  };

  const cancelEditing = () => {
    setEditingEvent(null);
    setSport('football');
    setPhase('Group Stage');
    setTeamA('red');
    setTeamB('blue');
    setOddsA('1.5');
    setOddsB('2.5');
    setOddsDraw('3.0');
    setStartTime('');
    setStatus('scheduled');
    setScoreA('0');
    setScoreB('0');
    setWinner('');
  };

  const resolveEvent = async (event: SportEvent, winnerOutcome: 'teamA' | 'teamB' | 'draw', bypassConfirm = false) => {
    if (!bypassConfirm && !window.confirm(`Are you sure? Winner is ${winnerOutcome}?`)) return;
    try {
      // 1. Fetch all bets related to this event
      const betsSnap = await getDocs(query(collection(db, 'bets')));
      const eventBets = betsSnap.docs.map(d => d.data() as Bet).filter(b => b.eventId === event.id);
      
      const batch = writeBatch(db);
      
      for (const bet of eventBets) {
        // Determine if this prediction is a winning one under the new outcome
        let shouldWin = false;
        if (winnerOutcome === 'draw' && bet.prediction === 'draw') shouldWin = true;
        if (winnerOutcome === 'teamA' && bet.prediction === event.teamA) shouldWin = true;
        if (winnerOutcome === 'teamB' && bet.prediction === event.teamB) shouldWin = true;

        const payout = bet.potentialPayout || (bet.amount * (
          bet.prediction === 'draw' ? event.oddsDraw : 
          bet.prediction === event.teamA ? event.oddsA : event.oddsB
        ));

        const betRef = doc(db, 'bets', bet.id);
        const userRef = doc(db, 'users', bet.userId);

        if (bet.status === 'pending') {
          // Normal case: resolving a pending bet
          batch.update(betRef, { status: shouldWin ? 'won' : 'lost' });
          if (shouldWin) {
            batch.update(userRef, { balance: increment(payout) });
          }
        } else if (bet.status === 'won' && !shouldWin) {
          // Correction case: previously won, but now should be lost (refund payout)
          batch.update(betRef, { status: 'lost' });
          batch.update(userRef, { balance: increment(-payout) });
        } else if (bet.status === 'lost' && shouldWin) {
          // Correction case: previously lost, but now should be won (add payout)
          batch.update(betRef, { status: 'won' });
          batch.update(userRef, { balance: increment(payout) });
        }
      }
      
      await batch.commit();
    } catch (err) {
      console.error(err);
      alert('Failed to resolve bets: ' + (err as Error).message);
    }
  };

  const handleCreateOrUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const BASE_POOL = 3000;
      const margin = 0.05;
      const parsedOddsA = parseFloat(oddsA);
      const parsedOddsDraw = parseFloat(oddsDraw);
      const parsedOddsB = parseFloat(oddsB);

      if (isNaN(parsedOddsA) || isNaN(parsedOddsDraw) || isNaN(parsedOddsB)) {
        alert('Odds must be valid numbers!');
        return;
      }

      if (editingEvent) {
        // Edit mode
        const evRef = doc(db, 'events', editingEvent.id);
        
        // Recalculate pool if odds have changed
        const oddsChanged = 
          parsedOddsA !== editingEvent.oddsA || 
          parsedOddsDraw !== editingEvent.oddsDraw || 
          parsedOddsB !== editingEvent.oddsB;

        const updatedFields: any = {
          sport,
          phase,
          teamA,
          teamB,
          oddsA: parsedOddsA,
          oddsB: parsedOddsB,
          oddsDraw: parsedOddsDraw,
          status,
          scoreA: parseInt(scoreA) || 0,
          scoreB: parseInt(scoreB) || 0,
          startTime: new Date(startTime).getTime()
        };

        if (oddsChanged) {
          updatedFields.poolA = (BASE_POOL * (1 - margin)) / parsedOddsA;
          updatedFields.poolB = (BASE_POOL * (1 - margin)) / parsedOddsB;
          updatedFields.poolDraw = (BASE_POOL * (1 - margin)) / parsedOddsDraw;
        }

        // Handle direct status resolution on completed status change or corrected winner
        if (status === 'completed') {
          let finalWinner = winner;
          if (!finalWinner) {
            const scA = parseInt(scoreA) || 0;
            const scB = parseInt(scoreB) || 0;
            if (scA > scB) finalWinner = 'teamA';
            else if (scB > scA) finalWinner = 'teamB';
            else finalWinner = 'draw';
          }
          updatedFields.winner = finalWinner;

          // If transitioning to completed or outcome changed, trigger resolveEvent
          const outcomeChanged = finalWinner !== editingEvent.winner || editingEvent.status !== 'completed';
          if (outcomeChanged) {
            const tempEvent: SportEvent = {
              ...editingEvent,
              ...updatedFields,
              id: editingEvent.id
            };
            await resolveEvent(tempEvent, finalWinner as 'teamA' | 'teamB' | 'draw', true);
          }
        } else {
          // If moving back to scheduled or live from completed, clear winner
          updatedFields.winner = '';
        }

        await updateDoc(evRef, updatedFields);
        alert('Event updated successfully!');
        cancelEditing();
      } else {
        // Create mode
        const ref = doc(collection(db, 'events'));
        const ev: SportEvent = {
          id: ref.id,
          sport,
          phase,
          teamA,
          teamB,
          scoreA: 0,
          scoreB: 0,
          oddsA: parsedOddsA,
          oddsB: parsedOddsB,
          oddsDraw: parsedOddsDraw,
          status: 'scheduled',
          startTime: new Date(startTime).getTime(),
          poolA: (BASE_POOL * (1 - margin)) / parsedOddsA,
          poolB: (BASE_POOL * (1 - margin)) / parsedOddsB,
          poolDraw: (BASE_POOL * (1 - margin)) / parsedOddsDraw,
        };
        await setDoc(ref, ev);
        alert('Event created successfully!');
        cancelEditing();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save event');
    }
  };

  const updateStatus = async (eventId: string, nextStatus: EventStatus) => {
    try {
      await updateDoc(doc(db, 'events', eventId), { status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const updateScore = async (eventId: string, scA: number, scB: number) => {
    try {
      await updateDoc(doc(db, 'events', eventId), { scoreA: scA, scoreB: scB });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This will not refund or alter any existing bets.')) return;
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete event');
    }
  };

  const inputClass = "w-full bg-[#0F1113] border border-gray-700 rounded p-2 text-xs font-bold text-white focus:outline-none focus:border-red-500";
  const labelClass = "block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1";

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1D21] p-6 rounded-xl border border-gray-800">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
          <Shield className="w-4 h-4 text-red-500" />
          {editingEvent ? `Edit Event: ${getTeamName(editingEvent.teamA)} vs ${getTeamName(editingEvent.teamB)}` : 'Event Manager'}
        </h2>
        <form onSubmit={handleCreateOrUpdateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Sport</label>
            <select value={sport} onChange={e=>setSport(e.target.value as Sport)} className={inputClass}>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="volleyball">Volleyball</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Phase (e.g. Semi Final)</label>
            <input required type="text" value={phase} onChange={e=>setPhase(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Team A (Color)</label>
            <select value={teamA} onChange={e=>setTeamA(e.target.value as HouseColor)} className={inputClass}>
              <option value="red">Mustang (Red)</option>
              <option value="blue">Kraken (Blue)</option>
              <option value="green">Mamba (Green)</option>
              <option value="yellow">Griffin (Yellow)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Team B (Color)</label>
            <select value={teamB} onChange={e=>setTeamB(e.target.value as HouseColor)} className={inputClass}>
              <option value="red">Mustang (Red)</option>
              <option value="blue">Kraken (Blue)</option>
              <option value="green">Mamba (Green)</option>
              <option value="yellow">Griffin (Yellow)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Start Time</label>
            <input required type="datetime-local" value={startTime} onChange={e=>setStartTime(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelClass}>Odds A</label>
              <input required type="number" step="0.01" value={oddsA} onChange={e=>setOddsA(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Odds Draw</label>
              <input required type="number" step="0.01" value={oddsDraw} onChange={e=>setOddsDraw(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Odds B</label>
              <input required type="number" step="0.01" value={oddsB} onChange={e=>setOddsB(e.target.value)} className={inputClass} />
            </div>
          </div>

          {editingEvent && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0F1113]/50 p-4 rounded-lg border border-gray-800 mt-2">
              <div>
                <label className={labelClass}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as EventStatus)} className={inputClass}>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Score A</label>
                <input required type="number" value={scoreA} onChange={e => setScoreA(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Score B</label>
                <input required type="number" value={scoreB} onChange={e => setScoreB(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Winner</label>
                <select value={winner} onChange={e => setWinner(e.target.value)} className={inputClass} disabled={status !== 'completed'}>
                  <option value="">Auto (Scores)</option>
                  <option value="teamA">{getTeamName(teamA)} (A) Win</option>
                  <option value="teamB">{getTeamName(teamB)} (B) Win</option>
                  <option value="draw">Draw</option>
                </select>
              </div>
            </div>
          )}

          <div className="md:col-span-2 mt-4 flex gap-3">
            <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
              {editingEvent ? (
                <>Save Changes</>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Event
                </>
              )}
            </button>
            {editingEvent && (
              <button type="button" onClick={cancelEditing} className="px-6 py-3 bg-[#252A30] hover:bg-[#2E343C] border border-gray-700 hover:border-gray-500 rounded text-xs font-black uppercase tracking-widest text-gray-300 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-[#1A1D21] p-6 rounded-xl border border-gray-800">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-white">Active Registry</h2>
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className="bg-[#252A30] border border-gray-700 p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#0F1113] px-2 py-0.5 rounded text-gray-400 border border-gray-800">{ev.sport}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#0F1113] px-2 py-0.5 rounded text-gray-400 border border-gray-800">{ev.phase}</span>
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", 
                    ev.status === 'live' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                    ev.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    'bg-[#0F1113] text-gray-400 border-gray-800'
                  )}>
                    {ev.status}
                  </span>
                </div>
                <div className="font-black text-sm uppercase">
                  <span className={colorText(ev.teamA)}>{getTeamName(ev.teamA)}</span> 
                  <span className="mx-2 text-gray-500 italic font-medium text-xs">VS</span> 
                  <span className={colorText(ev.teamB)}>{getTeamName(ev.teamB)}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest flex flex-wrap gap-2">
                  <span>Odds: {ev.oddsA.toFixed(2)} / {ev.oddsDraw.toFixed(2)} / {ev.oddsB.toFixed(2)}</span>
                  <span className="text-gray-600">|</span>
                  <span>Scores: {ev.scoreA} - {ev.scoreB}</span>
                  <span className="text-gray-600">|</span>
                  <span>{format(ev.startTime, 'MMM d, h:mm a')}</span>
                  {ev.winner && (
                    <>
                      <span className="text-gray-600">|</span>
                      <span className="text-green-400">Winner: {ev.winner === 'draw' ? 'Draw' : getTeamName(ev.winner as HouseColor)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => startEditing(ev)} className="flex items-center gap-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>

                {ev.status === 'scheduled' && (
                  <button onClick={() => updateStatus(ev.id, 'live')} className="flex items-center gap-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                    <Play className="w-3 h-3" /> Go Live
                  </button>
                )}

                {ev.status === 'live' && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={ev.scoreA} 
                      onChange={e => updateScore(ev.id, parseInt(e.target.value) || 0, ev.scoreB)}
                      className="w-12 bg-[#0F1113] border border-gray-700 rounded px-2 py-1 text-center font-bold text-xs focus:border-red-500 focus:outline-none"
                    />
                    <span className="text-gray-600">-</span>
                    <input 
                      type="number" 
                      value={ev.scoreB} 
                      onChange={e => updateScore(ev.id, ev.scoreA, parseInt(e.target.value) || 0)}
                      className="w-12 bg-[#0F1113] border border-gray-700 rounded px-2 py-1 text-center font-bold text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>
                )}

                {(ev.status === 'live' || ev.status === 'scheduled') && (
                  <div className="flex gap-2">
                    <button onClick={() => resolveEvent(ev, 'teamA')} className="bg-[#0F1113] border border-gray-700 hover:border-red-500 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest text-gray-300">Win {getTeamName(ev.teamA)}</button>
                    <button onClick={() => resolveEvent(ev, 'draw')} className="bg-[#0F1113] border border-gray-700 hover:border-red-500 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest text-gray-300">Draw</button>
                    <button onClick={() => resolveEvent(ev, 'teamB')} className="bg-[#0F1113] border border-gray-700 hover:border-red-500 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest text-gray-300">Win {getTeamName(ev.teamB)}</button>
                  </div>
                )}

                <button onClick={() => deleteEvent(ev.id)} className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 hover:border-red-500/40 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
          {events.length === 0 && <div className="text-gray-500 text-center py-4 text-xs font-bold uppercase tracking-widest">No events registered.</div>}
        </div>
      </div>
    </div>
  );
};
