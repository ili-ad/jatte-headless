import React from 'react';
import { render } from '@testing-library/react';
import { ReactionsListModal } from '../src/components/Reactions/ReactionsListModal';

describe('ReactionsListModal', () => {
  it('renders without crashing', () => {
    render(
      <ReactionsListModal open={true} reactions={[]} selectedReactionType="like" />,
    );
  });
});
