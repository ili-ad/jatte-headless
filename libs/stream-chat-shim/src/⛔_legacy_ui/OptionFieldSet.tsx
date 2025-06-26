import React from 'react';

/**
 * Placeholder for the `OptionFieldSet` component from stream-chat-react.
 * This shim renders a basic fieldset element and does not implement
 * any of the original behaviour related to polls.
 */
export const OptionFieldSet: React.FC = () => {
  return (
    <fieldset data-testid="option-field-set">
      OptionFieldSet
    </fieldset>
  );
};

export default OptionFieldSet;
