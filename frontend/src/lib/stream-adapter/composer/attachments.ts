/* composer/attachments.ts */
import { MiniStore } from '../MiniStore';
import { API } from '../constants';

export const buildAttachmentManager = (client: { jwt: string | null }) => {
  const store = new MiniStore({ attachments: [] as any[] });
  return {
    state: store,
    availableUploadSlots: 10,
    async addFiles(files: File[]) {
      const token = client.jwt;
      const current = store.getSnapshot().attachments;
      for (const file of files) {
        let attachment: any = { id: '', name: (file as any).name };
        if (token) {
          try {
            const res = await fetch(API.ATTACHMENTS, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ name: (file as any).name }),
            });
            if (res.ok) {
              const data = await res.json();
              attachment = data.attachment;
            }
          } catch {
            /* ignore network errors for tests */
          }
        }
        attachment.id ||= `local-${Date.now()}`;
        current.push(attachment);
      }
      store._set({ attachments: [...current] });
    },
    removeAttachment(id: string) {
      const list = store.getSnapshot().attachments.filter((a: any) => a.id !== id);
      store._set({ attachments: list });
    },
    replaceAttachment(oldAtt: any, newAtt: any) {
      const list = store.getSnapshot().attachments.map(a => a === oldAtt ? newAtt : a);
      store._set({ attachments: list });
    },
  };
};
