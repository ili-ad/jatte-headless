/*───────────────────────────────────────────────────────────────────────────
  chat-shim / polyfills.ts
  One-stop “safe shim” so Stream-UI can boot without the full SDK.
  – no top-level await
  – no duplicate helpers
  – survives builds where Channel isn’t exported at all
───────────────────────────────────────────────────────────────────────────*/
import { MessageComposer as MC } from 'chat-shim';

/* ――― try to discover a Channel-like class if the shim exposes one ――― */
const RawChannel: any =
  // common names that appear in different Stream builds
  (require('chat-shim') as any).Channel ??
  (require('chat-shim') as any).BaseChannel ??
  (require('chat-shim') as any).StreamChannel ??
  null;

/* ---------- 1 · make every Channel instance carry the fields UI expects */
type SafeState = {
  latestMessages: unknown[];
  read: Record<string, { last_read_message_id?: string }>;
};

function ensureState(this: any) {
  this.state ??= {} as SafeState;
  const s: SafeState = this.state;
  s.latestMessages ??= [];
  s.read ??= {};
}

if (typeof RawChannel === 'function') {
  const proto: any = RawChannel.prototype;
  if (!proto.__statePatched) {
    proto.__statePatched = true;
    const origInit = proto.initialize ?? (() => {});
    proto.initialize = function (...args: any[]) {
      origInit.apply(this, args);
      ensureState.call(this);
    };
  }

  /* also patch any singleton that might already exist */
  try {
    ensureState.call(RawChannel);
  } catch {/* ignore */}
}

/* ─── chat-shim/polyfills.ts ────────────────────────────────────────── */
//import { MessageComposer as MC } from 'chat-shim';

/* …existing patches… */

declare module 'chat-shim' {
  interface MessageComposer {
    compose?: (opts?: unknown) => Promise<void>;
  }
}

const mcProto: any = MC?.prototype;
if (mcProto) {
  mcProto.registerSubscriptions ??= () => () => {};               // already there
  mcProto.createDraft ??= () => 'draft-' + Math.random().toString(36).slice(2);
  mcProto.toggleShowReplyInChannel ??= () => {};

  /* ▼ add this line */
  mcProto.compose ??= async () => { /* nothing to send in the shim */ };
}

/* nothing to export – side-effects only */


/* ---------- 3 · side-effects only – nothing to export ------------------ */
