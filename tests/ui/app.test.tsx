import { fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Solitaire' })).toBeInTheDocument();
  });

  it('toggles hotkeys panel from help button and keyboard shortcut', () => {
    render(<App />);

    expect(screen.queryByTestId('hotkeys-panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle hotkeys help' }));
    expect(screen.getByTestId('hotkeys-panel')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '?' });
    expect(screen.queryByTestId('hotkeys-panel')).not.toBeInTheDocument();
  });
});
