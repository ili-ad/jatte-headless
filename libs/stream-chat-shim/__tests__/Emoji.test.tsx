import React from 'react';
import { render } from '@testing-library/react';
import { Emoji } from '../src/components/Message/renderText/componentRenderers/Emoji';

test('renders without crashing', () => {
  render(<Emoji>😀</Emoji>);
});
