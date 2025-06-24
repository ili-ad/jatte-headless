import React from 'react';

export type PollCreationDialogProps = {
  close: () => void;
};

/** Placeholder PollCreationDialog component. */
export const PollCreationDialog = ({ close }: PollCreationDialogProps) => (
  <div data-testid="poll-creation-dialog">
    <button onClick={close}>close</button>
    PollCreationDialog
  </div>
);

export default PollCreationDialog;
