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

## M8 - Classic Layout + Mobile Fit

- [done] Render tableau as stacked/overlapped card columns (classic solitaire look).
- [done] Tune card dimensions and offsets with responsive CSS variables.
- [done] Make board fit iPhone-sized viewports without page scrolling.
- [done] Add regression coverage for stacked tableau rendering.

## M9 - Next Feature Tasks

- [todo] Add win modal/celebration with "Play Again".
- [done] Add keyboard accessibility (focus states + Enter/Space move flow).
- [done] Add power-user hotkeys for fast play (select source, cycle/select destinations, confirm move, cancel selection) including multi-card tableau stacks.
- [done] Add a post-win replay mode with stable fast playback speed and a distinct "replay" visual theme so it is clear the board is auto-playing history.
- [todo] Add optional undo (single-step then multi-step history).
- [todo] Add basic score/timer toggle.

## M10 - Backlog (Reported Bugs + Requested Features)

- [todo] Bug: Auto-foundation hotkey (`Enter`/`Space`) should move the top card of a selected tableau run to foundation when legal (example: foundation has `A♣`, tableau has `4♣ 3♥ 2♣`, pressing hotkey should move `2♣`).
- [todo] Add confirmation dialog before starting a New Game to prevent accidental reset.
- [todo] Feature: Save completed replay history so players can replay past wins later.
- [todo] Investigate/validate endgame auto-finish condition (stock empty, waste empty, no face-down cards). If always solvable/won at that point, add automatic fast animation moving cards to foundations step-by-step.

## Ongoing Rules

- [todo] For every bug fixed, add a test in the same PR/commit.
- [todo] Do not merge milestone work unless all related tests pass.
- [todo] Keep game logic pure and UI-independent.
