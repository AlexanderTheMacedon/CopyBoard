// A9: compare Run-01 harness results (baseline ac721fe vs. R01) scenario by scenario.
// Usage: node compare-a9.mjs <baseline.json> <r01.json> [out.json]
import fs from 'node:fs';

const [baseFile, r01File, outFile] = process.argv.slice(2);
const load = f => new Map(JSON.parse(fs.readFileSync(f, 'utf8')).results.map(r=>[r.id, r]));
const base = load(baseFile), r01 = load(r01File);
const ids = [...new Set([...base.keys(), ...r01.keys()])];
const rows = ids.map(id=>({id, baseline:base.get(id)?.status || 'MISSING', r01:r01.get(id)?.status || 'MISSING', action:(base.get(id) || r01.get(id)).action}));
const changed = rows.filter(r=>r.baseline !== r.r01);
const passRegressions = rows.filter(r=>r.baseline === 'PASS' && r.r01 !== 'PASS');
const count = key => rows.reduce((m,r)=>(m[r[key]] = (m[r[key]]||0)+1, m), {});
const summary = {total:rows.length, baseline:count('baseline'), r01:count('r01'), changed, passRegressions,
  status: passRegressions.length ? 'FAIL' : 'PASS'};
console.log(JSON.stringify({baseline:summary.baseline, r01:summary.r01}));
for(const r of changed) console.log(`${r.id}: ${r.baseline} → ${r.r01} | ${r.action}`);
console.log(`PASS→nicht-PASS: ${passRegressions.length ? passRegressions.map(r=>r.id).join(', ') : 'keine'} → A9 ${summary.status}`);
if(outFile) fs.writeFileSync(outFile, JSON.stringify({generatedAt:new Date().toISOString(), baselineFile:baseFile.split('/').pop(), r01File:r01File.split('/').pop(), ...summary, rows}, null, 2));
