export const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'] as const;

export type Suit = (typeof SUITS)[number];

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
};

export type PileKind = 'tableau' | 'foundation' | 'stock' | 'waste';

export type Pile = {
  kind: PileKind;
  cards: Card[];
};

export type GameState = {
  tableau: Pile[];
  foundations: Pile[];
  stock: Pile;
  waste: Pile;
  moveCount: number;
  status: 'in_progress' | 'won';
};

export type Location = {
  pileKind: PileKind;
  pileIndex?: number;
  cardIndex?: number;
};

export type Move = {
  from: Location;
  to: Location;
  count?: number;
};
