import React from 'react';
import { render } from '@testing-library/react';
import { ReactionSelectorWithButton } from '../src/components/Reactions/ReactionSelectorWithButton';

test('renders without crashing', () => {
  const Icon = () => <span />;
  render(<ReactionSelectorWithButton ReactionIcon={Icon} />);
});
