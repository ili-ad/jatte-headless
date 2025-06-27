import React from 'react';
import { render } from '@testing-library/react';
import { CustomMessageActionsList } from '../src/components/MessageActions/CustomMessageActionsList';

test('renders without crashing', () => {
  render(<CustomMessageActionsList message={{} as any} customMessageActions={{}} />);
});
