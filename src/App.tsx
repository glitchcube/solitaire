import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Board } from './components/board/Board';
import { createMoveFromDrop } from './components/board/dnd';
import { getDragPreview } from './components/board/dragPreview';
import { CardView } from './components/card/CardView';
import { applyMove, drawFromStock, recycleWasteToStock } from './game/engine';
import { isValidToFoundationMove } from './game/rules';
import { dealInitialBoard, createDeck, shuffleDeck } from './game/setup';
import type { GameState, Location, Move, PileKind } from './types/game';

type AppProps = {
  initialState?: GameState;
};

const REPLAY_STEP_MS = 140;

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

function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  );
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (isTextEntryTarget(target)) {
    return true;
  }

  const tagName = target.tagName;
  return (
    tagName === 'BUTTON' ||
    tagName === 'A' ||
    target.getAttribute('role') === 'button' ||
    target.closest('[role="button"]') !== null
  );
}

function findFirstFaceUpCardIndex(state: GameState, tableauIndex: number): number | null {
  const pile = state.tableau[tableauIndex];
  if (!pile) {
    return null;
  }

  const cardIndex = pile.cards.findIndex((card) => card.faceUp);
  return cardIndex >= 0 ? cardIndex : null;
}

function App({ initialState }: AppProps) {
  const [state, setState] = useState<GameState>(() => initialState ?? createInitialGame());
  const [selected, setSelected] = useState<Location | null>(null);
  const [activeDrag, setActiveDrag] = useState<Location | null>(null);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [hasReplayedWin, setHasReplayedWin] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const historyRef = useRef<GameState[]>([state]);
  const replayTimerRef = useRef<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  function canSelectSource(location: Location): boolean {
    if (isReplayMode) {
      return false;
    }

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

  const executeMove = useCallback(
    (move: Move, invalidFeedback: string): boolean => {
      if (isReplayMode) {
        return false;
      }

      const next = applyMove(state, move);
      if (next === state) {
        setFeedback(invalidFeedback);
        return false;
      }

      setState(next);
      setSelected(null);
      setFeedback('');
      return true;
    },
    [isReplayMode, state]
  );

  function handlePileClick(destination: Location): void {
    if (isReplayMode) {
      return;
    }

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

    executeMove(move, 'Invalid move.');
  }

  function handleDragStart(event: DragStartEvent): void {
    if (isReplayMode) {
      return;
    }

    const activeLocation = (event.active.data.current?.location as Location | undefined) ?? null;
    setActiveDrag(activeLocation);
  }

  function handleDragEnd(event: DragEndEvent): void {
    if (isReplayMode) {
      return;
    }

    const activeLocation = (event.active.data.current?.location as Location | undefined) ?? null;
    const overLocation = (event.over?.data.current?.location as Location | undefined) ?? null;
    const move = createMoveFromDrop(activeLocation, overLocation);
    setActiveDrag(null);

    if (!move) {
      return;
    }

    executeMove(move, 'Invalid move.');
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const { key } = event;

      if (key === '?') {
        event.preventDefault();
        setShowHotkeys((current) => !current);
        return;
      }

      if (isReplayMode) {
        return;
      }

      if (isTextEntryTarget(event.target)) {
        return;
      }

      if (key === 'd' || key === 'D') {
        event.preventDefault();
        setSelected(null);
        setFeedback('');
        setState((current) =>
          current.stock.cards.length > 0 ? drawFromStock(current) : recycleWasteToStock(current)
        );
        return;
      }

      if (key === 'w' || key === 'W') {
        event.preventDefault();
        if (state.waste.cards.length === 0) {
          setFeedback('Waste is empty.');
          return;
        }

        const wasteLocation: Location = {
          pileKind: 'waste',
          cardIndex: state.waste.cards.length - 1
        };

        setFeedback('');
        setSelected((current) => (isSameLocation(current, wasteLocation) ? null : wasteLocation));
        return;
      }

      if (key >= '1' && key <= '7') {
        event.preventDefault();
        const tableauIndex = Number(key) - 1;

        if (!selected) {
          const cardIndex = findFirstFaceUpCardIndex(state, tableauIndex);
          if (cardIndex === null) {
            setFeedback(`No movable cards in Tableau ${tableauIndex + 1}.`);
            return;
          }

          setFeedback('');
          setSelected({
            pileKind: 'tableau',
            pileIndex: tableauIndex,
            cardIndex
          });
          return;
        }

        if (selected.pileKind === 'tableau' && selected.pileIndex === tableauIndex) {
          setSelected(null);
          return;
        }

        executeMove(
          {
            from: selected,
            to: {
              pileKind: 'tableau',
              pileIndex: tableauIndex
            }
          },
          'Invalid move.'
        );
        return;
      }

      if (key === 'Escape') {
        setSelected(null);
        setFeedback('');
        return;
      }

      if (!selected || !isActivationKey(key) || isInteractiveTarget(event.target)) {
        return;
      }

      for (
        let foundationIndex = 0;
        foundationIndex < state.foundations.length;
        foundationIndex += 1
      ) {
        if (!isValidToFoundationMove(state, selected, foundationIndex)) {
          continue;
        }

        event.preventDefault();
        executeMove(
          {
            from: selected,
            to: {
              pileKind: 'foundation',
              pileIndex: foundationIndex
            }
          },
          ''
        );
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [executeMove, isReplayMode, selected, state]);

  const dragPreview = getDragPreview(state, activeDrag);

  const stopReplay = useCallback((): void => {
    if (replayTimerRef.current !== null) {
      window.clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
  }, []);

  const startReplay = useCallback((): void => {
    const frames = historyRef.current;
    if (frames.length < 2) {
      setHasReplayedWin(true);
      return;
    }

    stopReplay();
    setHasReplayedWin(true);
    setIsReplayMode(true);
    setSelected(null);
    setFeedback('');

    let frameIndex = 0;
    setState(frames[0]);

    replayTimerRef.current = window.setInterval(() => {
      frameIndex += 1;

      if (frameIndex >= frames.length) {
        stopReplay();
        setIsReplayMode(false);
        return;
      }

      setState(frames[frameIndex]);
    }, REPLAY_STEP_MS);
  }, [stopReplay]);

  useEffect(() => {
    if (isReplayMode) {
      return;
    }

    const history = historyRef.current;
    if (history[history.length - 1] !== state) {
      history.push(state);
    }
  }, [isReplayMode, state]);

  useEffect(() => {
    if (state.status !== 'won' || hasReplayedWin || isReplayMode) {
      return;
    }

    startReplay();
  }, [hasReplayedWin, isReplayMode, startReplay, state.status]);

  useEffect(
    () => () => {
      stopReplay();
    },
    [stopReplay]
  );

  function handleNewGame(): void {
    stopReplay();
    const nextState = createInitialGame();
    setSelected(null);
    setFeedback('');
    setIsReplayMode(false);
    setHasReplayedWin(false);
    historyRef.current = [nextState];
    setState(nextState);
  }

  const replayThemeClass = isReplayMode ? 'bg-sky-900 text-sky-50' : 'bg-emerald-900 text-white';

  return (
    <main
      className={`flex h-dvh flex-col overflow-hidden px-2 py-2 md:px-4 md:py-3 ${replayThemeClass}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight md:text-3xl">Solitaire</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Toggle hotkeys help"
            className="rounded-md border border-emerald-100/70 px-2 py-1 text-xs font-semibold text-emerald-50 hover:bg-emerald-800 md:px-3 md:py-2 md:text-sm"
            onClick={() => setShowHotkeys((current) => !current)}
          >
            ?
          </button>
          <button
            type="button"
            className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-950 hover:bg-emerald-200 md:px-3 md:py-2 md:text-sm"
            onClick={handleNewGame}
          >
            New Game
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-emerald-100 md:mt-2 md:text-base">
        Click or drag cards to move them to tableau/foundation piles.
      </p>
      {isReplayMode ? (
        <p
          className="mt-2 rounded bg-sky-700/70 px-2 py-1 text-xs text-sky-100 md:text-sm"
          data-testid="replay-mode-banner"
        >
          Replay Mode: fast auto-playback of your winning run.
        </p>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-200 md:text-sm">
        <p>Selected: {selectionLabel(selected)}</p>
        <p>Moves: {state.moveCount}</p>
        <p>Status: {isReplayMode ? 'Replay' : state.status === 'won' ? 'Won' : 'In Progress'}</p>
      </div>
      {showHotkeys ? (
        <section
          className="mt-2 rounded-md border border-emerald-300/60 bg-emerald-800/60 px-2 py-2 text-xs text-emerald-50 md:px-3 md:text-sm"
          data-testid="hotkeys-panel"
        >
          <p className="font-semibold">Hotkeys</p>
          <p>`1..7`: select tableau column, then press `1..7` again to move to destination.</p>
          <p>`W`: select/deselect top waste card.</p>
          <p>`D`: draw from stock (or recycle waste when stock is empty).</p>
          <p>`Enter` / `Space`: auto-move selected source to foundation (if legal).</p>
          <p>After a win, an automatic fast replay starts with a replay theme.</p>
          <p>`Escape`: clear current selection.</p>
          <p>`?`: toggle this hotkeys help panel.</p>
        </section>
      ) : null}
      {feedback ? (
        <p
          className="mt-2 rounded bg-rose-900/60 px-2 py-1 text-xs text-rose-100 md:px-3 md:py-2 md:text-sm"
          role="alert"
        >
          {feedback}
        </p>
      ) : null}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDrag(null)}
      >
        <Board
          state={state}
          selected={selected}
          onCardClick={handleCardClick}
          onPileClick={handlePileClick}
        />
        <DragOverlay>
          {dragPreview ? (
            <div
              className="relative w-[var(--card-w)]"
              style={{
                height: `calc(var(--card-h) + ${Math.max(dragPreview.cards.length - 1, 0)} * var(--tableau-step))`
              }}
            >
              {dragPreview.cards.map((card, cardIndex) => (
                <div
                  key={`${card.id}-overlay`}
                  className="absolute left-0"
                  style={{
                    top: `calc(${cardIndex} * var(--tableau-step))`,
                    zIndex: cardIndex + 1
                  }}
                >
                  <CardView card={card} isDraggable={false} />
                </div>
              ))}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

export default App;
