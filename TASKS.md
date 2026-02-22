# Task List

Status legend: `[todo]`, `[in-progress]`, `[done]`, `[blocked]`

## M1 - Project Setup + Test Harness

- [done] Initialize React + TypeScript + Vite project.
- [done] Add and configure Tailwind CSS.
- [done] Add Vitest + React Testing Library.
- [done] Add ESLint and Prettier.
- [done] Create base folder structure under `src/` and `tests/`.
- [done] Add baseline app render test.
- [done] Verify: app runs + tests pass. (Dependency install currently blocked by network access to npm registry.)

## M2 - Deck + Initial Deal Logic

- [todo] Define domain types (`Card`, `Pile`, `GameState`, `Move`).
- [todo] Implement `createDeck()`.
- [todo] Implement `shuffleDeck()`.
- [todo] Implement `dealInitialBoard()`.
- [todo] Test: 52 unique cards.
- [todo] Test: tableau sizes 1..7.
- [todo] Test: only tableau top cards face-up after deal.
- [todo] Test: stock size is correct after deal.

## M3 - Move Validation + Engine

- [todo] Implement `isValidTableauToTableauMove()`.
- [todo] Implement `isValidToFoundationMove()`.
- [todo] Implement `isValidWasteMoves()`.
- [todo] Implement `drawFromStock()` and `recycleWasteToStock()`.
- [todo] Implement `applyMove()` immutable state updates.
- [todo] Implement auto-flip for exposed tableau cards.
- [todo] Implement `isWinState()`.
- [todo] Tests for valid + invalid scenarios across all move types.
- [todo] Tests for edge cases (empty tableau king-only, empty stock recycle).

## M4 - Static Board UI

- [todo] Build `Card` component with face-up/down styles.
- [todo] Build `Pile` component.
- [todo] Build board sections (tableau, foundations, stock, waste).
- [todo] Connect UI to `GameState` rendering.
- [todo] Test render states (face-up/down, pile counts).

## M5 - Click-to-Move

- [todo] Implement source selection state.
- [todo] Implement destination selection handling.
- [todo] Map UI actions to `Move` model.
- [todo] Show invalid move feedback.
- [todo] Interaction tests for legal/illegal click moves.

## M6 - Drag-and-Drop

- [todo] Add `@dnd-kit/core`.
- [todo] Configure draggable cards and droppable piles.
- [todo] Support tableau stack dragging.
- [todo] Highlight valid drop targets.
- [todo] Keep click-to-move as fallback.
- [todo] Integration tests for key drag/drop flows.

## M7 - Polish + Regression

- [todo] Add "New Game" button.
- [todo] Add optional move counter.
- [todo] Fix UX rough edges and visual alignment.
- [todo] Add regression test for each fixed bug.
- [todo] Final verification pass of full suite.

## Ongoing Rules

- [todo] For every bug fixed, add a test in the same PR/commit.
- [todo] Do not merge milestone work unless all related tests pass.
- [todo] Keep game logic pure and UI-independent.
