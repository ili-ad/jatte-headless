import { render } from '@testing-library/react';
import React from 'react';
import { Anchor } from '../src/components/Message/renderText/componentRenderers/Anchor';

describe('Anchor', () => {
  test('renders without crashing', () => {
    render(<Anchor href='http://example.com'>Link</Anchor>);
  });
});
