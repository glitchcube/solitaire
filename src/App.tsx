import { useMemo } from 'react';
import { Board } from './components/board/Board';
import { dealInitialBoard, createDeck, shuffleDeck } from './game/setup';

function App() {
  const state = useMemo(() => dealInitialBoard(shuffleDeck(createDeck())), []);

  return (
    <main className="min-h-screen bg-emerald-900 p-6 text-white">
      <h1 className="text-3xl font-semibold tracking-tight">Solitaire</h1>
      <p className="mt-2 text-emerald-100">Static board rendering from game state.</p>
      <Board state={state} />
    </main>
  );
}

export default App;
