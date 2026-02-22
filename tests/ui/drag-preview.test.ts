import { describe, expect, it } from 'vitest';
import { getDragPreview } from '../../src/components/board/dragPreview';
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
      {
        kind: 'tableau',
        cards: [makeCard('diamonds', 7), makeCard('clubs', 6), makeCard('hearts', 5)]
      },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] }
    ],
    foundations: [
      { kind: 'foundation', cards: [] },
      { kind: 'foundation', cards: [] },
      { kind: 'foundation', cards: [] },
      { kind: 'foundation', cards: [] }
    ],
    stock: { kind: 'stock', cards: [] },
    waste: { kind: 'waste', cards: [makeCard('spades', 8)] },
    moveCount: 0,
    status: 'in_progress'
  };
}

describe('getDragPreview', () => {
  it('returns the full face-up tableau slice from the dragged card', () => {
    const preview = getDragPreview(makeState(), {
      pileKind: 'tableau',
      pileIndex: 0,
      cardIndex: 0
    });

    expect(preview?.cards.map((card) => `${card.rank}${card.suit[0]}`)).toEqual(['7d', '6c', '5h']);
  });

  it('returns a single waste top card for waste drags', () => {
    const preview = getDragPreview(makeState(), {
      pileKind: 'waste',
      cardIndex: 0
    });

    expect(preview?.cards.map((card) => card.id)).toEqual(['spades-8-up']);
  });

  it('returns null for invalid or incomplete locations', () => {
    const state = makeState();

    expect(getDragPreview(state, null)).toBeNull();
    expect(getDragPreview(state, { pileKind: 'tableau', pileIndex: 0 })).toBeNull();
    expect(
      getDragPreview(state, { pileKind: 'foundation', pileIndex: 0, cardIndex: 0 })
    ).toBeNull();
  });
});
