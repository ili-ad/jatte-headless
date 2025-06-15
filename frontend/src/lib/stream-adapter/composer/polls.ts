/* composer/polls.ts */
import { MiniStore } from '../MiniStore';
export const buildPollComposer = () => ({
  state: new MiniStore({ question:'', options:[] as any[] }),
  reset(){ this.state._set({ question:'', options:[] }); },
});
