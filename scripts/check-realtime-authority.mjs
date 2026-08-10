#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PIN = '1aa5e3301a34fb3a56dd4103f600c415b4998656';
const URL = 'https://github.com/ili-ad/iliad-realtime.git';

function run(command, args, cwd = process.cwd(), allowFailure = false) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (!allowFailure && result.status !== 0) throw new Error(result.stderr.trim());
  return { status: result.status, output: result.stdout.trim() };
}
function assert(condition, message) { if (!condition) throw new Error(message); }

assert(
  run('git', ['ls-files', '--stage', 'libs/iliad-realtime']).output ===
    `160000 ${PIN} 0\tlibs/iliad-realtime`,
  'unexpected iliad-realtime gitlink',
);
const modules = readFileSync('.gitmodules', 'utf8');
assert(modules.includes('[submodule "libs/iliad-realtime"]'), 'realtime submodule missing');
assert(modules.includes(`url = ${URL}`), 'realtime submodule URL mismatch');
assert(run('git', ['rev-parse', 'HEAD'], 'libs/iliad-realtime').output === PIN, 'realtime checkout mismatch');
const packageJson = JSON.parse(readFileSync('libs/iliad-realtime/package.json', 'utf8'));
assert(packageJson.name === '@iliad/realtime', 'realtime package identity mismatch');
assert(!existsSync('packages/realtime') && !existsSync('frontend/src/realtime'), 'copied realtime authority found');
const channelSource = readFileSync('frontend/src/lib/stream-adapter/Channel.ts', 'utf8');
const adapterSource = readFileSync('frontend/src/lib/stream-adapter/jatteRealtime.ts', 'utf8');
assert(channelSource.includes('createRealtimeClient'), 'Channel does not delegate to @iliad/realtime');
assert(!channelSource.includes('new WebSocket('), 'Channel still owns raw WebSocket lifecycle');
assert(!/setTimeout|reconnectAttempts?|socketGeneration|generationCounter/.test(adapterSource),
  'Jatte adapter contains duplicate generic lifecycle machinery');
const streamImport = run(
  'git',
  ['grep', '-n', '-F', '@iliad/realtime', '--', 'src', 'package.json'],
  'libs/stream-chat-shim',
  true,
);
assert(streamImport.status === 1 && streamImport.output === '', 'Stream fork depends on @iliad/realtime');
console.log('Realtime authority: PASS');
