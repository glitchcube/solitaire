import { describe, expect, it } from 'vitest';
import { applyMove, drawFromStock, isWinState, recycleWasteToStock } from '../../src/game/engine';
import {
  isValidTableauToTableauMove,
  isValidToFoundationMove,
  isValidWasteMoves
} from '../../src/game/rules';
import type { Card, GameState, Rank, Suit } from '../../src/types/game';

function card(suit: Suit, rank: Rank, faceUp = true): Card {
  return {
    id: `${suit}-${rank}-${faceUp ? 'up' : 'down'}`,
    suit,
    rank,
    faceUp
  };
}

function emptyState(): GameState {
  return {
    tableau: Array.from({ length: 7 }, () => ({ kind: 'tableau' as const, cards: [] })),
    foundations: Array.from({ length: 4 }, () => ({ kind: 'foundation' as const, cards: [] })),
    stock: { kind: 'stock', cards: [] },
    waste: { kind: 'waste', cards: [] },
    moveCount: 0,
    status: 'in_progress'
  };
}

describe('rules/tableau-to-tableau', () => {
  it('allows moving a valid face-up stack onto alternating color and descending rank', () => {
    const state = emptyState();
    state.tableau[0].cards = [card('spades', 8), card('hearts', 7), card('clubs', 6)];
    state.tableau[1].cards = [card('clubs', 8)];

    expect(isValidTableauToTableauMove(state, 0, 1, 1)).toBe(true);
  });

  it('rejects moving when source card is face-down', () => {
    const state = emptyState();
    state.tableau[0].cards = [card('spades', 8, false)];

    expect(isValidTableauToTableauMove(state, 0, 0, 1)).toBe(false);
  });

  it('enforces king-only move to empty tableau', () => {
    const state = emptyState();
    state.tableau[0].cards = [card('hearts', 12)];

    expect(isValidTableauToTableauMove(state, 0, 0, 1)).toBe(false);

    state.tableau[0].cards = [card('hearts', 13)];
    expect(isValidTableauToTableauMove(state, 0, 0, 1)).toBe(true);
  });
});

describe('rules/foundation and waste moves', () => {
  it('validates tableau to foundation (ace start then same suit ascending)', () => {
    const state = emptyState();
    state.tableau[0].cards = [card('hearts', 1)];

    expect(
      isValidToFoundationMove(state, { pileKind: 'tableau', pileIndex: 0, cardIndex: 0 }, 0)
    ).toBe(true);

    state.foundations[0].cards = [card('hearts', 1)];
    state.tableau[0].cards = [card('hearts', 2)];

    expect(
      isValidToFoundationMove(state, { pileKind: 'tableau', pileIndex: 0, cardIndex: 0 }, 0)
    ).toBe(true);

    state.tableau[0].cards = [card('clubs', 2)];
    expect(
      isValidToFoundationMove(state, { pileKind: 'tableau', pileIndex: 0, cardIndex: 0 }, 0)
    ).toBe(false);
  });

  it('validates waste to tableau and waste to foundation', () => {
    const state = emptyState();
    state.waste.cards = [card('clubs', 7)];
    state.tableau[3].cards = [card('hearts', 8)];

    expect(isValidWasteMoves(state, { pileKind: 'tableau', pileIndex: 3 })).toBe(true);

    state.foundations[1].cards = [card('clubs', 6)];
    expect(isValidWasteMoves(state, { pileKind: 'foundation', pileIndex: 1 })).toBe(true);
  });
});

describe('engine/applyMove', () => {
  it('moves tableau stack and auto-flips newly exposed card', () => {
    const state = emptyState();
    state.tableau[0].cards = [card('diamonds', 9, false), card('clubs', 8)];
    state.tableau[1].cards = [card('hearts', 9)];

    const next = applyMove(state, {
      from: { pileKind: 'tableau', pileIndex: 0, cardIndex: 1 },
      to: { pileKind: 'tableau', pileIndex: 1 }
    });

    expect(next).not.toBe(state);
    expect(next.tableau[0].cards).toHaveLength(1);
    expect(next.tableau[0].cards[0].faceUp).toBe(true);
    expect(next.tableau[1].cards.map((c) => c.rank)).toEqual([9, 8]);
    expect(next.moveCount).toBe(1);
  });

  it('returns original state when move is invalid', () => {
    const state = emptyState();
    state.tableau[0].cards = [card('hearts', 7)];
    state.tableau[1].cards = [card('diamonds', 8)];

    const next = applyMove(state, {
      from: { pileKind: 'tableau', pileIndex: 0, cardIndex: 0 },
      to: { pileKind: 'tableau', pileIndex: 1 }
    });

    expect(next).toBe(state);
    expect(state.moveCount).toBe(0);
  });

  it('moves tableau top card to foundation when valid', () => {
    const state = emptyState();
    state.tableau[2].cards = [card('spades', 1)];

    const next = applyMove(state, {
      from: { pileKind: 'tableau', pileIndex: 2, cardIndex: 0 },
      to: { pileKind: 'foundation', pileIndex: 0 }
    });

    expect(next.foundations[0].cards.map((c) => c.rank)).toEqual([1]);
    expect(next.tableau[2].cards).toHaveLength(0);
  });

  it('moves waste top card to tableau when valid', () => {
    const state = emptyState();
    state.waste.cards = [card('spades', 7)];
    state.tableau[4].cards = [card('hearts', 8)];

    const next = applyMove(state, {
      from: { pileKind: 'waste' },
      to: { pileKind: 'tableau', pileIndex: 4 }
    });

    expect(next.waste.cards).toHaveLength(0);
    expect(next.tableau[4].cards.map((c) => c.rank)).toEqual([8, 7]);
  });
});

describe('engine/stock and win state', () => {
  it('draws from stock to waste face-up', () => {
    const state = emptyState();
    state.stock.cards = [card('clubs', 3, false)];

    const next = drawFromStock(state);

    expect(next.stock.cards).toHaveLength(0);
    expect(next.waste.cards).toHaveLength(1);
    expect(next.waste.cards[0].faceUp).toBe(true);
    expect(next.waste.cards[0].rank).toBe(3);
  });

  it('recycles waste into stock when stock is empty', () => {
    const state = emptyState();
    state.waste.cards = [card('clubs', 4), card('diamonds', 5), card('hearts', 6)];

    const next = recycleWasteToStock(state);

    expect(next.waste.cards).toHaveLength(0);
    expect(next.stock.cards.map((c) => c.rank)).toEqual([6, 5, 4]);
    expect(next.stock.cards.every((c) => !c.faceUp)).toBe(true);
  });

  it('detects win state only when all foundations are complete', () => {
    const incomplete = emptyState();
    expect(isWinState(incomplete)).toBe(false);

    const complete = emptyState();
    complete.foundations = Array.from({ length: 4 }, (_, i) => ({
      kind: 'foundation' as const,
      cards: Array.from({ length: 13 }, (_, index) =>
        card(['clubs', 'diamonds', 'hearts', 'spades'][i] as Suit, (index + 1) as Rank)
      )
    }));

    expect(isWinState(complete)).toBe(true);
  });
});
