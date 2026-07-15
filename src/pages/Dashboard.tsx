import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { HouseSelection } from '../components/HouseSelection';
import { SportEvent, Bet } from '../types';
import { format } from 'date-fns';
import { Trophy, Activity, AlertCircle } from 'lucide-react';
import { cn, getTeamName, getTeamLogo } from '../lib/utils';
import { EventCard } from '../components/EventCard';

const colorText = (color: string) => {
  switch (color) {
    case 'red': return 'text-red-500';
    case 'blue': return 'text-blue-500';
    case 'green': return 'text-green-500';
    case 'yellow': return 'text-yellow-500';
    default: return 'text-gray-400';
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
            {liveEvents.map(ev => <EventCard key={ev.id} ev={ev} selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} prediction={prediction} setPrediction={setPrediction} betAmount={betAmount} setBetAmount={setBetAmount} handleBet={handleBet} betting={betting} />)}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Upcoming Schedule</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scheduledEvents.map(ev => <EventCard key={ev.id} ev={ev} selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} prediction={prediction} setPrediction={setPrediction} betAmount={betAmount} setBetAmount={setBetAmount} handleBet={handleBet} betting={betting} />)}
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
                         <span className={cn("font-bold uppercase text-[10px] tracking-wider", colorText(ev.teamA))}>{getTeamName(ev.teamA)}</span>
                         <span className="font-bold text-gray-300">{ev.scoreA}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className={cn("font-bold uppercase text-[10px] tracking-wider", colorText(ev.teamB))}>{getTeamName(ev.teamB)}</span>
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
