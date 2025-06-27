import React from 'react';
import { render } from '@testing-library/react';
import { SpriteImage } from '../src/components/Reactions/SpriteImage';

test('renders without crashing', () => {
  render(<SpriteImage columns={1} position={[0, 0]} rows={1} spriteUrl='' />);
});
