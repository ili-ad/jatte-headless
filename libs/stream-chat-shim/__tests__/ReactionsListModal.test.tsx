import React from 'react';
import { render } from '@testing-library/react';
import { ReactionsListModal } from '../src/ReactionsListModal';

describe('ReactionsListModal', () => {
  it('renders placeholder', () => {
    const { getByTestId } = render(
      <ReactionsListModal
        open={true}
        reactions={[]}
        selectedReactionType="like"
      />,
    );
    expect(getByTestId('reactions-list-modal-placeholder')).toBeTruthy();
  });
});
