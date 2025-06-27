import { render } from '@testing-library/react';
import { EditMessageForm } from '../src/components/MessageInput/EditMessageForm';

test('renders without crashing', () => {
  render(<EditMessageForm />);
});
