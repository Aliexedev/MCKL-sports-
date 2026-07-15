const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const regex = /<div className="text-\[10px\] text-gray-400 mt-1 font-bold uppercase tracking-widest flex gap-3"><span>Odds: \{ev.oddsA.toFixed\(2\)\} \/ \{ev.oddsDraw.toFixed\(2\)\} \/ \{ev.oddsB.toFixed\(2\)\}<\/span><span>\|<\/span><span>\s*\{format\(ev\.startTime, 'MMM d, h:mm a'\)\}\s*<\/div>/;

const replacement = `<div className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest flex flex-wrap gap-2"><span>Odds: {ev.oddsA.toFixed(2)} / {ev.oddsDraw.toFixed(2)} / {ev.oddsB.toFixed(2)}</span><span className="text-gray-600">|</span><span>{format(ev.startTime, 'MMM d, h:mm a')}</span></div>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/Admin.tsx', content);
