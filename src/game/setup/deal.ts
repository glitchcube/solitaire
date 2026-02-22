import type { Card, GameState, Pile } from '../../types/game';

function createTableauPile(cards: Card[]): Pile {
  return {
    kind: 'tableau',
    cards
  };
}

export function dealInitialBoard(deck: ReadonlyArray<Card>): GameState {
  const workingDeck = deck.map((card) => ({ ...card, faceUp: false }));

  const tableau: Pile[] = [];
  let nextIndex = 0;

  for (let columnSize = 1; columnSize <= 7; columnSize += 1) {
    const cardsForColumn = workingDeck.slice(nextIndex, nextIndex + columnSize);
    nextIndex += columnSize;

    const columnCards = cardsForColumn.map((card, index) => ({
      ...card,
      faceUp: index === cardsForColumn.length - 1
    }));

    tableau.push(createTableauPile(columnCards));
  }

  const stockCards = workingDeck.slice(nextIndex).map((card) => ({ ...card, faceUp: false }));

  return {
    tableau,
    foundations: Array.from({ length: 4 }, () => ({ kind: 'foundation' as const, cards: [] })),
    stock: {
      kind: 'stock',
      cards: stockCards
    },
    waste: {
      kind: 'waste',
      cards: []
    },
    moveCount: 0,
    status: 'in_progress'
  };
}
