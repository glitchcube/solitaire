import type { GameState } from '../../types/game';
import { PileView } from './PileView';

type BoardProps = {
  state: GameState;
};

export function Board({ state }: BoardProps) {
  return (
    <div className="mt-6 space-y-6" data-testid="board-root">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <PileView pile={state.stock} title="Stock" />
        <PileView pile={state.waste} title="Waste" />
        {state.foundations.map((pile, index) => (
          <PileView
            key={`foundation-${index}`}
            pile={pile}
            title={`Foundation ${index + 1}`}
            index={index}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {state.tableau.map((pile, index) => (
          <PileView
            key={`tableau-${index}`}
            pile={pile}
            title={`Tableau ${index + 1}`}
            index={index}
          />
        ))}
      </section>
    </div>
  );
}
