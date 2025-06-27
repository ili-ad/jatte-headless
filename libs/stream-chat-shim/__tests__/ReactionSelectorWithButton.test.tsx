import { render } from '@testing-library/react';
import React from 'react';
import { ReactionSelectorWithButton } from '../src/components/Reactions/ReactionSelectorWithButton';
import { ReactionIcon } from '../src/components/Message/icons';

test('renders without crashing', () => {
  render(<ReactionSelectorWithButton ReactionIcon={ReactionIcon} />);
});
