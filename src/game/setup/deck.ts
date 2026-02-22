import { type Card, type Rank, SUITS } from '../../types/game';

const RANKS: ReadonlyArray<Rank> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false
      });
    }
  }

  return deck;
}

export function shuffleDeck(deck: ReadonlyArray<Card>, rng: () => number = Math.random): Card[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
