// Ticks finished steps in PLAN.md: `node scripts/tick-plan.mjs 1 2 3`
import fs from 'node:fs';

let plan = fs.readFileSync('PLAN.md', 'utf8');
for (const step of process.argv.slice(2)) {
  plan = plan.replace(`- [ ] ${step}. `, `- [x] ${step}. `);
}
fs.writeFileSync('PLAN.md', plan);
console.log(plan.split('- [x] ').length - 1, 'steps ticked');
