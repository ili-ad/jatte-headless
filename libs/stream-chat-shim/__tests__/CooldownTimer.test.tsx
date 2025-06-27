import React from 'react';
import { render } from '@testing-library/react';
import { CooldownTimer } from '../src/components/MessageInput/CooldownTimer';

test('renders without crashing', () => {
  render(<CooldownTimer cooldownInterval={0} setCooldownRemaining={() => {}} />);
});
