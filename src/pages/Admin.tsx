import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, getDocs, writeBatch, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SportEvent, HouseColor, Sport, EventStatus, Bet } from '../types';
import { Shield, Plus, Edit2, Play, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

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

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startTime', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => d.data() as SportEvent));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ref = doc(collection(db, 'events'));
      const ev: SportEvent = {
        id: ref.id,
        sport,
        phase,
        teamA,
        teamB,
        scoreA: 0,
        scoreB: 0,
        oddsA: parseFloat(oddsA),
        oddsB: parseFloat(oddsB),
        oddsDraw: parseFloat(oddsDraw),
        status: 'scheduled',
        startTime: new Date(startTime).getTime()
      };
      await setDoc(ref, ev);
      alert('Event created!');
    } catch (err) {
      console.error(err);
      alert('Failed to create event');
    }
  };

  const updateStatus = async (eventId: string, status: EventStatus) => {
    await updateDoc(doc(db, 'events', eventId), { status });
  };

  const updateScore = async (eventId: string, scoreA: number, scoreB: number) => {
    await updateDoc(doc(db, 'events', eventId), { scoreA, scoreB });
  };

  const resolveEvent = async (event: SportEvent, winner: 'teamA' | 'teamB' | 'draw') => {
    if (!window.confirm(`Are you sure? Winner is ${winner}?`)) return;

    try {
      await updateDoc(doc(db, 'events', event.id), {
        status: 'completed',
        winner
      });

      const betsSnap = await getDocs(query(collection(db, 'bets')));
      const eventBets = betsSnap.docs.map(d => d.data() as Bet).filter(b => b.eventId === event.id && b.status === 'pending');

      const batch = writeBatch(db);
      
      for (const bet of eventBets) {
        let isWon = false;
        if (winner === 'draw' && bet.prediction === 'draw') isWon = true;
        if (winner === 'teamA' && bet.prediction === event.teamA) isWon = true;
        if (winner === 'teamB' && bet.prediction === event.teamB) isWon = true;

        const betRef = doc(db, 'bets', bet.id);
        batch.update(betRef, { status: isWon ? 'won' : 'lost' });

        if (isWon) {
          const userRef = doc(db, 'users', bet.userId);
          const payout = bet.amount * (
            bet.prediction === 'draw' ? event.oddsDraw : 
            bet.prediction === event.teamA ? event.oddsA : event.oddsB
          );
          batch.update(userRef, { balance: increment(payout) });
        }
      }
      
      await batch.commit();
      
    } catch (err) {
      console.error(err);
      alert('Failed to resolve event');
    }
  };

  const inputClass = "w-full bg-[#0F1113] border border-gray-700 rounded p-2 text-xs font-bold text-white focus:outline-none focus:border-red-500";
  const labelClass = "block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1";

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1D21] p-6 rounded-xl border border-gray-800">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
          <Shield className="w-4 h-4 text-red-500" />
          Event Manager
        </h2>
        <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="red">Red</option><option value="blue">Blue</option><option value="green">Green</option><option value="yellow">Yellow</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Team B (Color)</label>
            <select value={teamB} onChange={e=>setTeamB(e.target.value as HouseColor)} className={inputClass}>
              <option value="red">Red</option><option value="blue">Blue</option><option value="green">Green</option><option value="yellow">Yellow</option>
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
          <div className="md:col-span-2 mt-2">
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Event
            </button>
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
                    ev.status === 'live' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[#0F1113] text-gray-400 border-gray-800'
                  )}>
                    {ev.status}
                  </span>
                </div>
                <div className="font-black text-sm uppercase">
                  <span className={colorText(ev.teamA)}>{ev.teamA}</span> 
                  <span className="mx-2 text-gray-500 italic font-medium text-xs">VS</span> 
                  <span className={colorText(ev.teamB)}>{ev.teamB}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-widest">
                  {format(ev.startTime, 'MMM d, h:mm a')}
                </div>
              </div>

              {ev.status !== 'completed' && (
                <div className="flex flex-wrap items-center gap-3">
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
                  {ev.status === 'live' && (
                    <div className="flex gap-2">
                      <button onClick={() => resolveEvent(ev, 'teamA')} className="bg-[#0F1113] border border-gray-700 hover:border-red-500 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest text-gray-300">Win A</button>
                      <button onClick={() => resolveEvent(ev, 'draw')} className="bg-[#0F1113] border border-gray-700 hover:border-red-500 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest text-gray-300">Draw</button>
                      <button onClick={() => resolveEvent(ev, 'teamB')} className="bg-[#0F1113] border border-gray-700 hover:border-red-500 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest text-gray-300">Win B</button>
                    </div>
                  )}
                </div>
              )}
              {ev.status === 'completed' && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Completed: {ev.winner}</span>
                  <span className="font-bold bg-[#0F1113] px-2 py-0.5 rounded ml-2 text-gray-300 text-xs border border-gray-800">{ev.scoreA} - {ev.scoreB}</span>
                </div>
              )}
            </div>
          ))}
          {events.length === 0 && <div className="text-gray-500 text-center py-4 text-xs font-bold uppercase tracking-widest">No events registered.</div>}
        </div>
      </div>
    </div>
  );
};
