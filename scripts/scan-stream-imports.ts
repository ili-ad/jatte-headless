#!/usr/bin/env ts-node
import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';

const UI_SRC = path.resolve(__dirname, '../libs/stream-ui/src');
const GEN_DEV_DTS = path.resolve(__dirname, '../libs/chat-shim/generated.d.ts');

const files = fg.sync(['**/*.{ts,tsx}'], { cwd: UI_SRC, absolute: true });
const imported = new Set<string>();

for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  const rx  = /import\s+type?\s*{([^}]+)}\s*from\s*['"]stream-chat['"]/g;
  for (const [, names] of txt.matchAll(rx)) {
    names.split(',').forEach(n => imported.add(n.trim()));
  }
}

// runtime helpers referenced without import (e.g. isImageAttachment)
const rxCall = /\bis([A-Z]\w+?)Attachment\s*\(/g;
for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  for (const [, fn] of txt.matchAll(rxCall))
    imported.add(fn as string);
}

// Everything we already declared lives in generated.d.ts
const declared = new Set<string>(
  fs.existsSync(GEN_DEV_DTS)
    ? (fs.readFileSync(GEN_DEV_DTS,'utf8')
        .match(/^(?:export (?:type|function|const) )(\w+)/gm) ?? [])
        .map(l => l.split(' ')[2])
    : []
);

const missing = [...imported].filter(n => !declared.has(n));
if (!missing.length) { console.log('✅  nothing new'); process.exit(0); }

// --- append new stubs ----------------------------------------------------
const lines = missing.map(name =>
  name.match(/^is\w+Attachment$/)
    ? `export function ${name}(..._args: any[]): boolean;`
    : `export type ${name} = any;`
).join('\n') + '\n';

fs.appendFileSync(GEN_DEV_DTS, lines);
console.log(`➕  added ${missing.length} new symbols`);
