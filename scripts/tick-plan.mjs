// Ticks finished steps in PLAN.md: `node scripts/tick-plan.mjs 1 2 3`
import fs from 'node:fs';
let s = fs.readFileSync('PLAN.md', 'utf8');
for (const n of process.argv.slice(2)) s = s.replace(new RegExp(`- \[ \] ${n}\. `), `- [x] ${n}. `);
fs.writeFileSync('PLAN.md', s);
console.log((s.match(/\[x\]/g) ?? []).length, 'steps ticked');
