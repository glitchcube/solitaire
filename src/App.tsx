import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
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

const REPLAY_STEP_MS = 80;
const AUTO_FINISH_STEP_MS = 70;
const SAVED_REPLAYS_KEY = 'solitaire.saved-replays.v1';
const MAX_SAVED_REPLAYS = 10;

type SavedReplay = {
  id: string;
  createdAt: string;
  moveCount: number;
  frames: GameState[];
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

function getAutoFoundationSourceLocation(state: GameState, selected: Location): Location | null {
  if (selected.pileKind === 'tableau') {
    if (selected.pileIndex === undefined) {
      return null;
    }

    const pile = state.tableau[selected.pileIndex];
    const cardIndex = pile?.cards.length ? pile.cards.length - 1 : -1;
    if (cardIndex < 0) {
      return null;
    }

    const topCard = pile.cards[cardIndex];
    if (!topCard?.faceUp) {
      return null;
    }

    return {
      pileKind: 'tableau',
      pileIndex: selected.pileIndex,
      cardIndex
    };
  }

  if (selected.pileKind === 'waste') {
    const cardIndex = state.waste.cards.length - 1;
    if (cardIndex < 0) {
      return null;
    }

    return {
      pileKind: 'waste',
      cardIndex
    };
  }

  return null;
}

function allTableauCardsFaceUp(state: GameState): boolean {
  return state.tableau.every((pile) => pile.cards.every((card) => card.faceUp));
}

function findNextAutoFoundationMove(state: GameState): Move | null {
  for (let pileIndex = 0; pileIndex < state.tableau.length; pileIndex += 1) {
    const pile = state.tableau[pileIndex];
    const cardIndex = pile.cards.length - 1;
    if (cardIndex < 0) {
      continue;
    }

    const from: Location = {
      pileKind: 'tableau',
      pileIndex,
      cardIndex
    };

    for (
      let foundationIndex = 0;
      foundationIndex < state.foundations.length;
      foundationIndex += 1
    ) {
      if (!isValidToFoundationMove(state, from, foundationIndex)) {
        continue;
      }

      return {
        from,
        to: {
          pileKind: 'foundation',
          pileIndex: foundationIndex
        }
      };
    }
  }

  return null;
}

function loadSavedReplays(): SavedReplay[] {
  try {
    const raw = window.localStorage.getItem(SAVED_REPLAYS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedReplay[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry) =>
        Boolean(entry?.id) &&
        typeof entry?.createdAt === 'string' &&
        typeof entry?.moveCount === 'number' &&
        Array.isArray(entry?.frames) &&
        entry.frames.length >= 2
    );
  } catch {
    return [];
  }
}

function saveSavedReplays(entries: SavedReplay[]): void {
  window.localStorage.setItem(SAVED_REPLAYS_KEY, JSON.stringify(entries));
}

function App({ initialState }: AppProps) {
  const [state, setState] = useState<GameState>(() => initialState ?? createInitialGame());
  const [selected, setSelected] = useState<Location | null>(null);
  const [activeDrag, setActiveDrag] = useState<Location | null>(null);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [showSavedReplays, setShowSavedReplays] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isAutoFinishMode, setIsAutoFinishMode] = useState(false);
  const [hasReplayedWin, setHasReplayedWin] = useState(false);
  const [hasSavedCurrentWinReplay, setHasSavedCurrentWinReplay] = useState(false);
  const [savedReplays, setSavedReplays] = useState<SavedReplay[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const historyRef = useRef<GameState[]>([state]);
  const stateRef = useRef(state);
  const isViewTransitionInFlightRef = useRef(false);
  const disableViewTransitionsRef = useRef(false);
  const replayTimerRef = useRef<number | null>(null);
  const autoFinishTimerRef = useRef<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const runStateUpdateWithTransition = useCallback((update: () => void): void => {
    if (disableViewTransitionsRef.current || isViewTransitionInFlightRef.current) {
      update();
      return;
    }

    const transitionDocument = document as Document & {
      startViewTransition?: (cb: () => void) => { finished?: Promise<unknown> } | undefined;
    };

    if (typeof transitionDocument.startViewTransition !== 'function') {
      update();
      return;
    }

    try {
      isViewTransitionInFlightRef.current = true;
      const transition = transitionDocument.startViewTransition(() => {
        flushSync(update);
      });

      Promise.resolve(transition?.finished)
        .catch(() => {
          disableViewTransitionsRef.current = true;
        })
        .finally(() => {
          isViewTransitionInFlightRef.current = false;
        });
    } catch {
      disableViewTransitionsRef.current = true;
      isViewTransitionInFlightRef.current = false;
      update();
    }
  }, []);

  function canSelectSource(location: Location): boolean {
    if (isReplayMode || isAutoFinishMode || showNewGameConfirm) {
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

  function handleCardDoubleClick(location: Location): void {
    if (!canSelectSource(location)) {
      return;
    }

    for (
      let foundationIndex = 0;
      foundationIndex < state.foundations.length;
      foundationIndex += 1
    ) {
      if (!isValidToFoundationMove(state, location, foundationIndex)) {
        continue;
      }

      executeMove(
        {
          from: location,
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

  const executeMove = useCallback(
    (move: Move, invalidFeedback: string): boolean => {
      if (isReplayMode || isAutoFinishMode || showNewGameConfirm) {
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
    [isAutoFinishMode, isReplayMode, showNewGameConfirm, state]
  );

  function handlePileClick(destination: Location): void {
    if (isReplayMode || isAutoFinishMode || showNewGameConfirm) {
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
    if (isReplayMode || isAutoFinishMode || showNewGameConfirm) {
      return;
    }

    const activeLocation = (event.active.data.current?.location as Location | undefined) ?? null;
    setActiveDrag(activeLocation);
  }

  function handleDragEnd(event: DragEndEvent): void {
    if (isReplayMode || isAutoFinishMode || showNewGameConfirm) {
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

      if (isReplayMode || isAutoFinishMode || showNewGameConfirm) {
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

      const foundationSource = getAutoFoundationSourceLocation(state, selected);
      if (!foundationSource) {
        return;
      }

      for (
        let foundationIndex = 0;
        foundationIndex < state.foundations.length;
        foundationIndex += 1
      ) {
        if (!isValidToFoundationMove(state, foundationSource, foundationIndex)) {
          continue;
        }

        event.preventDefault();
        executeMove(
          {
            from: foundationSource,
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
  }, [executeMove, isAutoFinishMode, isReplayMode, selected, showNewGameConfirm, state]);

  const dragPreview = getDragPreview(state, activeDrag);

  const stopAutoFinish = useCallback((): void => {
    if (autoFinishTimerRef.current !== null) {
      window.clearInterval(autoFinishTimerRef.current);
      autoFinishTimerRef.current = null;
    }
  }, []);

  const startAutoFinish = useCallback((): void => {
    if (isReplayMode || isAutoFinishMode) {
      return;
    }

    stopAutoFinish();
    setIsAutoFinishMode(true);
    setSelected(null);
    setFeedback('');

    autoFinishTimerRef.current = window.setInterval(() => {
      const current = stateRef.current;
      const nextMove = findNextAutoFoundationMove(current);
      if (!nextMove) {
        stopAutoFinish();
        setIsAutoFinishMode(false);
        return;
      }

      const next = applyMove(current, nextMove);
      if (next === current) {
        stopAutoFinish();
        setIsAutoFinishMode(false);
        return;
      }

      runStateUpdateWithTransition(() => {
        setState(next);
      });
    }, AUTO_FINISH_STEP_MS);
  }, [isAutoFinishMode, isReplayMode, runStateUpdateWithTransition, stopAutoFinish]);

  const stopReplay = useCallback((): void => {
    if (replayTimerRef.current !== null) {
      window.clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
  }, []);

  const startReplay = useCallback(
    (frames: GameState[]): void => {
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

        runStateUpdateWithTransition(() => {
          setState(frames[frameIndex]);
        });
      }, REPLAY_STEP_MS);
    },
    [runStateUpdateWithTransition, stopReplay]
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setSavedReplays(loadSavedReplays());
  }, []);

  useEffect(() => {
    if (state.status !== 'won' || isReplayMode || isAutoFinishMode || hasSavedCurrentWinReplay) {
      return;
    }

    const existingFrames = historyRef.current;
    const frames =
      existingFrames[existingFrames.length - 1] === state
        ? existingFrames
        : [...existingFrames, state];
    if (frames.length < 2) {
      return;
    }

    const nextEntry: SavedReplay = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      moveCount: state.moveCount,
      frames
    };
    const nextSaved = [nextEntry, ...savedReplays].slice(0, MAX_SAVED_REPLAYS);
    saveSavedReplays(nextSaved);
    setSavedReplays(nextSaved);
    setHasSavedCurrentWinReplay(true);
  }, [hasSavedCurrentWinReplay, isAutoFinishMode, isReplayMode, savedReplays, state]);

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
    if (
      isReplayMode ||
      isAutoFinishMode ||
      showNewGameConfirm ||
      state.status === 'won' ||
      state.stock.cards.length > 0 ||
      state.waste.cards.length > 0 ||
      !allTableauCardsFaceUp(state)
    ) {
      return;
    }

    if (!findNextAutoFoundationMove(state)) {
      return;
    }

    startAutoFinish();
  }, [isAutoFinishMode, isReplayMode, showNewGameConfirm, startAutoFinish, state]);

  useEffect(() => {
    if (state.status !== 'won' || hasReplayedWin || isReplayMode || isAutoFinishMode) {
      return;
    }

    startReplay(historyRef.current);
  }, [hasReplayedWin, isAutoFinishMode, isReplayMode, startReplay, state.status]);

  useEffect(
    () => () => {
      stopAutoFinish();
      stopReplay();
    },
    [stopAutoFinish, stopReplay]
  );

  function startNewGame(): void {
    stopAutoFinish();
    stopReplay();
    const nextState = createInitialGame();
    setSelected(null);
    setFeedback('');
    setIsAutoFinishMode(false);
    setIsReplayMode(false);
    setHasReplayedWin(false);
    setHasSavedCurrentWinReplay(false);
    setShowNewGameConfirm(false);
    historyRef.current = [nextState];
    setState(nextState);
  }

  function handlePlayAgainFromCelebration(): void {
    stopAutoFinish();
    stopReplay();
    const nextState = createInitialGame();
    setSelected(null);
    setFeedback('');
    setIsAutoFinishMode(false);
    setIsReplayMode(false);
    setHasReplayedWin(false);
    setHasSavedCurrentWinReplay(false);
    setShowNewGameConfirm(false);
    historyRef.current = [nextState];
    setState(nextState);
  }

  function handleReplaySavedRun(replayId: string): void {
    const replay = savedReplays.find((entry) => entry.id === replayId);
    if (!replay) {
      return;
    }

    stopAutoFinish();
    stopReplay();
    setShowSavedReplays(false);
    setShowNewGameConfirm(false);
    setHasReplayedWin(true);
    setHasSavedCurrentWinReplay(true);
    setIsAutoFinishMode(false);
    startReplay(replay.frames);
  }

  function handleClearSavedReplays(): void {
    saveSavedReplays([]);
    setSavedReplays([]);
    setFeedback('');
  }

  const boardThemeClass =
    isReplayMode || isAutoFinishMode ? 'bg-sky-900 text-sky-50' : 'bg-emerald-900 text-white';
  const showWinCelebration =
    state.status === 'won' && !isReplayMode && !isAutoFinishMode && !showNewGameConfirm;

  return (
    <div className={`h-dvh w-full ${boardThemeClass}`}>
      <main className="mx-auto flex h-full w-full max-w-[1280px] flex-col overflow-hidden px-2 py-2 md:px-4 md:py-3">
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
              aria-label="Toggle saved replays"
              className="rounded-md border border-emerald-100/70 px-2 py-1 text-xs font-semibold text-emerald-50 hover:bg-emerald-800 md:px-3 md:py-2 md:text-sm"
              onClick={() => setShowSavedReplays((current) => !current)}
            >
              Replays ({savedReplays.length})
            </button>
            <button
              type="button"
              className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-950 hover:bg-emerald-200 md:px-3 md:py-2 md:text-sm"
              onClick={() => setShowNewGameConfirm(true)}
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
        {isAutoFinishMode ? (
          <p
            className="mt-2 rounded bg-sky-700/70 px-2 py-1 text-xs text-sky-100 md:text-sm"
            data-testid="auto-finish-banner"
          >
            Auto Finish: moving cards to foundation.
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-200 md:text-sm">
          <p>Selected: {selectionLabel(selected)}</p>
          <p>Moves: {state.moveCount}</p>
          <p>
            Status:{' '}
            {isReplayMode
              ? 'Replay'
              : isAutoFinishMode
                ? 'Auto Finish'
                : state.status === 'won'
                  ? 'Won'
                  : 'In Progress'}
          </p>
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
            <p>Double-click a face-up card to auto-move it to foundation (if legal).</p>
            <p>After a win, an automatic fast replay starts with a replay theme.</p>
            <p>Auto finish starts when stock/waste are empty and all tableau cards are revealed.</p>
            <p>`Escape`: clear current selection.</p>
            <p>`?`: toggle this hotkeys help panel.</p>
          </section>
        ) : null}
        {showSavedReplays ? (
          <section
            className="mt-2 rounded-md border border-emerald-300/60 bg-emerald-800/60 px-2 py-2 text-xs text-emerald-50 md:px-3 md:text-sm"
            data-testid="saved-replays-panel"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Saved Replays</p>
              <button
                type="button"
                className="rounded-md border border-emerald-200/70 px-2 py-1 text-[11px] font-semibold hover:bg-emerald-700 md:text-xs"
                onClick={handleClearSavedReplays}
                disabled={savedReplays.length === 0}
              >
                Clear
              </button>
            </div>
            {savedReplays.length === 0 ? (
              <p className="mt-2 text-emerald-200">No saved replays yet.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {savedReplays.map((entry, index) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2">
                    <span className="text-emerald-100">
                      #{savedReplays.length - index} · {entry.moveCount} moves
                    </span>
                    <button
                      type="button"
                      className="rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-200 md:text-xs"
                      onClick={() => handleReplaySavedRun(entry.id)}
                    >
                      Replay
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
        {showNewGameConfirm ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
            <div
              className="w-full max-w-sm rounded-md border border-amber-200/70 bg-emerald-800 px-4 py-4 text-sm text-amber-50 shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-label="New game confirmation"
            >
              <p className="font-semibold">Start a new game?</p>
              <p className="mt-1 text-xs text-amber-100 md:text-sm">
                Your current progress will be lost.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-amber-200/80 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-emerald-700 md:text-sm"
                  onClick={() => setShowNewGameConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-amber-200 px-3 py-1 text-xs font-semibold text-emerald-950 hover:bg-amber-300 md:text-sm"
                  onClick={startNewGame}
                >
                  Start New Game
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {showWinCelebration ? (
          <div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
            data-testid="win-celebration"
          >
            <div className="win-fireworks pointer-events-none">
              {Array.from({ length: 18 }).map((_, index) => (
                <span
                  key={`firework-${index}`}
                  className="win-firework-particle"
                  style={
                    {
                      '--delay': `${(index % 6) * 120}ms`,
                      '--x': `${(index % 2 === 0 ? 1 : -1) * (40 + (index % 5) * 20)}px`,
                      '--y': `${-120 - (index % 4) * 30}px`
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <section className="pointer-events-auto w-full max-w-md rounded-xl border border-amber-300/70 bg-emerald-800/95 px-6 py-6 text-center text-emerald-50 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                Victory
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">You Won!</h2>
              <p className="mt-2 text-sm text-emerald-100">
                Clean finish. Replay is saved and ready any time.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="rounded-md bg-amber-200 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-amber-300"
                  onClick={handlePlayAgainFromCelebration}
                >
                  Play Again
                </button>
              </div>
            </section>
          </div>
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
            animateFoundationEntry={isReplayMode}
            onCardClick={handleCardClick}
            onCardDoubleClick={handleCardDoubleClick}
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
    </div>
  );
}

export default App;
