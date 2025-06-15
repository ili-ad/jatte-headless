/* composer/text.ts */
import { MiniStore } from '../MiniStore';
export const buildTextComposer = () => {
  const store = new MiniStore({
    text:'', selection:{start:0,end:0},
    suggestions:{ searchSource:{ state:new MiniStore({ isLoadingItems:false }) } },
  });
  return {
    state: store,
    setText:(t:string)=>store._set({ text:t }),
    setSelection:(s:{start:number;end:number})=>store._set({ selection:s }),
    clear:()=>store._set({ text:'' }),
    /* key handlers wired later by Channel.ts */
  };
};
