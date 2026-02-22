import { isValidTableauToTableauMove, isValidToFoundationMove, isValidWasteMoves } from '../rules';
import type { Card, GameState, Move, Pile } from '../../types/game';

function clonePile(pile: Pile): Pile {
  return {
    ...pile,
    cards: pile.cards.map((card) => ({ ...card }))
  };
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    tableau: state.tableau.map(clonePile),
    foundations: state.foundations.map(clonePile),
    stock: clonePile(state.stock),
    waste: clonePile(state.waste)
  };
}

function withTableauAutoFlip(state: GameState, sourceTableauIndex: number): void {
  const sourcePile = state.tableau[sourceTableauIndex];
  if (!sourcePile) {
    return;
  }

  const topCard = sourcePile.cards[sourcePile.cards.length - 1];
  if (topCard && !topCard.faceUp) {
    topCard.faceUp = true;
  }
}

function normalizeGameStatus(state: GameState): void {
  state.status = isWinState(state) ? 'won' : 'in_progress';
}

function moveTableauStack(
  state: GameState,
  fromPileIndex: number,
  cardIndex: number,
  toPileIndex: number,
  count: number | undefined
): boolean {
  if (!isValidTableauToTableauMove(state, fromPileIndex, cardIndex, toPileIndex)) {
    return false;
  }

  const source = state.tableau[fromPileIndex];
  const destination = state.tableau[toPileIndex];

  const allMovingCards = source.cards.slice(cardIndex);
  const movingCards = count === undefined ? allMovingCards : allMovingCards.slice(0, count);

  if (movingCards.length === 0 || movingCards.length > allMovingCards.length) {
    return false;
  }

  source.cards = source.cards.slice(0, cardIndex);
  destination.cards = [...destination.cards, ...movingCards];

  withTableauAutoFlip(state, fromPileIndex);
  state.moveCount += 1;
  normalizeGameStatus(state);

  return true;
}

function moveToFoundation(state: GameState, move: Move): boolean {
  if (move.to.pileIndex === undefined) {
    return false;
  }

  if (!isValidToFoundationMove(state, move.from, move.to.pileIndex)) {
    return false;
  }

  const foundation = state.foundations[move.to.pileIndex];
  let movedCard: Card | undefined;

  if (move.from.pileKind === 'tableau') {
    if (move.from.pileIndex === undefined || move.from.cardIndex === undefined) {
      return false;
    }

    const source = state.tableau[move.from.pileIndex];
    movedCard = source.cards.pop();
    withTableauAutoFlip(state, move.from.pileIndex);
  } else if (move.from.pileKind === 'waste') {
    movedCard = state.waste.cards.pop();
  }

  if (!movedCard) {
    return false;
  }

  foundation.cards.push(movedCard);
  state.moveCount += 1;
  normalizeGameStatus(state);

  return true;
}

function moveWasteToTableau(state: GameState, move: Move): boolean {
  if (move.to.pileIndex === undefined) {
    return false;
  }

  if (!isValidWasteMoves(state, { pileKind: 'tableau', pileIndex: move.to.pileIndex })) {
    return false;
  }

  const movedCard = state.waste.cards.pop();
  if (!movedCard) {
    return false;
  }

  state.tableau[move.to.pileIndex].cards.push(movedCard);
  state.moveCount += 1;
  normalizeGameStatus(state);

  return true;
}

export function applyMove(state: GameState, move: Move): GameState {
  const next = cloneState(state);

  let didMove = false;

  if (move.from.pileKind === 'tableau' && move.to.pileKind === 'tableau') {
    if (
      move.from.pileIndex !== undefined &&
      move.from.cardIndex !== undefined &&
      move.to.pileIndex !== undefined
    ) {
      didMove = moveTableauStack(
        next,
        move.from.pileIndex,
        move.from.cardIndex,
        move.to.pileIndex,
        move.count
      );
    }
  } else if (
    (move.from.pileKind === 'tableau' || move.from.pileKind === 'waste') &&
    move.to.pileKind === 'foundation'
  ) {
    didMove = moveToFoundation(next, move);
  } else if (move.from.pileKind === 'waste' && move.to.pileKind === 'tableau') {
    didMove = moveWasteToTableau(next, move);
  }

  if (!didMove) {
    return state;
  }

  return next;
}

export function drawFromStock(state: GameState): GameState {
  if (state.stock.cards.length === 0) {
    return state;
  }

  const next = cloneState(state);
  const drawnCard = next.stock.cards.pop();

  if (!drawnCard) {
    return state;
  }

  next.waste.cards.push({ ...drawnCard, faceUp: true });
  normalizeGameStatus(next);

  return next;
}

export function recycleWasteToStock(state: GameState): GameState {
  if (state.stock.cards.length > 0 || state.waste.cards.length === 0) {
    return state;
  }

  const next = cloneState(state);
  next.stock.cards = [...next.waste.cards].reverse().map((card) => ({ ...card, faceUp: false }));
  next.waste.cards = [];
  normalizeGameStatus(next);

  return next;
}

export function isWinState(state: GameState): boolean {
  return state.foundations.every((foundation) => foundation.cards.length === 13);
}
