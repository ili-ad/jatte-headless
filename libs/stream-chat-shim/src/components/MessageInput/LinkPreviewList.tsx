import clsx from 'clsx';
import React, { useState } from 'react';
import type {
  LinkPreview,
  LinkPreviewsManagerState,
  MessageComposerState,
} from 'chat-shim';
import { LinkPreviewsManager } from 'chat-shim';
import { useStateStore } from '../../store';
import { PopperTooltip } from '../Tooltip';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';
import { useMessageComposer } from './hooks';
import { CloseIcon, LinkIcon } from './icons';

const linkPreviewsManagerStateSelector = (state: LinkPreviewsManagerState) => ({
  linkPreviews: Array.from(state.previews.values()).filter(
    (preview) =>
      LinkPreviewsManager.previewIsLoaded(preview) ||
      LinkPreviewsManager.previewIsLoading(preview),
  ),
});

const messageComposerStateSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

// export const LinkPreviewList = () => {
//   const messageComposer = useMessageComposer();
//   const { linkPreviewsManager } = messageComposer;
//   const { quotedMessage } = useStateStore(
//     messageComposer.state,
//     messageComposerStateSelector,
//   );
//   const { linkPreviews } = useStateStore(
//     linkPreviewsManager.state,
//     linkPreviewsManagerStateSelector,
//   );

//   const showLinkPreviews = linkPreviews.length > 0 && !quotedMessage;

//   if (!showLinkPreviews) return null;

//   return (
//     <div className='str-chat__link-preview-list'>
//       {linkPreviews.map((linkPreview) => (
//         <LinkPreviewCard key={linkPreview.og_scrape_url} linkPreview={linkPreview} />
//       ))}
//     </div>
//   );
// };


export const LinkPreviewList = () => {
  const composer               = useMessageComposer();
  const { linkPreviewsManager } = composer;

  /* ---------- quotedMessage ---------- */
  let quotedMessage: MessageComposerState['quotedMessage'] | undefined;
  if (composer.state?.getLatestValue) {
    const snapshot = useStateStore(
      composer.state,
      messageComposerStateSelector,
    );
    quotedMessage = snapshot?.quotedMessage;
  }

  /* ---------- linkPreviews ---------- */
  let linkPreviews: LinkPreview[] = [];
  if (linkPreviewsManager?.state?.getLatestValue) {
    const snapshot = useStateStore(
      linkPreviewsManager.state,
      linkPreviewsManagerStateSelector,
    );
    linkPreviews = snapshot?.linkPreviews ?? [];
  }

  /* ---------- render ---------- */
  const show = linkPreviews.length > 0 && !quotedMessage;
  if (!show) return null;

  return (
    <div className='str-chat__link-preview-list'>
      {linkPreviews.map((lp) => (
        <LinkPreviewCard key={lp.og_scrape_url} linkPreview={lp} />
      ))}
    </div>
  );
};



type LinkPreviewProps = {
  linkPreview: LinkPreview;
};

export const LinkPreviewCard = ({ linkPreview }: LinkPreviewProps) => {
  const { linkPreviewsManager } = useMessageComposer();
  const { handleEnter, handleLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLDivElement>();
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);

  if (
    !LinkPreviewsManager.previewIsLoaded(linkPreview) &&
    !LinkPreviewsManager.previewIsLoading(linkPreview)
  )
    return null;

  return (
    <div
      className={clsx('str-chat__link-preview-card', {
        'str-chat__link-preview-card--loading':
          LinkPreviewsManager.previewIsLoading(linkPreview),
      })}
      data-testid='link-preview-card'
    >
      <PopperTooltip
        offset={[0, 5]}
        referenceElement={referenceElement}
        visible={tooltipVisible}
      >
        {linkPreview.og_scrape_url}
      </PopperTooltip>
      <div
        className='str-chat__link-preview-card__icon-container'
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        ref={setReferenceElement}
      >
        <LinkIcon />
      </div>
      <div className='str-chat__link-preview-card__content'>
        <div className='str-chat__link-preview-card__content-title'>
          {linkPreview.title}
        </div>
        <div className='str-chat__link-preview-card__content-description'>
          {linkPreview.text}
        </div>
      </div>
      <button
        className='str-chat__link-preview-card__dismiss-button'
        data-testid='link-preview-card-dismiss-btn'
        onClick={() => linkPreviewsManager.dismissPreview(linkPreview.og_scrape_url)}
        type='button'
      >
        <CloseIcon />
      </button>
    </div>
  );
};
