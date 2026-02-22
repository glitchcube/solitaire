# Architecture

## Principles

- Keep rules and state transitions in pure functions.
- Keep UI components focused on rendering and user interaction.
- Make game logic framework-agnostic for fast unit tests.
- Prefer small, explicit data types over implicit structure.

## Planned Folder Layout

```text
.
├── src/
│   ├── components/
│   │   ├── board/
│   │   ├── card/
│   │   └── controls/
│   ├── game/
│   │   ├── setup/
│   │   ├── rules/
│   │   └── engine/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── docs/
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
├── tests/
│   ├── game/
│   └── ui/
└── TASKS.md
```

## Domain Types (initial)

```ts
type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
};

type PileKind = 'tableau' | 'foundation' | 'stock' | 'waste';

type Pile = {
  kind: PileKind;
  cards: Card[];
};

type GameState = {
  tableau: Pile[]; // length 7
  foundations: Pile[]; // length 4
  stock: Pile;
  waste: Pile;
  moveCount: number;
  status: 'in_progress' | 'won';
};
```

## Rule Boundaries

- `setup/*`
- Create and shuffle deck.
- Deal initial layout.

- `rules/*`
- Validate moves:
  - Tableau -> tableau
  - Tableau -> foundation
  - Waste -> tableau
  - Waste -> foundation
  - Draw from stock
  - Recycle waste to stock

- `engine/*`
- Apply valid moves and return new `GameState`.
- Flip newly exposed tableau cards.
- Evaluate win condition.

## UI Boundaries

- Components never mutate state directly.
- UI dispatches intent (`Move`) to engine.
- Engine returns new state or invalid result.
- UI displays valid targets and feedback based on engine response.

## Testing Strategy

1. Unit tests (highest priority)

- Pure game logic (`setup`, `rules`, `engine`).

2. Component behavior tests

- Card/pile rendering states.
- Click-to-move interactions.

3. Drag/drop integration tests

- Verify move intent and result mapping.

## Initial Move Model

```ts
type Location = {
  pileKind: PileKind;
  pileIndex?: number;
  cardIndex?: number;
};

type Move = {
  from: Location;
  to: Location;
  count?: number; // for tableau stack moves
};
```

This model can evolve as drag/drop details become concrete.
