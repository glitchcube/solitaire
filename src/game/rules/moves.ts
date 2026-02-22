import type { Card, GameState, Location } from '../../types/game';

function isRedSuit(suit: Card['suit']): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

function isAlternatingColor(a: Card, b: Card): boolean {
  return isRedSuit(a.suit) !== isRedSuit(b.suit);
}

function isDescendingByOne(upper: Card, lower: Card): boolean {
  return upper.rank === lower.rank + 1;
}

function isValidTableauStack(cards: Card[]): boolean {
  if (cards.length === 0) {
    return false;
  }

  if (!cards.every((card) => card.faceUp)) {
    return false;
  }

  for (let i = 0; i < cards.length - 1; i += 1) {
    if (!isAlternatingColor(cards[i], cards[i + 1])) {
      return false;
    }

    if (!isDescendingByOne(cards[i], cards[i + 1])) {
      return false;
    }
  }

  return true;
}

export function isValidTableauToTableauMove(
  state: GameState,
  fromPileIndex: number,
  cardIndex: number,
  toPileIndex: number
): boolean {
  if (fromPileIndex === toPileIndex) {
    return false;
  }

  const sourcePile = state.tableau[fromPileIndex];
  const destinationPile = state.tableau[toPileIndex];

  if (!sourcePile || !destinationPile) {
    return false;
  }

  const movingCards = sourcePile.cards.slice(cardIndex);
  if (!isValidTableauStack(movingCards)) {
    return false;
  }

  const movingTopCard = movingCards[0];
  const destinationTopCard = destinationPile.cards[destinationPile.cards.length - 1];

  if (!destinationTopCard) {
    return movingTopCard.rank === 13;
  }

  return (
    isAlternatingColor(destinationTopCard, movingTopCard) &&
    isDescendingByOne(destinationTopCard, movingTopCard)
  );
}

function canPlaceOnFoundation(card: Card, foundationCards: Card[]): boolean {
  const topFoundation = foundationCards[foundationCards.length - 1];

  if (!topFoundation) {
    return card.rank === 1;
  }

  return topFoundation.suit === card.suit && card.rank === topFoundation.rank + 1;
}

export function isValidToFoundationMove(
  state: GameState,
  from: Pick<Location, 'pileKind' | 'pileIndex' | 'cardIndex'>,
  foundationIndex: number
): boolean {
  const foundation = state.foundations[foundationIndex];
  if (!foundation) {
    return false;
  }

  if (from.pileKind === 'tableau') {
    if (from.pileIndex === undefined || from.cardIndex === undefined) {
      return false;
    }

    const tableauPile = state.tableau[from.pileIndex];
    if (!tableauPile) {
      return false;
    }

    const sourceCard = tableauPile.cards[from.cardIndex];
    const isTopCard = from.cardIndex === tableauPile.cards.length - 1;

    if (!sourceCard || !sourceCard.faceUp || !isTopCard) {
      return false;
    }

    return canPlaceOnFoundation(sourceCard, foundation.cards);
  }

  if (from.pileKind === 'waste') {
    const wasteTop = state.waste.cards[state.waste.cards.length - 1];
    if (!wasteTop) {
      return false;
    }

    return canPlaceOnFoundation(wasteTop, foundation.cards);
  }

  return false;
}

export function isValidWasteMoves(
  state: GameState,
  to: Pick<Location, 'pileKind' | 'pileIndex'>
): boolean {
  const wasteTop = state.waste.cards[state.waste.cards.length - 1];
  if (!wasteTop || to.pileIndex === undefined) {
    return false;
  }

  if (to.pileKind === 'tableau') {
    const destinationPile = state.tableau[to.pileIndex];
    if (!destinationPile) {
      return false;
    }

    const destinationTop = destinationPile.cards[destinationPile.cards.length - 1];
    if (!destinationTop) {
      return wasteTop.rank === 13;
    }

    return (
      isAlternatingColor(destinationTop, wasteTop) && isDescendingByOne(destinationTop, wasteTop)
    );
  }

  if (to.pileKind === 'foundation') {
    return isValidToFoundationMove(state, { pileKind: 'waste' }, to.pileIndex);
  }

  return false;
}
