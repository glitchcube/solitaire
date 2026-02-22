import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';
import type { Card, GameState, Rank, Suit } from '../../src/types/game';

function makeCard(suit: Suit, rank: Rank, faceUp = true): Card {
  return {
    id: `${suit}-${rank}-${faceUp ? 'up' : 'down'}`,
    suit,
    rank,
    faceUp
  };
}

function baseState(): GameState {
  return {
    tableau: Array.from({ length: 7 }, () => ({ kind: 'tableau' as const, cards: [] })),
    foundations: Array.from({ length: 4 }, () => ({ kind: 'foundation' as const, cards: [] })),
    stock: { kind: 'stock', cards: [] },
    waste: { kind: 'waste', cards: [] },
    moveCount: 0,
    status: 'in_progress'
  };
}

describe('App click-to-move interactions', () => {
  it('moves a valid tableau card to another tableau by click selection', () => {
    const state = baseState();
    state.tableau[0].cards = [makeCard('hearts', 7, true)];
    state.tableau[1].cards = [makeCard('clubs', 8, true)];

    render(<App initialState={state} />);

    fireEvent.click(screen.getByText('7♥'));
    fireEvent.click(screen.getByTestId('pile-tableau-1'));

    expect(screen.getByText('Tableau 1 (0)')).toBeInTheDocument();
    expect(screen.getByText('Tableau 2 (2)')).toBeInTheDocument();
    expect(screen.getByText('Selected: none')).toBeInTheDocument();
    expect(screen.getByText('Moves: 1')).toBeInTheDocument();
  });

  it('moves selected card to destination pile with Enter key', () => {
    const state = baseState();
    state.tableau[0].cards = [makeCard('hearts', 7, true)];
    state.tableau[1].cards = [makeCard('clubs', 8, true)];

    render(<App initialState={state} />);

    fireEvent.click(screen.getByText('7♥'));
    fireEvent.keyDown(screen.getByTestId('pile-tableau-1'), { key: 'Enter' });

    expect(screen.getByText('Tableau 1 (0)')).toBeInTheDocument();
    expect(screen.getByText('Tableau 2 (2)')).toBeInTheDocument();
    expect(screen.getByText('Selected: none')).toBeInTheDocument();
    expect(screen.getByText('Moves: 1')).toBeInTheDocument();
  });

  it('moves selected card to destination pile with Space key', () => {
    const state = baseState();
    state.tableau[0].cards = [makeCard('hearts', 7, true)];
    state.tableau[1].cards = [makeCard('clubs', 8, true)];

    render(<App initialState={state} />);

    fireEvent.click(screen.getByText('7♥'));
    fireEvent.keyDown(screen.getByTestId('pile-tableau-1'), { key: ' ' });

    expect(screen.getByText('Tableau 1 (0)')).toBeInTheDocument();
    expect(screen.getByText('Tableau 2 (2)')).toBeInTheDocument();
    expect(screen.getByText('Selected: none')).toBeInTheDocument();
    expect(screen.getByText('Moves: 1')).toBeInTheDocument();
  });

  it('supports number hotkeys for selecting and moving between tableau columns', () => {
    const state = baseState();
    state.tableau[0].cards = [makeCard('hearts', 7, true)];
    state.tableau[1].cards = [makeCard('clubs', 8, true)];

    render(<App initialState={state} />);

    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByText('Selected: tableau-0@0')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '2' });

    expect(screen.getByText('Tableau 1 (0)')).toBeInTheDocument();
    expect(screen.getByText('Tableau 2 (2)')).toBeInTheDocument();
    expect(screen.getByText('Selected: none')).toBeInTheDocument();
    expect(screen.getByText('Moves: 1')).toBeInTheDocument();
  });

  it('supports Enter hotkey to auto-move selected tableau card to foundation when valid', () => {
    const state = baseState();
    state.tableau[0].cards = [makeCard('hearts', 1, true)];

    render(<App initialState={state} />);

    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.getByText('Tableau 1 (0)')).toBeInTheDocument();
    expect(screen.getByText('Foundation 1 (1)')).toBeInTheDocument();
    expect(screen.getByText('Selected: none')).toBeInTheDocument();
    expect(screen.getByText('Moves: 1')).toBeInTheDocument();
  });

  it('supports W hotkey to select waste and move to tableau via number hotkey', () => {
    const state = baseState();
    state.waste.cards = [makeCard('hearts', 7, true)];
    state.tableau[0].cards = [makeCard('clubs', 8, true)];

    render(<App initialState={state} />);

    fireEvent.keyDown(window, { key: 'w' });
    expect(screen.getByText('Selected: waste@0')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '1' });

    expect(screen.getByText('Waste (0)')).toBeInTheDocument();
    expect(screen.getByText('Tableau 1 (2)')).toBeInTheDocument();
    expect(screen.getByText('Selected: none')).toBeInTheDocument();
    expect(screen.getByText('Moves: 1')).toBeInTheDocument();
  });

  it('shows invalid feedback when selected move is illegal', () => {
    const state = baseState();
    state.tableau[0].cards = [makeCard('hearts', 7, true)];
    state.tableau[1].cards = [makeCard('diamonds', 8, true)];

    render(<App initialState={state} />);

    fireEvent.click(screen.getByText('7♥'));
    fireEvent.click(screen.getByTestId('pile-tableau-1'));

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid move.');
    expect(screen.getByText('Tableau 1 (1)')).toBeInTheDocument();
    expect(screen.getByText('Tableau 2 (1)')).toBeInTheDocument();
    expect(screen.getByText('Moves: 0')).toBeInTheDocument();
  });

  it('draws from stock when stock pile is clicked', () => {
    const state = baseState();
    state.stock.cards = [makeCard('spades', 4, false)];

    render(<App initialState={state} />);

    fireEvent.click(screen.getByTestId('pile-stock'));

    expect(screen.getByText('Stock (0)')).toBeInTheDocument();
    expect(screen.getByText('Waste (1)')).toBeInTheDocument();
    expect(screen.getByText('4♠')).toBeInTheDocument();
  });

  it('draws from stock with D hotkey', () => {
    const state = baseState();
    state.stock.cards = [makeCard('spades', 4, false)];

    render(<App initialState={state} />);

    fireEvent.keyDown(window, { key: 'd' });

    expect(screen.getByText('Stock (0)')).toBeInTheDocument();
    expect(screen.getByText('Waste (1)')).toBeInTheDocument();
    expect(screen.getByText('4♠')).toBeInTheDocument();
  });

  it('resets selection, feedback, and counters when starting a new game', () => {
    const state = baseState();
    state.tableau[0].cards = [makeCard('hearts', 7, true)];
    state.tableau[1].cards = [makeCard('diamonds', 8, true)];

    render(<App initialState={state} />);

    fireEvent.click(screen.getByText('7♥'));
    fireEvent.click(screen.getByTestId('pile-tableau-1'));
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid move.');
    expect(screen.getByText('Selected: tableau-0@0')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New Game' }));
    expect(screen.getByRole('dialog', { name: 'New game confirmation' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start New Game' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Selected: none')).toBeInTheDocument();
    expect(screen.getByText('Moves: 0')).toBeInTheDocument();
    expect(screen.getByText('Stock (24)')).toBeInTheDocument();
  });

  it('keeps current game when new game confirmation is cancelled', () => {
    const state = baseState();
    state.tableau[0].cards = [makeCard('hearts', 7, true)];
    state.tableau[1].cards = [makeCard('diamonds', 8, true)];

    render(<App initialState={state} />);

    fireEvent.click(screen.getByText('7♥'));
    fireEvent.click(screen.getByTestId('pile-tableau-1'));
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid move.');

    fireEvent.click(screen.getByRole('button', { name: 'New Game' }));
    expect(screen.getByRole('dialog', { name: 'New game confirmation' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid move.');
    expect(screen.getByText('Selected: tableau-0@0')).toBeInTheDocument();
    expect(screen.getByText('Stock (0)')).toBeInTheDocument();
  });
});
