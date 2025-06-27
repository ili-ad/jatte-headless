import { render } from '@testing-library/react';
import { LoadingChannel } from '../components/Channel/LoadingChannel';

test('renders without crashing', () => {
  render(<LoadingChannel />);
});
