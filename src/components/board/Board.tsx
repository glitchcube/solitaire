import type { GameState, Location } from '../../types/game';
import { PileView } from './PileView';

export interface BoardProps {
  state: GameState;
  selected?: Location | null;
  animateFoundationEntry?: boolean;
  onCardClick?: (location: Location) => void;
  onCardDoubleClick?: (location: Location) => void;
  onPileClick?: (location: Location) => void;
}

export function Board({
  state,
  selected = null,
  animateFoundationEntry = false,
  onCardClick,
  onCardDoubleClick,
  onPileClick
}: BoardProps) {
  return (
    <div
      className="mt-2 flex min-h-0 flex-1 flex-col gap-2 md:mt-3 md:grid md:grid-cols-6 md:gap-2 lg:gap-1"
      data-testid="board-root"
    >
      <section
        className="order-3 mt-auto grid grid-cols-2 gap-1 md:order-none md:col-span-2 md:mt-0 md:gap-1"
        data-testid="board-stock-waste"
      >
        <PileView
          pile={state.stock}
          title="Stock"
          selected={selected}
          animateFoundationEntry={animateFoundationEntry}
          onCardClick={onCardClick}
          onCardDoubleClick={onCardDoubleClick}
          onPileClick={onPileClick}
        />
        <PileView
          pile={state.waste}
          title="Waste"
          selected={selected}
          animateFoundationEntry={animateFoundationEntry}
          onCardClick={onCardClick}
          onCardDoubleClick={onCardDoubleClick}
          onPileClick={onPileClick}
        />
      </section>
      <section
        className="order-1 grid grid-cols-4 gap-1 md:order-none md:col-span-4 md:gap-1"
        data-testid="board-foundations"
      >
        {state.foundations.map((pile, index) => (
          <PileView
            key={`foundation-${index}`}
            pile={pile}
            title={`Foundation ${index + 1}`}
            index={index}
            selected={selected}
            animateFoundationEntry={animateFoundationEntry}
            onCardClick={onCardClick}
            onCardDoubleClick={onCardDoubleClick}
            onPileClick={onPileClick}
          />
        ))}
      </section>

      <section
        className="order-2 grid min-h-0 flex-1 grid-cols-7 gap-1 md:order-none md:col-span-6 md:gap-1"
        data-testid="board-tableau"
      >
        {state.tableau.map((pile, index) => (
          <PileView
            key={`tableau-${index}`}
            pile={pile}
            title={`Tableau ${index + 1}`}
            index={index}
            selected={selected}
            animateFoundationEntry={animateFoundationEntry}
            onCardClick={onCardClick}
            onCardDoubleClick={onCardDoubleClick}
            onPileClick={onPileClick}
          />
        ))}
      </section>
    </div>
  );
}
