import { describe, expect, it } from 'vitest';
import { createMoveFromDrop } from '../../src/components/board/dnd';
import type { Location } from '../../src/types/game';

function loc(pileKind: Location['pileKind'], pileIndex?: number, cardIndex?: number): Location {
  return { pileKind, pileIndex, cardIndex };
}

describe('createMoveFromDrop', () => {
  it('builds move for tableau destination', () => {
    const move = createMoveFromDrop(loc('tableau', 0, 2), loc('tableau', 3));

    expect(move).toEqual({
      from: { pileKind: 'tableau', pileIndex: 0, cardIndex: 2 },
      to: { pileKind: 'tableau', pileIndex: 3 }
    });
  });

  it('builds move for foundation destination', () => {
    const move = createMoveFromDrop(loc('waste', undefined, 0), loc('foundation', 1));

    expect(move).toEqual({
      from: { pileKind: 'waste', pileIndex: undefined, cardIndex: 0 },
      to: { pileKind: 'foundation', pileIndex: 1 }
    });
  });

  it('returns null for missing or unsupported drop targets', () => {
    expect(createMoveFromDrop(null, loc('tableau', 1))).toBeNull();
    expect(createMoveFromDrop(loc('tableau', 0, 0), null)).toBeNull();
    expect(createMoveFromDrop(loc('tableau', 0, 0), loc('waste'))).toBeNull();
  });

  it('returns null when dropped back on the same pile', () => {
    const move = createMoveFromDrop(loc('tableau', 2, 1), loc('tableau', 2));
    expect(move).toBeNull();
  });
});
