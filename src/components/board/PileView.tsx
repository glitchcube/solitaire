import type { Location, Pile } from '../../types/game';
import { CardView } from '../card/CardView';

type PileViewProps = {
  pile: Pile;
  title: string;
  index?: number;
  selected?: Location | null;
  onCardClick?: (location: Location) => void;
  onPileClick?: (location: Location) => void;
};

function topCard(pile: Pile) {
  return pile.cards[pile.cards.length - 1];
}

function isSelected(selected: Location | null | undefined, location: Location): boolean {
  return (
    selected?.pileKind === location.pileKind &&
    selected?.pileIndex === location.pileIndex &&
    selected?.cardIndex === location.cardIndex
  );
}

export function PileView({
  pile,
  title,
  index,
  selected = null,
  onCardClick,
  onPileClick
}: PileViewProps) {
  const pileId = index === undefined ? pile.kind : `${pile.kind}-${index}`;
  const pileLocation: Location = { pileKind: pile.kind, pileIndex: index };

  if (pile.kind === 'tableau') {
    return (
      <section
        data-testid={`pile-${pileId}`}
        className="min-h-36 rounded-lg bg-emerald-800/50 p-2"
        onClick={() => onPileClick?.(pileLocation)}
      >
        <header className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-100">
          {title} ({pile.cards.length})
        </header>
        {pile.cards.length === 0 ? (
          <div className="h-24 w-16 rounded-md border border-dashed border-emerald-200/60" />
        ) : (
          <div className="space-y-3">
            {pile.cards.map((card, cardIndex) => (
              <CardView
                key={card.id}
                card={card}
                isSelected={isSelected(selected, {
                  pileKind: 'tableau',
                  pileIndex: index,
                  cardIndex
                })}
                onClick={() =>
                  onCardClick?.({
                    pileKind: 'tableau',
                    pileIndex: index,
                    cardIndex
                  })
                }
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  const card = topCard(pile);

  return (
    <section
      data-testid={`pile-${pileId}`}
      className="rounded-lg bg-emerald-800/50 p-2"
      onClick={() => onPileClick?.(pileLocation)}
    >
      <header className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-100">
        {title} ({pile.cards.length})
      </header>
      {card ? (
        <CardView
          card={card}
          isSelected={isSelected(selected, {
            pileKind: pile.kind,
            pileIndex: index,
            cardIndex: pile.cards.length - 1
          })}
          onClick={() =>
            onCardClick?.({
              pileKind: pile.kind,
              pileIndex: index,
              cardIndex: pile.cards.length - 1
            })
          }
        />
      ) : (
        <div className="h-24 w-16 rounded-md border border-dashed border-emerald-200/60" />
      )}
    </section>
  );
}
