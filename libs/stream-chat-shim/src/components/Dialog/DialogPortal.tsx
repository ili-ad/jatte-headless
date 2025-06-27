import type { PropsWithChildren } from 'react';
import React, { useCallback } from 'react';
// import { useDialogIsOpen, useOpenedDialogCount } from './hooks'; // TODO backend-wire-up
const useDialogIsOpen = (_id: string) => false as any; // temporary shim
const useOpenedDialogCount = () => 0 as any; // temporary shim
// import { Portal } from '../Portal/Portal'; // TODO backend-wire-up
const Portal = ({ children }: any) => <>{children}</>; // temporary shim
// import { useDialogManager } from '../../context'; // TODO backend-wire-up
const useDialogManager = () => ({ dialogManager: { id: '', closeAll: () => {} } } as any); // temporary shim

export const DialogPortalDestination = () => {
  const { dialogManager } = useDialogManager();
  const openedDialogCount = useOpenedDialogCount();

  return (
    <div
      className='str-chat__dialog-overlay'
      data-str-chat__portal-id={dialogManager.id}
      data-testid='str-chat__dialog-overlay'
      onClick={() => dialogManager.closeAll()}
      style={
        {
          '--str-chat__dialog-overlay-height': openedDialogCount > 0 ? '100%' : '0',
        } as React.CSSProperties
      }
    />
  );
};

type DialogPortalEntryProps = {
  dialogId: string;
};

export const DialogPortalEntry = ({
  children,
  dialogId,
}: PropsWithChildren<DialogPortalEntryProps>) => {
  const { dialogManager } = useDialogManager();
  const dialogIsOpen = useDialogIsOpen(dialogId);

  const getPortalDestination = useCallback(
    () => document.querySelector(`div[data-str-chat__portal-id="${dialogManager.id}"]`),
    [dialogManager.id],
  );

  return (
    <Portal getPortalDestination={getPortalDestination} isOpen={dialogIsOpen}>
      {children}
    </Portal>
  );
};
