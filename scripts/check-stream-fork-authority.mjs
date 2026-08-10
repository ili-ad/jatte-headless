#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const EXPECTED_PIN = '62aa736965da360e2b2cb070e58a976e5d944d7a';
const EXPECTED_SRC = 'f13cbdd600e4e18bb63ea8aaeb735cdbbc0892d3';
const EXPECTED_URL = 'https://github.com/ili-ad/iliad-stream-chat-react.git';
const BASELINE = 'c9802c782a3e47bd44873884260c13213b6ee380';
const JATTE_SOURCE = '08130d52bd18e865009c3df4be5e1e2828641224';

function run(command, args, cwd = process.cwd()) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const stage = run('git', ['ls-files', '--stage', 'libs/stream-chat-shim']);
assert(stage === `160000 ${EXPECTED_PIN} 0\tlibs/stream-chat-shim`, 'unexpected Stream fork gitlink');

const modules = readFileSync('.gitmodules', 'utf8');
assert(modules.includes('[submodule "libs/stream-chat-shim"]'), 'Stream fork submodule entry missing');
assert(modules.includes(`url = ${EXPECTED_URL}`), 'Stream fork URL mismatch');
assert(!modules.includes('libs/stream-ui'), 'retired libs/stream-ui remains in .gitmodules');

const frontendPackage = JSON.parse(readFileSync('frontend/package.json', 'utf8'));
assert(!frontendPackage.dependencies?.['@iliad/stream-ui'], 'retired @iliad/stream-ui dependency remains');
const tsconfig = readFileSync('frontend/tsconfig.json', 'utf8');
assert(!tsconfig.includes('@iliad/stream-ui'), 'retired @iliad/stream-ui TypeScript path remains');
assert(!existsSync('frontend/types/stream-ui-shim.d.ts'), 'retired stream-ui ambient declaration remains');

const submodule = 'libs/stream-chat-shim';
assert(run('git', ['rev-parse', 'HEAD'], submodule) === EXPECTED_PIN, 'initialized submodule pin mismatch');
assert(run('git', ['rev-parse', 'HEAD:src'], submodule) === EXPECTED_SRC, 'Stream source tree mismatch');
const packageJson = JSON.parse(readFileSync(`${submodule}/package.json`, 'utf8'));
assert(packageJson.name === '@iliad/stream-chat-shim', 'host-facing package identity changed');

const provenance = JSON.parse(readFileSync(`${submodule}/ILIAD_PROVENANCE.json`, 'utf8'));
assert(provenance.upstream_baseline_tag === 'v13.1.0', 'provenance baseline tag mismatch');
assert(provenance.upstream_baseline_commit === BASELINE, 'provenance baseline commit mismatch');
assert(provenance.source_jatte_commit === JATTE_SOURCE, 'provenance Jatte source mismatch');

console.log('Stream fork authority: PASS');
