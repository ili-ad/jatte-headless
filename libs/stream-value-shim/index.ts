// libs/stream-value-shim/index.ts
export const isFileAttachment              = (_a: any): _a is any => false;
export const isImageAttachment             = (_a: any): _a is any => false;
export const isVideoAttachment             = (_a: any): _a is any => false;
export const isVoiceRecordingAttachment    = (_a: any): _a is any => false;
export const isScrapedContent              = (_a: any): _a is any => false;
export const isLocalAttachment             = (_a: any): _a is any => false;

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
