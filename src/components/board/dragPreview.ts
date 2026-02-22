import type { Card, GameState, Location } from '../../types/game';

export type DragPreview = {
  cards: Card[];
  pileKind: Location['pileKind'];
};

export function getDragPreview(state: GameState, active: Location | null): DragPreview | null {
  if (!active) {
    return null;
  }

  if (active.pileKind === 'tableau') {
    if (active.pileIndex === undefined || active.cardIndex === undefined) {
      return null;
    }

    const pile = state.tableau[active.pileIndex];
    if (!pile) {
      return null;
    }

    const cards = pile.cards.slice(active.cardIndex);
    if (cards.length === 0) {
      return null;
    }

    return {
      pileKind: active.pileKind,
      cards
    };
  }

  if (active.pileKind === 'waste') {
    const topCard = state.waste.cards[state.waste.cards.length - 1];
    if (!topCard) {
      return null;
    }

    return {
      pileKind: active.pileKind,
      cards: [topCard]
    };
  }

  return null;
}
