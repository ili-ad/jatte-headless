import { render } from '@testing-library/react';
import { SendButton } from '../src/components/MessageInput/SendButton';

test('renders without crashing', () => {
  render(<SendButton sendMessage={() => {}} />);
});
