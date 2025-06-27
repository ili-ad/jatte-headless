import React from 'react';
import { render } from '@testing-library/react';
import { ThreadHeader } from '../src/components/Thread/ThreadHeader';

test('renders without crashing', () => {
  render(
    <ThreadHeader
      closeThread={() => {}}
      thread={{} as any}
      overrideImage=''
      overrideTitle=''
    />
  );
});
