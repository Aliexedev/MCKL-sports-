import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Trophy, Medal } from 'lucide-react';
import { cn } from '../lib/utils';

export const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('balance', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => d.data() as UserProfile));
      setLoading(false);
    });
    return unsub;
  }, []);

  const colorText = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-500';
      case 'blue': return 'text-blue-500';
      case 'green': return 'text-green-500';
      case 'yellow': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center py-6">
        <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
        <h1 className="text-3xl font-black tracking-tighter uppercase">Live Leaderboard</h1>
        <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Top players by total winnings</p>
      </div>

      <div className="bg-[#1A1D21] rounded-xl border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 bg-[#252A30] font-bold text-[10px] uppercase tracking-widest text-gray-400">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-6">Player</div>
          <div className="col-span-4 text-right">Balance</div>
        </div>
        
        <div className="divide-y divide-gray-800">
          {users.map((u, i) => (
            <div key={u.uid} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#252A30] transition-colors">
              <div className="col-span-2 flex justify-center">
                {i === 0 ? <Medal className="w-5 h-5 text-yellow-500" /> :
                 i === 1 ? <Medal className="w-5 h-5 text-gray-400" /> :
                 i === 2 ? <Medal className="w-5 h-5 text-orange-600" /> :
                 <span className="text-gray-600 font-black text-xs">{String(i + 1).padStart(2, '0')}</span>}
              </div>
              <div className="col-span-6 flex items-center gap-3">
                <div className={cn("w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white", 
                  u.houseColor === 'red' ? 'bg-red-600' :
                  u.houseColor === 'blue' ? 'bg-blue-600' :
                  u.houseColor === 'green' ? 'bg-green-600' :
                  u.houseColor === 'yellow' ? 'bg-yellow-500 text-black' : 'bg-gray-700'
                )}>
                  {u.houseColor ? u.houseColor.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-white">{u.displayName || 'Unknown'}</span>
                  <span className={cn("text-[10px] font-bold uppercase", colorText(u.houseColor))}>{u.houseColor || 'No House'}</span>
                </div>
              </div>
              <div className="col-span-4 text-right font-bold text-green-400 text-sm">
                RM {u.balance.toLocaleString()}
              </div>
            </div>
          ))}
          {users.length === 0 && !loading && (
             <div className="p-8 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">No players found.</div>
          )}
        </div>
      </div>
    </div>
  );
};
