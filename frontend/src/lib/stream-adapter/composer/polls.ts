/* composer/polls.ts */
import { MiniStore } from '../MiniStore';
import { API } from '../constants';

export const buildPollComposer = (client: { jwt: string | null }) => ({
  state: new MiniStore({ poll: undefined as any }),
  async create(question: string, options: string[] = []) {
    const res = await fetch(API.POLLS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(client.jwt ? { Authorization: `Bearer ${client['jwt']}` } : {}),
      },
      body: JSON.stringify({ question, options }),
    });
    if (res.ok) {
      const data = await res.json();
      this.state._set({ poll: data.poll });
    }
  },
  async remove() {
    const poll = this.state.getSnapshot().poll;
    if (!poll) return;
    await fetch(`${API.POLLS}${poll.id}/`, {
      method: 'DELETE',
      headers: client.jwt ? { Authorization: `Bearer ${client['jwt']}` } : {},
    }).catch(() => { /* ignore network errors */ });
    this.state._set({ poll: undefined });
  },
  reset() {
    this.state._set({ poll: undefined });
  },
});
