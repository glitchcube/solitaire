import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Board } from '../../src/components/board/Board';
import type { Card, GameState, Rank, Suit } from '../../src/types/game';

function makeCard(suit: Suit, rank: Rank, faceUp = true): Card {
  return {
    id: `${suit}-${rank}-${faceUp ? 'up' : 'down'}`,
    suit,
    rank,
    faceUp
  };
}

function makeState(): GameState {
  return {
    tableau: [
      { kind: 'tableau', cards: [makeCard('spades', 5, false), makeCard('hearts', 13, true)] },
      { kind: 'tableau', cards: [makeCard('clubs', 2, true)] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] }
    ],
    foundations: [
      { kind: 'foundation', cards: [makeCard('hearts', 1, true)] },
      { kind: 'foundation', cards: [] },
      { kind: 'foundation', cards: [] },
      { kind: 'foundation', cards: [] }
    ],
    stock: { kind: 'stock', cards: [makeCard('diamonds', 7, false)] },
    waste: { kind: 'waste', cards: [makeCard('clubs', 6, true)] },
    moveCount: 0,
    status: 'in_progress'
  };
}

describe('Board', () => {
  it('renders stock, waste, foundations, and all tableau piles', () => {
    render(<Board state={makeState()} />);

    expect(screen.getByTestId('pile-stock')).toBeInTheDocument();
    expect(screen.getByTestId('pile-waste')).toBeInTheDocument();

    for (let index = 0; index < 4; index += 1) {
      expect(screen.getByTestId(`pile-foundation-${index}`)).toBeInTheDocument();
    }

    for (let index = 0; index < 7; index += 1) {
      expect(screen.getByTestId(`pile-tableau-${index}`)).toBeInTheDocument();
    }
  });

  it('renders face-down and face-up card states correctly', () => {
    render(<Board state={makeState()} />);

    expect(screen.getAllByText('Hidden')).toHaveLength(2);
    expect(screen.getByText('KH')).toBeInTheDocument();
    expect(screen.queryByText('AC')).not.toBeInTheDocument();
    expect(screen.getByText('AH')).toBeInTheDocument();
  });

  it('shows pile counts in section headers', () => {
    render(<Board state={makeState()} />);

    expect(screen.getByText('Stock (1)')).toBeInTheDocument();
    expect(screen.getByText('Waste (1)')).toBeInTheDocument();
    expect(screen.getByText('Foundation 1 (1)')).toBeInTheDocument();
    expect(screen.getByText('Tableau 1 (2)')).toBeInTheDocument();
    expect(screen.getByText('Tableau 3 (0)')).toBeInTheDocument();
  });
});
