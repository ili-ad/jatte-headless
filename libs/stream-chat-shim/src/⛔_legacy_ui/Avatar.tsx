import React from 'react';
import type { UserResponse } from 'chat-shim';

export type AvatarProps = {
  /** Custom root element class that will be merged with the default class */
  className?: string;
  /** Image URL or default is an image of the first initial of the name if there is one */
  image?: string | null;
  /** Name of the image, used for title tag fallback */
  name?: string;
  /** click event handler attached to the component root element */
  onClick?: (event: React.BaseSyntheticEvent) => void;
  /** mouseOver event handler attached to the component root element */
  onMouseOver?: (event: React.BaseSyntheticEvent) => void;
  /** The entire user object for the chat user displayed in the component */
  user?: UserResponse;
};

/**
 * Minimal avatar component used as placeholder for Stream UI.
 */
export const Avatar = ({
  className,
  image,
  name,
  onClick,
  onMouseOver,
}: AvatarProps) => {
  const initial = name?.charAt(0) ?? '';
  return (
    <div className={className} data-testid="avatar" onClick={onClick} onMouseOver={onMouseOver}>
      {image ? <img src={image} alt={initial} /> : initial}
    </div>
  );
};
