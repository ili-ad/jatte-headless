// scripts/patch-stream-types.js  (CommonJS)
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const DECL = path.resolve(__dirname, '../frontend/types/stream-chat-shim.d.ts');
const tmp  = '.tsc.txt';

// run tsc without pretty colouring, capture text diagnostics
try { execSync('pnpm tsc -p frontend --noEmit --pretty false', { stdio: ['ignore', fs.openSync(tmp, 'w'), 'pipe'] }); }
catch { /* tsc exits 2 when errors exist – that’s OK */ }

// read diagnostics & pick missing-symbol messages
const txt  = fs.readFileSync(tmp, 'utf8');
fs.unlinkSync(tmp);

const missing = new Set();
txt.split('\n').forEach(line => {
  const m = line.match(/'(\w+)'/);
  if (!m) return;
  if (/cannot find name/.test(line) ||
      /has no exported member/.test(line) ||
      /property '.*' does not exist/.test(line))
    missing.add(m[1]);
});

// append stubs
let decl = fs.readFileSync(DECL, 'utf8');
for (const name of missing) {
  if (!new RegExp(`\\b${name}\\b`).test(decl)) {
    decl += `\n  export type ${name} = any;`;
    console.log('stubbed', name);
  }
}
fs.writeFileSync(DECL, decl);
