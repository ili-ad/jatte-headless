/* composer/attachments.ts */
import { MiniStore } from '../MiniStore';
export const buildAttachmentManager = () => ({
  state: new MiniStore({ attachments:[] as any[] }),
  availableUploadSlots: 10,
  addFiles :(_:File[])=>{},
  removeAttachment:(_:string)=>{},
  replaceAttachment:(_o:any,_n:any)=>{},
});
