import React, { ComponentProps } from 'react';

export type UploadButtonProps = {
  onFileChange: (files: File[]) => void;
  resetOnChange?: boolean;
} & Omit<ComponentProps<'input'>, 'type' | 'onChange'>;

/**
 * Placeholder implementation of Stream Chat's UploadButton component.
 * It forwards selected files via the onFileChange callback.
 */
export const UploadButton = ({
  onFileChange,
  resetOnChange = true,
  ...rest
}: UploadButtonProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    onFileChange(files);
    if (resetOnChange) {
      event.target.value = '';
    }
  };

  return <input type="file" onChange={handleChange} {...rest} />;
};

export default UploadButton;
