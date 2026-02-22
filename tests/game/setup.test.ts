import { describe, expect, it } from 'vitest';
import { createDeck, dealInitialBoard, shuffleDeck } from '../../src/game/setup';

function extractStateCards(state: ReturnType<typeof dealInitialBoard>) {
  return [
    ...state.tableau.flatMap((pile) => pile.cards),
    ...state.foundations.flatMap((pile) => pile.cards),
    ...state.stock.cards,
    ...state.waste.cards
  ];
}

describe('setup/deck', () => {
  it('creates a standard 52-card deck with unique ids', () => {
    const deck = createDeck();
    const ids = deck.map((card) => card.id);

    expect(deck).toHaveLength(52);
    expect(new Set(ids).size).toBe(52);
  });

  it('shuffles without mutating the original deck', () => {
    const deck = createDeck();
    const originalIds = deck.map((card) => card.id);
    const shuffled = shuffleDeck(deck, () => 0);

    expect(deck.map((card) => card.id)).toEqual(originalIds);
    expect(shuffled).toHaveLength(deck.length);
    expect(new Set(shuffled.map((card) => card.id))).toEqual(new Set(originalIds));
    expect(shuffled.map((card) => card.id)).not.toEqual(originalIds);
  });
});

describe('setup/deal', () => {
  it('deals 7 tableau piles with sizes 1..7', () => {
    const state = dealInitialBoard(createDeck());

    expect(state.tableau).toHaveLength(7);
    expect(state.tableau.map((pile) => pile.cards.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('sets only the top tableau card face-up', () => {
    const state = dealInitialBoard(createDeck());

    for (const pile of state.tableau) {
      pile.cards.forEach((card, index) => {
        const isTop = index === pile.cards.length - 1;
        expect(card.faceUp).toBe(isTop);
      });
    }
  });

  it('places remaining cards in stock face-down', () => {
    const state = dealInitialBoard(createDeck());

    expect(state.stock.cards).toHaveLength(24);
    expect(state.stock.cards.every((card) => !card.faceUp)).toBe(true);
  });

  it('initializes empty foundations and waste with in-progress status', () => {
    const state = dealInitialBoard(createDeck());

    expect(state.foundations).toHaveLength(4);
    expect(state.foundations.every((pile) => pile.cards.length === 0)).toBe(true);
    expect(state.waste.cards).toHaveLength(0);
    expect(state.moveCount).toBe(0);
    expect(state.status).toBe('in_progress');
  });

  it('preserves all 52 cards across the full game state', () => {
    const state = dealInitialBoard(createDeck());
    const cards = extractStateCards(state);

    expect(cards).toHaveLength(52);
    expect(new Set(cards.map((card) => card.id)).size).toBe(52);
  });
});
