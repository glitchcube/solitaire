import type { Pile } from '../../types/game';
import { CardView } from '../card/CardView';

type PileViewProps = {
  pile: Pile;
  title: string;
  index?: number;
};

function topCard(pile: Pile) {
  return pile.cards[pile.cards.length - 1];
}

export function PileView({ pile, title, index }: PileViewProps) {
  const pileId = index === undefined ? pile.kind : `${pile.kind}-${index}`;

  if (pile.kind === 'tableau') {
    return (
      <section data-testid={`pile-${pileId}`} className="min-h-36 rounded-lg bg-emerald-800/50 p-2">
        <header className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-100">
          {title} ({pile.cards.length})
        </header>
        {pile.cards.length === 0 ? (
          <div className="h-24 w-16 rounded-md border border-dashed border-emerald-200/60" />
        ) : (
          <div className="space-y-3">
            {pile.cards.map((card) => (
              <CardView key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>
    );
  }

  const card = topCard(pile);

  return (
    <section data-testid={`pile-${pileId}`} className="rounded-lg bg-emerald-800/50 p-2">
      <header className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-100">
        {title} ({pile.cards.length})
      </header>
      {card ? (
        <CardView card={card} />
      ) : (
        <div className="h-24 w-16 rounded-md border border-dashed border-emerald-200/60" />
      )}
    </section>
  );
}
