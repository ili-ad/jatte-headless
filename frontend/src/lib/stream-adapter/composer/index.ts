/* composer/index.ts */
import { MiniStore } from '../MiniStore';
import { buildTextComposer } from './text';
import { buildAttachmentManager } from './attachments';
import { buildPollComposer } from './polls';
import { API } from '../constants';

export const buildMessageComposer = (channelRef:any) => {
  const roomKey = `draft:${channelRef.cid}`;
  const textComposer = buildTextComposer();
  return {
    contextType:'message', tag:'root',
    attachmentManager: buildAttachmentManager(),
    pollComposer     : buildPollComposer(),
    customDataManager: {
      state:new MiniStore({ customData:{} as Record<string, unknown> }),
      set(k:string,v:unknown){
        const cur=this.state.getSnapshot().customData;
        this.state._set({ customData:{...cur,[k]:v} });
      },
      clear(){ this.state._set({ customData:{} }); },
    },
    state            : new MiniStore({ quotedMessage:undefined as any }),
    linkPreviewsManager:(() => {
      const store = new MiniStore({ previews:[] as any[] });
      return {
        state: store,
        async add(url:string){
          const res = await fetch(API.LINK_PREVIEW, {
            method:'POST',
            headers:{
              'Content-Type':'application/json',
              Authorization:`Bearer ${channelRef.client['jwt']}`,
            },
            body: JSON.stringify({ url }),
          });
          if(res.ok){
            const preview = await res.json();
            const list = store.getSnapshot().previews;
            store._set({ previews:[...list, preview] });
          }
        },
        remove(url:string){
          const list = store.getSnapshot().previews;
          store._set({ previews:list.filter((p:any)=>p.url!==url) });
        },
        clear(){ store._set({ previews:[] }); },
      };
    })(),

    textComposer,
    /* simple proxies */
    get compositionIsEmpty(){ return textComposer.state.getSnapshot().text.trim()==='' },
    async compose(){
      if(this.compositionIsEmpty) return undefined;

      const text=textComposer.state.getSnapshot().text.trim();
      const now=new Date().toISOString();
      const localMessage={
        id:`local-${Date.now()}`,
        text,
        user_id:channelRef.client.user.id!,
        created_at:now,
      };
      return { localMessage, message: localMessage, sendOptions:{} };
    },
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
