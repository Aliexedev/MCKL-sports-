import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { HouseSelection } from '../components/HouseSelection';
import { SportEvent, Bet } from '../types';
import { format } from 'date-fns';
import { Trophy, Activity, AlertCircle } from 'lucide-react';
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
const colorBg = (color: string) => {
  switch (color) {
    case 'red': return 'bg-red-600 border-red-500 text-white';
    case 'blue': return 'bg-blue-600 border-blue-500 text-white';
    case 'green': return 'bg-green-600 border-green-500 text-white';
    case 'yellow': return 'bg-yellow-500 border-yellow-400 text-black';
    default: return 'bg-[#252A30] border-gray-700 text-gray-300';
  }
};


export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Betting state
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('10');
  const [betting, setBetting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startTime', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => d.data() as SportEvent));
      setLoading(false);
    });
    return unsub;
  }, []);

  if (!profile?.houseColor) {
    return <HouseSelection />;
  }

  const handleBet = async (ev: SportEvent) => {
    if (!user || !profile) return;
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) return alert('Invalid amount');
    if (amount > profile.balance) return alert('Insufficient balance');
    if (!prediction) return alert('Select a prediction');

    setBetting(true);
    try {
      // 1. Create bet
      const betRef = doc(collection(db, 'bets'));
      const odds = prediction === 'draw' ? ev.oddsDraw : prediction === ev.teamA ? ev.oddsA : ev.oddsB;
      const b: Bet = {
        id: betRef.id,
        userId: user.uid,
        eventId: ev.id,
        prediction,
        amount,
        potentialPayout: amount * odds,
        status: 'pending',
        createdAt: Date.now()
      };
      await setDoc(betRef, b);

      // 2. Deduct balance
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: increment(-amount),
        updatedAt: Date.now()
      });

      alert('Bet placed successfully!');
      setSelectedEvent(null);
    } catch (err) {
      console.error(err);
      alert('Failed to place bet');
    } finally {
      setBetting(false);
    }
  };

  const liveEvents = events.filter(e => e.status === 'live');
  const scheduledEvents = events.filter(e => e.status === 'scheduled');
  const completedEvents = events.filter(e => e.status === 'completed');

  const EventCard: React.FC<{ ev: SportEvent }> = ({ ev }) => {
    const isLive = ev.status === 'live';
    const isCompleted = ev.status === 'completed';
    return (
      <div className={cn("bg-[#1A1D21] rounded-xl border p-4 flex flex-col transition-all", isLive ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-gray-800")}>
        <div className="flex justify-between items-center mb-4">
          <div>
            {isLive ? (
              <span className="text-[10px] font-bold text-red-500 flex items-center gap-2 uppercase tracking-widest mb-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE NOW
              </span>
            ) : isCompleted ? (
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">COMPLETED</span>
            ) : (
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">{format(ev.startTime, 'MMM d, h:mm a')}</span>
            )}
            <span className="text-[10px] text-gray-500 tracking-wider uppercase font-medium">{ev.sport} • {ev.phase}</span>
          </div>
          {(isLive || isCompleted) && (
            <div className="flex items-center gap-3 px-2">
              <span className={cn("text-xl font-black uppercase", colorText(ev.teamA))}>{ev.scoreA}</span>
              <span className="text-gray-600">-</span>
              <span className={cn("text-xl font-black uppercase", colorText(ev.teamB))}>{ev.scoreB}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-4 mb-6">
          <div className="text-center">
             <div className={cn("w-10 h-10 rounded-full mb-2 mx-auto flex items-center justify-center font-bold text-lg text-white", colorBg(ev.teamA).replace('bg-', 'bg-').split(' ')[0].replace('/20', ''))}>{ev.teamA.charAt(0)}</div>
             <span className="text-xs font-bold uppercase">{ev.teamA}</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-2xl font-black italic text-gray-600">VS</span>
          </div>
          <div className="text-center">
             <div className={cn("w-10 h-10 rounded-full mb-2 mx-auto flex items-center justify-center font-bold text-lg text-white", colorBg(ev.teamB).replace('bg-', 'bg-').split(' ')[0].replace('/20', ''))}>{ev.teamB.charAt(0)}</div>
             <span className="text-xs font-bold uppercase">{ev.teamB}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="p-2 bg-[#252A30] rounded border border-gray-700 text-center">
            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{ev.teamA} Win</p>
            <p className="font-bold text-yellow-500">{ev.oddsA.toFixed(2)}</p>
          </div>
          <div className="p-2 bg-[#252A30] rounded border border-gray-700 text-center">
            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Draw</p>
            <p className="font-bold text-yellow-500">{ev.oddsDraw.toFixed(2)}</p>
          </div>
          <div className="p-2 bg-[#252A30] rounded border border-gray-700 text-center">
            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{ev.teamB} Win</p>
            <p className="font-bold text-yellow-500">{ev.oddsB.toFixed(2)}</p>
          </div>
        </div>

        {!isCompleted && (
          selectedEvent === ev.id ? (
            <div className="mt-4 p-4 rounded border border-red-500/30 bg-[#252A30]/50">
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={() => setPrediction(ev.teamA)} className={cn("p-2 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors", prediction === ev.teamA ? colorBg(ev.teamA) : "border-gray-700 text-gray-400 hover:border-red-500 hover:text-white")}>{ev.teamA}</button>
                <button onClick={() => setPrediction('draw')} className={cn("p-2 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors", prediction === 'draw' ? "bg-gray-700 border-gray-500 text-white" : "border-gray-700 text-gray-400 hover:border-red-500 hover:text-white")}>Draw</button>
                <button onClick={() => setPrediction(ev.teamB)} className={cn("p-2 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors", prediction === ev.teamB ? colorBg(ev.teamB) : "border-gray-700 text-gray-400 hover:border-red-500 hover:text-white")}>{ev.teamB}</button>
              </div>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] font-bold">RM</span>
                  <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} className="w-full bg-[#1A1D21] border border-gray-700 rounded py-2 pl-10 pr-3 text-right font-bold text-xs focus:outline-none focus:border-red-500 text-white" />
                </div>
                <button onClick={() => handleBet(ev)} disabled={betting} className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] px-6 py-2 rounded uppercase tracking-widest disabled:opacity-50 transition-colors">
                  Confirm Bet
                </button>
                <button onClick={() => setSelectedEvent(null)} className="text-gray-500 hover:text-gray-300 px-2 text-[10px] uppercase font-bold tracking-widest">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setSelectedEvent(ev.id); setPrediction(''); }} className="mt-4 w-full bg-[#252A30] hover:bg-gray-800 border border-gray-700 hover:border-red-500 py-2 rounded font-bold text-[10px] uppercase tracking-widest transition-colors text-white">
              Select Odds & Bet
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Live Events */}
      {liveEvents.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Active Events
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {liveEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Upcoming Schedule</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scheduledEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
          {scheduledEvents.length === 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 col-span-2 p-4 bg-[#1A1D21] rounded-xl border border-gray-800 text-center">No upcoming events.</p>}
        </div>
      </section>
      
      {/* Knockout Bracket / Tournament Map */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Tournament Map</h2>
        <div className="bg-[#1A1D21] rounded-xl p-6 border border-gray-800 overflow-x-auto">
          <div className="min-w-[600px] flex justify-between gap-6 text-center">
            {['Quarter Final', 'Semi Final', 'Final'].map(phaseName => {
              const phaseEvents = events.filter(e => e.phase.toLowerCase().includes(phaseName.toLowerCase()));
              return (
                <div key={phaseName} className="flex-1 space-y-4">
                  <h3 className="font-bold text-gray-500 mb-4 uppercase tracking-[0.2em] text-[10px]">{phaseName}</h3>
                  {phaseEvents.map(ev => (
                    <div key={ev.id} className="bg-[#0F1113] border border-gray-800 p-3 rounded text-xs text-left relative shadow-sm">
                       <div className="flex justify-between items-center mb-1">
                         <span className={cn("font-bold uppercase text-[10px] tracking-wider", colorText(ev.teamA))}>{ev.teamA}</span>
                         <span className="font-bold text-gray-300">{ev.scoreA}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className={cn("font-bold uppercase text-[10px] tracking-wider", colorText(ev.teamB))}>{ev.teamB}</span>
                         <span className="font-bold text-gray-300">{ev.scoreB}</span>
                       </div>
                       {ev.status === 'completed' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none"><Trophy className="w-8 h-8 text-white" /></div>}
                    </div>
                  ))}
                  {phaseEvents.length === 0 && (
                    <div className="bg-[#0F1113]/50 border border-gray-800 border-dashed p-3 rounded text-gray-600 text-[10px] font-bold uppercase tracking-widest text-center">
                      TBD
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
