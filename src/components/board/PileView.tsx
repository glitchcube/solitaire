import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { CSSProperties } from 'react';
import type { Card, Location, Pile } from '../../types/game';
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

type DraggableCardProps = {
  card: Card;
  location: Location;
  isSelected: boolean;
  canDrag: boolean;
  onClick?: () => void;
};

function DraggableCard({ card, location, isSelected, canDrag, onClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `drag-${card.id}-${location.pileKind}-${location.pileIndex ?? 'none'}-${location.cardIndex ?? 'none'}`,
    data: {
      location
    },
    disabled: !canDrag
  });

  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-60' : undefined}
      data-testid={`draggable-${card.id}`}
      data-draggable={canDrag ? 'true' : 'false'}
      {...attributes}
      {...listeners}
    >
      <CardView card={card} isSelected={isSelected} isDraggable={canDrag} onClick={onClick} />
    </div>
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
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${pileId}`,
    data: {
      location: pileLocation
    }
  });
  const pileClass = `${pile.kind === 'tableau' ? 'min-h-36' : ''} rounded-lg bg-emerald-800/50 p-2 ${
    isOver ? 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-emerald-900' : ''
  }`;

  if (pile.kind === 'tableau') {
    return (
      <section
        ref={setNodeRef}
        data-testid={`pile-${pileId}`}
        data-droppable="true"
        className={pileClass}
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
              <DraggableCard
                key={card.id}
                card={card}
                location={{ pileKind: 'tableau', pileIndex: index, cardIndex }}
                isSelected={isSelected(selected, {
                  pileKind: 'tableau',
                  pileIndex: index,
                  cardIndex
                })}
                canDrag={card.faceUp}
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
      ref={setNodeRef}
      data-testid={`pile-${pileId}`}
      data-droppable={pile.kind === 'tableau' || pile.kind === 'foundation' ? 'true' : 'false'}
      className={pileClass}
      onClick={() => onPileClick?.(pileLocation)}
    >
      <header className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-100">
        {title} ({pile.cards.length})
      </header>
      {card ? (
        <DraggableCard
          card={card}
          location={{ pileKind: pile.kind, pileIndex: index, cardIndex: pile.cards.length - 1 }}
          isSelected={isSelected(selected, {
            pileKind: pile.kind,
            pileIndex: index,
            cardIndex: pile.cards.length - 1
          })}
          canDrag={pile.kind === 'waste'}
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
