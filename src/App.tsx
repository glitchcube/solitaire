import { DndContext, PointerSensor, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';
import { Board } from './components/board/Board';
import { createMoveFromDrop } from './components/board/dnd';
import { applyMove, drawFromStock, recycleWasteToStock } from './game/engine';
import { dealInitialBoard, createDeck, shuffleDeck } from './game/setup';
import type { GameState, Location, Move, PileKind } from './types/game';

type AppProps = {
  initialState?: GameState;
};

function isSameLocation(a: Location | null, b: Location): boolean {
  return a?.pileKind === b.pileKind && a?.pileIndex === b.pileIndex && a?.cardIndex === b.cardIndex;
}

function selectionLabel(selection: Location | null): string {
  if (!selection) {
    return 'none';
  }

  const pile =
    selection.pileIndex === undefined
      ? selection.pileKind
      : `${selection.pileKind}-${selection.pileIndex}`;
  if (selection.cardIndex === undefined) {
    return pile;
  }

  return `${pile}@${selection.cardIndex}`;
}

function destinationAllowed(pileKind: PileKind): boolean {
  return pileKind === 'tableau' || pileKind === 'foundation';
}

function createInitialGame(): GameState {
  return dealInitialBoard(shuffleDeck(createDeck()));
}

function App({ initialState }: AppProps) {
  const [state, setState] = useState<GameState>(() => initialState ?? createInitialGame());
  const [selected, setSelected] = useState<Location | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  function canSelectSource(location: Location): boolean {
    if (location.pileKind === 'tableau') {
      if (location.pileIndex === undefined || location.cardIndex === undefined) {
        return false;
      }

      const card = state.tableau[location.pileIndex]?.cards[location.cardIndex];
      return Boolean(card?.faceUp);
    }

    if (location.pileKind === 'waste') {
      return state.waste.cards.length > 0;
    }

    return false;
  }

  function handleCardClick(location: Location): void {
    if (!canSelectSource(location)) {
      return;
    }

    setFeedback('');
    setSelected((current) => (isSameLocation(current, location) ? null : location));
  }

  function handlePileClick(destination: Location): void {
    setFeedback('');

    if (destination.pileKind === 'stock') {
      setSelected(null);
      setState((current) =>
        current.stock.cards.length > 0 ? drawFromStock(current) : recycleWasteToStock(current)
      );
      return;
    }

    if (!selected) {
      return;
    }

    if (
      selected.pileKind === destination.pileKind &&
      selected.pileIndex === destination.pileIndex
    ) {
      setSelected(null);
      return;
    }

    if (!destinationAllowed(destination.pileKind)) {
      setFeedback('Invalid destination. Choose a tableau or foundation pile.');
      return;
    }

    const move: Move = {
      from: selected,
      to: {
        pileKind: destination.pileKind,
        pileIndex: destination.pileIndex
      }
    };

    setState((current) => {
      const next = applyMove(current, move);
      if (next === current) {
        setFeedback('Invalid move.');
      } else {
        setSelected(null);
      }

      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent): void {
    const activeLocation = (event.active.data.current?.location as Location | undefined) ?? null;
    const overLocation = (event.over?.data.current?.location as Location | undefined) ?? null;
    const move = createMoveFromDrop(activeLocation, overLocation);

    if (!move) {
      return;
    }

    setFeedback('');
    setState((current) => {
      const next = applyMove(current, move);
      if (next === current) {
        setFeedback('Invalid move.');
      } else {
        setSelected(null);
      }

      return next;
    });
  }

  function handleNewGame(): void {
    setSelected(null);
    setFeedback('');
    setState(createInitialGame());
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-emerald-900 px-2 py-2 text-white md:px-4 md:py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight md:text-3xl">Solitaire</h1>
        <button
          type="button"
          className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-950 hover:bg-emerald-200 md:px-3 md:py-2 md:text-sm"
          onClick={handleNewGame}
        >
          New Game
        </button>
      </div>
      <p className="mt-1 text-xs text-emerald-100 md:mt-2 md:text-base">
        Click or drag cards to move them to tableau/foundation piles.
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-200 md:text-sm">
        <p>Selected: {selectionLabel(selected)}</p>
        <p>Moves: {state.moveCount}</p>
        <p>Status: {state.status === 'won' ? 'Won' : 'In Progress'}</p>
      </div>
      {feedback ? (
        <p
          className="mt-2 rounded bg-rose-900/60 px-2 py-1 text-xs text-rose-100 md:px-3 md:py-2 md:text-sm"
          role="alert"
        >
          {feedback}
        </p>
      ) : null}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <Board
          state={state}
          selected={selected}
          onCardClick={handleCardClick}
          onPileClick={handlePileClick}
        />
      </DndContext>
    </main>
  );
}

export default App;
