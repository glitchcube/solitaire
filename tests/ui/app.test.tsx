import { render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Solitaire' })).toBeInTheDocument();
  });
});
