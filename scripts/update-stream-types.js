// scripts/update-stream-types.js   (pure JS)

import fg   from 'fast-glob';
import fs   from 'fs';
import path from 'path';

const UI_SRC = path.resolve('libs/stream-ui/src');
const DECL   = path.resolve('libs/chat-shim/index.d.ts');

const files    = fg.sync(['**/*.{ts,tsx}'], { cwd: UI_SRC, absolute: true });
const imported = new Set();   // ← no <string>
for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  const rx  = /import\s+{([^}]+)}\s+from\s+['"]stream-chat['"]/g;
  for (const [, names] of txt.matchAll(rx)) {
    names.split(',')
         .map(s => s.trim())
         .filter(Boolean)        // 🚫 skip empty strings
         .forEach(n => imported.add(n));    
  }
}

const declTxt  = fs.readFileSync(DECL, 'utf8');
const declared = new Set(
  declTxt.match(/export (?:interface|type) (\w+)/g)?.map(s => s.split(' ')[2]) ?? []
);

const missing = [...imported].filter(n => !declared.has(n));
if (!missing.length) {
  console.log('✅  No new stream-chat symbols missing.');
  process.exit(0);
}

console.log('➕  Adding:', missing.join(', '));
const stub = '\n' + missing.map(n => `  export type ${n} = any;`).join('\n') + '\n';
fs.appendFileSync(DECL, stub);
