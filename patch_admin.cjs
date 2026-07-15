const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const resolveEventRegex = /const resolveEvent = async \(event: SportEvent, winner: 'teamA' \| 'teamB' \| 'draw'\) => \{[\s\S]*?catch \(err\) \{\n\s*console.error\(err\);\n\s*alert\('Failed to resolve event'\);\n\s*\}\n\s*\};/;

const newResolveEvent = `const resolveEvent = async (event: SportEvent, winner: 'teamA' | 'teamB' | 'draw') => {
    if (!window.confirm(\`Are you sure? Winner is \${winner}?\`)) return;
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

  const deleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete event');
    }
  };`;

content = content.replace(resolveEventRegex, newResolveEvent);

const buttonsRegex = /\{ev\.status === 'live' && \(\s*<div className="flex gap-2">\s*<button onClick=\{\(\) => resolveEvent\(ev, 'teamA'\)\} className="bg-\[#0F1113\] border border-gray-700 hover:border-red-500 px-3 py-1\.5 rounded text-\[9px\] font-bold uppercase tracking-widest text-gray-300">Win \{getTeamName\(ev\.teamA\)\}<\/button>\s*<button onClick=\{\(\) => resolveEvent\(ev, 'draw'\)\} className="bg-\[#0F1113\] border border-gray-700 hover:border-red-500 px-3 py-1\.5 rounded text-\[9px\] font-bold uppercase tracking-widest text-gray-300">Draw<\/button>\s*<button onClick=\{\(\) => resolveEvent\(ev, 'teamB'\)\} className="bg-\[#0F1113\] border border-gray-700 hover:border-red-500 px-3 py-1\.5 rounded text-\[9px\] font-bold uppercase tracking-widest text-gray-300">Win \{getTeamName\(ev\.teamB\)\}<\/button>\s*<\/div>\s*\)\}/;

const newButtons = `{(ev.status === 'live' || ev.status === 'scheduled') && (
                    <div className="flex gap-2">
                      <button onClick={() => resolveEvent(ev, 'teamA')} className="bg-[#0F1113] border border-gray-700 hover:border-red-500 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest text-gray-300">Win {getTeamName(ev.teamA)}</button>
                      <button onClick={() => resolveEvent(ev, 'draw')} className="bg-[#0F1113] border border-gray-700 hover:border-red-500 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest text-gray-300">Draw</button>
                      <button onClick={() => resolveEvent(ev, 'teamB')} className="bg-[#0F1113] border border-gray-700 hover:border-red-500 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest text-gray-300">Win {getTeamName(ev.teamB)}</button>
                      <button onClick={() => deleteEvent(ev.id)} className="bg-red-900/50 text-red-500 border border-red-900 hover:border-red-500 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest ml-4">Delete</button>
                    </div>
                  )}`;

content = content.replace(buttonsRegex, newButtons);

const importRegex = /import \{ Trash2 \} from 'lucide-react';/;
if (!importRegex.test(content)) {
    content = content.replace(/import \{ Shield, Plus, Edit2, Play, CheckCircle \} from 'lucide-react';/, "import { Shield, Plus, Edit2, Play, CheckCircle, Trash2 } from 'lucide-react';");
}

fs.writeFileSync('src/pages/Admin.tsx', content);
