// libs/stream-value-shim/index.ts
export const isAudioAttachment             = (_a: any): _a is any => false;
export const isFileAttachment              = (_a: any): _a is any => false;
export const isImageAttachment             = (_a: any): _a is any => false;
export const isVideoAttachment             = (_a: any): _a is any => false;
export { isVoiceRecordingAttachment } from '../chat-shim';
export const isScrapedContent              = (_a: any): _a is any => false;
export const isLocalAttachment             = (_a: any): _a is any => false;
//export const isLocalUploadAttachment       = (_a: any): _a is any => false;

export const isLocalAudioAttachment          = () => false;
export const isLocalFileAttachment           = () => false;
export const isLocalImageAttachment          = () => false;
export const isLocalVideoAttachment          = () => false;
export const isLocalVoiceRecordingAttachment = () => false;
export const isLocalUploadAttachment         = () => false;

/* text-composer helpers */
export const formatMessage                    = (..._a: any[]) => '';
export const getTokenizedSuggestionDisplayName = () => '';
export const getTriggerCharWithToken          = () => '';
export const insertItemWithTrigger            = (s:any)=>s;
export const replaceWordWithEntity            = (s:any)=>s;

/* tiny empty classes */
export class LinkPreviewsManager {}
export class MessageComposer      {}
export class FixedSizeQueueCache  {}
export class SearchController     {}
