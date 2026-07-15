import React from 'react';
import { SportEvent } from '../types';
import { format } from 'date-fns';
import { cn, getTeamName, getTeamLogo } from '../lib/utils';
import { Trophy } from 'lucide-react';

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

interface EventCardProps {
  ev: SportEvent;
  selectedEvent: string | null;
  setSelectedEvent: (id: string | null) => void;
  prediction: string;
  setPrediction: (p: string) => void;
  betAmount: string;
  setBetAmount: (a: string) => void;
  handleBet: (ev: SportEvent) => void;
  betting: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ ev, selectedEvent, setSelectedEvent, prediction, setPrediction, betAmount, setBetAmount, handleBet, betting }) => {
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
           <img src={getTeamLogo(ev.teamA)} alt={getTeamName(ev.teamA)} className="w-10 h-10 mb-2 mx-auto object-contain" referrerPolicy="no-referrer" />
           <span className="text-xs font-bold uppercase">{getTeamName(ev.teamA)}</span>
        </div>
        <div className="flex flex-col items-center">
           <span className="text-2xl font-black italic text-gray-600">VS</span>
        </div>
        <div className="text-center">
           <img src={getTeamLogo(ev.teamB)} alt={getTeamName(ev.teamB)} className="w-10 h-10 mb-2 mx-auto object-contain" referrerPolicy="no-referrer" />
           <span className="text-xs font-bold uppercase">{getTeamName(ev.teamB)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-auto">
        <div className="p-2 bg-[#252A30] rounded border border-gray-700 text-center">
          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{getTeamName(ev.teamA)} Win</p>
          <p className="font-bold text-yellow-500">{ev.oddsA.toFixed(2)}</p>
        </div>
        <div className="p-2 bg-[#252A30] rounded border border-gray-700 text-center">
          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Draw</p>
          <p className="font-bold text-yellow-500">{ev.oddsDraw.toFixed(2)}</p>
        </div>
        <div className="p-2 bg-[#252A30] rounded border border-gray-700 text-center">
          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{getTeamName(ev.teamB)} Win</p>
          <p className="font-bold text-yellow-500">{ev.oddsB.toFixed(2)}</p>
        </div>
      </div>

      {!isCompleted && (
        selectedEvent === ev.id ? (
          <div className="mt-4 p-4 rounded border border-red-500/30 bg-[#252A30]/50">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => setPrediction(ev.teamA)} className={cn("p-2 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors", prediction === ev.teamA ? colorBg(ev.teamA) : "border-gray-700 text-gray-400 hover:border-red-500 hover:text-white")}>{getTeamName(ev.teamA)}</button>
              <button onClick={() => setPrediction('draw')} className={cn("p-2 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors", prediction === 'draw' ? "bg-gray-700 border-gray-500 text-white" : "border-gray-700 text-gray-400 hover:border-red-500 hover:text-white")}>Draw</button>
              <button onClick={() => setPrediction(ev.teamB)} className={cn("p-2 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors", prediction === ev.teamB ? colorBg(ev.teamB) : "border-gray-700 text-gray-400 hover:border-red-500 hover:text-white")}>{getTeamName(ev.teamB)}</button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] font-bold">RM</span>
                <input type="text" inputMode="numeric" pattern="[0-9]*" value={betAmount} onChange={e => setBetAmount(e.target.value)} className="w-full bg-[#1A1D21] border border-gray-700 rounded py-3 sm:py-4 pl-10 pr-3 text-right font-bold text-lg focus:outline-none focus:border-red-500 text-white" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleBet(ev)} disabled={betting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] px-4 py-3 rounded uppercase tracking-widest disabled:opacity-50 transition-colors">
                  Confirm Bet
                </button>
                <button onClick={() => setSelectedEvent(null)} className="text-gray-500 hover:text-gray-300 px-4 py-3 text-[10px] uppercase font-bold tracking-widest border border-gray-700 rounded transition-colors hover:border-gray-500">Cancel</button>
              </div>
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
