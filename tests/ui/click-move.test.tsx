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

    fireEvent.click(screen.getByText('7H'));
    fireEvent.click(screen.getByTestId('pile-tableau-1'));

    expect(screen.getByText('Tableau 1 (0)')).toBeInTheDocument();
    expect(screen.getByText('Tableau 2 (2)')).toBeInTheDocument();
    expect(screen.getByText('Selected: none')).toBeInTheDocument();
  });

  it('shows invalid feedback when selected move is illegal', () => {
    const state = baseState();
    state.tableau[0].cards = [makeCard('hearts', 7, true)];
    state.tableau[1].cards = [makeCard('diamonds', 8, true)];

    render(<App initialState={state} />);

    fireEvent.click(screen.getByText('7H'));
    fireEvent.click(screen.getByTestId('pile-tableau-1'));

    expect(screen.getByRole('status')).toHaveTextContent('Invalid move.');
    expect(screen.getByText('Tableau 1 (1)')).toBeInTheDocument();
    expect(screen.getByText('Tableau 2 (1)')).toBeInTheDocument();
  });

  it('draws from stock when stock pile is clicked', () => {
    const state = baseState();
    state.stock.cards = [makeCard('spades', 4, false)];

    render(<App initialState={state} />);

    fireEvent.click(screen.getByTestId('pile-stock'));

    expect(screen.getByText('Stock (0)')).toBeInTheDocument();
    expect(screen.getByText('Waste (1)')).toBeInTheDocument();
    expect(screen.getByText('4S')).toBeInTheDocument();
  });
});
