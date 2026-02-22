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
    <div
      className="mt-2 flex min-h-0 flex-1 flex-col gap-2 md:mt-3 md:gap-3"
      data-testid="board-root"
    >
      <section className="grid grid-cols-6 gap-1 md:gap-2">
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

      <section className="grid min-h-0 flex-1 grid-cols-7 gap-1 md:gap-2">
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
