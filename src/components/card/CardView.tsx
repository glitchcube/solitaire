import type { Card } from '../../types/game';

const SUIT_LABEL: Record<Card['suit'], string> = {
  clubs: 'C',
  diamonds: 'D',
  hearts: 'H',
  spades: 'S'
};

function rankLabel(rank: Card['rank']): string {
  if (rank === 1) {
    return 'A';
  }

  if (rank === 11) {
    return 'J';
  }

  if (rank === 12) {
    return 'Q';
  }

  if (rank === 13) {
    return 'K';
  }

  return `${rank}`;
}

type CardViewProps = {
  card: Card;
  isSelected?: boolean;
  isDraggable?: boolean;
  onClick?: () => void;
};

export function CardView({
  card,
  isSelected = false,
  isDraggable = false,
  onClick
}: CardViewProps) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const ringClass = isSelected ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-900' : '';
  const baseClass = `h-[var(--card-h)] w-[var(--card-w)] rounded-md p-1 text-left shadow touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900 ${ringClass}`;

  if (!card.faceUp) {
    return (
      <button
        type="button"
        data-testid={`card-${card.id}`}
        data-face-up="false"
        data-draggable={isDraggable ? 'true' : 'false'}
        className={`${baseClass} border border-emerald-700 bg-emerald-800`}
        onClick={(event) => {
          if (onClick) {
            event.stopPropagation();
          }
          onClick?.();
        }}
      >
        <span className="text-[10px] font-semibold tracking-wide text-emerald-100 md:text-xs" />
      </button>
    );
  }

  return (
    <button
      type="button"
      data-testid={`card-${card.id}`}
      data-face-up="true"
      data-draggable={isDraggable ? 'true' : 'false'}
      className={`${baseClass} relative border border-slate-300 bg-white`}
      onClick={(event) => {
        if (onClick) {
          event.stopPropagation();
        }
        onClick?.();
      }}
    >
      <span
        className={`absolute left-1 top-0.5 text-[11px] font-bold leading-none md:text-sm ${isRed ? 'text-rose-600' : 'text-slate-800'}`}
      >
        {rankLabel(card.rank)}
        {SUIT_LABEL[card.suit]}
      </span>
    </button>
  );
}
