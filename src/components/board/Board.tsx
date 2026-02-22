import type { GameState, Location } from '../../types/game';
import { PileView } from './PileView';

type BoardProps = {
  state: GameState;
  selected?: Location | null;
  onCardClick?: (location: Location) => void;
  onPileClick?: (location: Location) => void;
};

export function Board({ state, selected = null, onCardClick, onPileClick }: BoardProps) {
  return (
    <div className="mt-6 space-y-6" data-testid="board-root">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <PileView
          pile={state.stock}
          title="Stock"
          selected={selected}
          onCardClick={onCardClick}
          onPileClick={onPileClick}
        />
        <PileView
          pile={state.waste}
          title="Waste"
          selected={selected}
          onCardClick={onCardClick}
          onPileClick={onPileClick}
        />
        {state.foundations.map((pile, index) => (
          <PileView
            key={`foundation-${index}`}
            pile={pile}
            title={`Foundation ${index + 1}`}
            index={index}
            selected={selected}
            onCardClick={onCardClick}
            onPileClick={onPileClick}
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
            selected={selected}
            onCardClick={onCardClick}
            onPileClick={onPileClick}
          />
        ))}
      </section>
    </div>
  );
}
