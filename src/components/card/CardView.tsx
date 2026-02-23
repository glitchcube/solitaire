import type { Card } from '../../types/game';

const SUIT_SYMBOL: Record<Card['suit'], string> = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠'
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

function rankName(rank: Card['rank']): string {
  if (rank === 1) {
    return 'Ace';
  }

  if (rank === 11) {
    return 'Jack';
  }

  if (rank === 12) {
    return 'Queen';
  }

  if (rank === 13) {
    return 'King';
  }

  return `${rank}`;
}

type CardViewProps = {
  card: Card;
  isSelected?: boolean;
  isDraggable?: boolean;
  transitionName?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
};

export function CardView({
  card,
  isSelected = false,
  isDraggable = false,
  transitionName,
  onClick,
  onDoubleClick
}: CardViewProps) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const ringClass = isSelected ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-900' : '';
  const baseClass = `h-[var(--card-h)] w-[var(--card-w)] rounded-md p-1 text-left shadow touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900 ${ringClass}`;
  const cardTitle = `${rankName(card.rank)} of ${card.suit}`;

  if (!card.faceUp) {
    return (
      <button
        type="button"
        aria-label="Face-down card"
        data-testid={`card-${card.id}`}
        data-face-up="false"
        data-draggable={isDraggable ? 'true' : 'false'}
        className={`${baseClass} border border-emerald-700 bg-emerald-800`}
        style={transitionName ? { viewTransitionName: transitionName } : undefined}
        onClick={(event) => {
          if (onClick) {
            event.stopPropagation();
          }
          onClick?.();
        }}
        onDoubleClick={(event) => {
          if (onDoubleClick) {
            event.stopPropagation();
          }
          onDoubleClick?.();
        }}
      >
        <span className="text-[10px] font-semibold tracking-wide text-emerald-100 md:text-xs" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={cardTitle}
      title={cardTitle}
      data-testid={`card-${card.id}`}
      data-face-up="true"
      data-draggable={isDraggable ? 'true' : 'false'}
      className={`${baseClass} relative border border-slate-300 bg-white`}
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
      onClick={(event) => {
        if (onClick) {
          event.stopPropagation();
        }
        onClick?.();
      }}
      onDoubleClick={(event) => {
        if (onDoubleClick) {
          event.stopPropagation();
        }
        onDoubleClick?.();
      }}
    >
      <span
        className={`absolute left-1 top-0.5 text-[11px] font-bold leading-none md:text-sm ${isRed ? 'text-rose-600' : 'text-slate-800'}`}
      >
        {rankLabel(card.rank)}
        {SUIT_SYMBOL[card.suit]}
      </span>
    </button>
  );
}
