import React from 'react';

export interface NameFieldProps {
  /** Current composer state */
  state?: any;
  /** Change handler for the poll name input */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

/** Placeholder implementation for Stream's NameField component. */
export const NameField = (_props: NameFieldProps) => {
  return <div data-testid="name-field-placeholder">NameField</div>;
};

export default NameField;
