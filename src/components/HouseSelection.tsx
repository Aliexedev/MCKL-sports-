import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HouseColor } from '../types';
import { cn, getTeamName, getTeamLogo } from '../lib/utils';

export const HouseSelection: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleSelect = async (color: HouseColor) => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        houseColor: color,
        updatedAt: Date.now(),
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed to select house');
      setLoading(false);
    }
  };

  const houses: { color: HouseColor, bg: string, text: string }[] = [
    { color: 'red', bg: 'bg-[#1A1D21] hover:bg-red-500/10 border-gray-800 hover:border-red-500/50', text: 'text-red-500' },
    { color: 'blue', bg: 'bg-[#1A1D21] hover:bg-blue-500/10 border-gray-800 hover:border-blue-500/50', text: 'text-blue-500' },
    { color: 'green', bg: 'bg-[#1A1D21] hover:bg-green-500/10 border-gray-800 hover:border-green-500/50', text: 'text-green-500' },
    { color: 'yellow', bg: 'bg-[#1A1D21] hover:bg-yellow-500/10 border-gray-800 hover:border-yellow-500/50', text: 'text-yellow-500' },
  ];

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <h1 className="text-2xl font-black uppercase tracking-widest mb-2">Team Selection</h1>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-8">Assign your allegiance for the Carnival</p>
      
      <div className="grid grid-cols-2 gap-4">
        {houses.map(h => (
          <button
            key={h.color}
            disabled={loading}
            onClick={() => handleSelect(h.color)}
            className={cn(
              "p-8 rounded border transition-all flex flex-col items-center justify-center gap-4",
              h.bg,
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            <img src={getTeamLogo(h.color)} alt={getTeamName(h.color)} className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
            <span className={cn("text-sm font-black uppercase tracking-widest", h.text)}>{getTeamName(h.color)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
