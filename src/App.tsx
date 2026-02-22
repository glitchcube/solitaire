import { useMemo, useState } from 'react';
import { Board } from './components/board/Board';
import { applyMove, drawFromStock, recycleWasteToStock } from './game/engine';
import { dealInitialBoard, createDeck, shuffleDeck } from './game/setup';
import type { GameState, Location, Move } from './types/game';

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

function App({ initialState }: AppProps) {
  const defaultState = useMemo(() => dealInitialBoard(shuffleDeck(createDeck())), []);
  const [state, setState] = useState<GameState>(initialState ?? defaultState);
  const [selected, setSelected] = useState<Location | null>(null);
  const [feedback, setFeedback] = useState<string>('');

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

    if (destination.pileKind !== 'tableau' && destination.pileKind !== 'foundation') {
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

  return (
    <main className="min-h-screen bg-emerald-900 p-6 text-white">
      <h1 className="text-3xl font-semibold tracking-tight">Solitaire</h1>
      <p className="mt-2 text-emerald-100">Click cards to move them to tableau/foundation piles.</p>
      <p className="mt-1 text-sm text-emerald-200">Selected: {selectionLabel(selected)}</p>
      {feedback ? (
        <p className="mt-2 rounded bg-rose-900/60 px-3 py-2 text-sm text-rose-100" role="status">
          {feedback}
        </p>
      ) : null}
      <Board
        state={state}
        selected={selected}
        onCardClick={handleCardClick}
        onPileClick={handlePileClick}
      />
    </main>
  );
}

export default App;
