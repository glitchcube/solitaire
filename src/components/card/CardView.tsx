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
};

export function CardView({ card }: CardViewProps) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  if (!card.faceUp) {
    return (
      <article
        data-testid={`card-${card.id}`}
        data-face-up="false"
        className="h-24 w-16 rounded-md border border-emerald-700 bg-emerald-800 p-2 shadow"
      >
        <span className="text-xs font-semibold tracking-wide text-emerald-100">Hidden</span>
      </article>
    );
  }

  return (
    <article
      data-testid={`card-${card.id}`}
      data-face-up="true"
      className="h-24 w-16 rounded-md border border-slate-300 bg-white p-2 shadow"
    >
      <span className={`text-sm font-bold ${isRed ? 'text-rose-600' : 'text-slate-800'}`}>
        {rankLabel(card.rank)}
        {SUIT_LABEL[card.suit]}
      </span>
    </article>
  );
}
