# Roadmap

## Scope

MVP is playable Klondike Solitaire with:

- Correct initial deal
- Legal move enforcement
- Stock draw and recycle
- Win detection
- Click and drag/drop interactions

## Milestones

## Milestone 1: Project Setup + Test Harness

Deliverables:

- React + TypeScript + Vite setup
- Tailwind configured
- Vitest + React Testing Library configured
- Initial folder structure and placeholder components

Acceptance criteria:

- App runs locally.
- Test command runs and passes with a baseline test.
- Lint/typecheck pass.

Test gate:

- `pnpm test` passes in CI/local.

## Milestone 2: Deck + Initial Deal Logic

Deliverables:

- Card/deck types and deck creation
- Shuffle helper
- Initial Klondike deal generator

Acceptance criteria:

- 52 unique cards.
- Tableau columns have 1..7 cards.
- Only top card in each tableau column is face up.
- Stock has remaining cards.

Test gate:

- Unit tests cover all deal invariants.

## Milestone 3: Move Validation + Engine

Deliverables:

- Move validation rules
- Move application engine
- Auto-flip exposed tableau cards
- Win detection logic

Acceptance criteria:

- Invalid moves are rejected.
- Valid moves produce correct immutable state update.
- Exposed face-down tableau card flips when uncovered.
- Win state detected when all foundations complete.

Test gate:

- Unit tests for each move type and edge cases.

## Milestone 4: Static Board UI

Deliverables:

- Card/pile/board components
- Tailwind layout for tableau/foundation/stock/waste
- Face-up and face-down card visuals

Acceptance criteria:

- Board renders from `GameState`.
- Layout works on desktop and mobile widths.

Test gate:

- Component tests validate key render states.

## Milestone 5: Click-to-Move Interaction

Deliverables:

- Select source card/pile
- Select destination pile
- Dispatch `Move` into engine
- Basic invalid-move feedback

Acceptance criteria:

- User can perform legal moves without drag/drop.
- Invalid move feedback appears.

Test gate:

- Interaction tests for select/move/reject flow.

## Milestone 6: Drag-and-Drop Interaction

Deliverables:

- Integrate `@dnd-kit/core`
- Drag single card and tableau stacks
- Valid drop target highlighting

Acceptance criteria:

- Drag/drop produces same results as click-to-move.
- Invalid drops are safely rejected.

Test gate:

- Integration tests cover primary drag/drop flows.

## Milestone 7: Polish + Regression Coverage

Deliverables:

- New Game control
- Move counter (optional)
- Bug fix hardening
- Add regression tests for fixed issues

Acceptance criteria:

- Stable playable MVP.
- Known bugs covered by tests.

Test gate:

- Full suite green with no flaky tests.
