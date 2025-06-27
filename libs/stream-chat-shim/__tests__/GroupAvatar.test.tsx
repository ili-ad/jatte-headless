import React from 'react';
import { render } from '@testing-library/react';
import { GroupAvatar } from '../src/components/Avatar/GroupAvatar';

test('renders without crashing', () => {
  render(
    <GroupAvatar groupChannelDisplayInfo={[]} />
  );
});
