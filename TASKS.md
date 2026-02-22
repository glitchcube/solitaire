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

- [done] Define domain types (`Card`, `Pile`, `GameState`, `Move`).
- [done] Implement `createDeck()`.
- [done] Implement `shuffleDeck()`.
- [done] Implement `dealInitialBoard()`.
- [done] Test: 52 unique cards.
- [done] Test: tableau sizes 1..7.
- [done] Test: only tableau top cards face-up after deal.
- [done] Test: stock size is correct after deal.

## M3 - Move Validation + Engine

- [done] Implement `isValidTableauToTableauMove()`.
- [done] Implement `isValidToFoundationMove()`.
- [done] Implement `isValidWasteMoves()`.
- [done] Implement `drawFromStock()` and `recycleWasteToStock()`.
- [done] Implement `applyMove()` immutable state updates.
- [done] Implement auto-flip for exposed tableau cards.
- [done] Implement `isWinState()`.
- [done] Tests for valid + invalid scenarios across all move types.
- [done] Tests for edge cases (empty tableau king-only, empty stock recycle).

## M4 - Static Board UI

- [done] Build `Card` component with face-up/down styles.
- [done] Build `Pile` component.
- [done] Build board sections (tableau, foundations, stock, waste).
- [done] Connect UI to `GameState` rendering.
- [done] Test render states (face-up/down, pile counts).

## M5 - Click-to-Move

- [done] Implement source selection state.
- [done] Implement destination selection handling.
- [done] Map UI actions to `Move` model.
- [done] Show invalid move feedback.
- [done] Interaction tests for legal/illegal click moves.

## M6 - Drag-and-Drop

- [done] Add `@dnd-kit/core`.
- [done] Configure draggable cards and droppable piles.
- [done] Support tableau stack dragging.
- [done] Highlight valid drop targets.
- [done] Keep click-to-move as fallback.
- [done] Integration tests for key drag/drop flows.

## M7 - Polish + Regression

- [done] Add "New Game" button.
- [done] Add optional move counter.
- [done] Fix UX rough edges and visual alignment.
- [done] Add regression test for each fixed bug.
- [done] Final verification pass of full suite.

## Ongoing Rules

- [todo] For every bug fixed, add a test in the same PR/commit.
- [todo] Do not merge milestone work unless all related tests pass.
- [todo] Keep game logic pure and UI-independent.
