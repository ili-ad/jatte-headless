/* composer/index.ts */
import { MiniStore } from '../MiniStore';
import { buildTextComposer } from './text';
import { buildAttachmentManager } from './attachments';
import { buildPollComposer } from './polls';

export const buildMessageComposer = (channelRef:any) => {
  const roomKey = `draft:${channelRef.cid}`;
  const textComposer = buildTextComposer();
  return {
    contextType:'message', tag:'root',
    attachmentManager: buildAttachmentManager(),
    pollComposer     : buildPollComposer(),
    customDataManager: { state:new MiniStore({custom:[] as any[]}), reset(){this.state._set({custom:[]})}},
    state            : new MiniStore({ quotedMessage:undefined as any }),
    linkPreviewsManager:{ state:new MiniStore({previews:[] as any[]}), add:()=>{},remove:()=>{},clear:()=>{} },

    textComposer,
    /* simple proxies */
    get compositionIsEmpty(){ return textComposer.state.getSnapshot().text.trim()==='' },
    async compose(){ /* keep previous compose() implementation here */ },
    async sendMessage(_loc:any,msg:any){ await channelRef.sendMessage({ text: msg.text }); },

    submit(){ textComposer.clear(); /* will be wired in Channel.ts*/ },

    /* Stream-UI housekeeping */
    registerSubscriptions(){ return ()=>{}; },
    createDraft(){ localStorage.setItem(roomKey,textComposer.state.getSnapshot().text); },
    discardDraft(){ localStorage.removeItem(roomKey); },

    configState:new MiniStore({ attachments:{acceptedFiles:[],maxNumberOfFilesPerMessage:10},
                                text:{enabled:true}, multipleUploads:true, isUploadEnabled:true }),
    getInputValue(){ return textComposer.state.getSnapshot().text; },
    setInputValue(v:string){ textComposer.state._set({text:v}); },
    reset(){ textComposer.clear(); },
  };
};
