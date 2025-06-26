import React, { forwardRef } from 'react';

/** Minimal interface for a text composer controller. */
export interface TextComposerController {
  state: { text: string };
  setText?: (text: string) => void;
}

export type TextareaComposerProps = {
  /** Controller managing the textarea state. */
  textComposer?: TextComposerController;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Placeholder implementation of Stream's `TextareaComposer` component.
 */
export const TextareaComposer = forwardRef<HTMLTextAreaElement, TextareaComposerProps>(
  ({ textComposer, onChange, value, ...rest }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      textComposer?.setText?.(e.target.value);
      onChange?.(e);
    };

    return (
      <textarea
        data-testid="textarea-composer"
        ref={ref}
        value={textComposer?.state.text ?? (value as any)}
        onChange={handleChange}
        {...rest}
      />
    );
  },
);

export default TextareaComposer;
