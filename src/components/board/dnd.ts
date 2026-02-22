import type { Location, Move } from '../../types/game';

export function createMoveFromDrop(active: Location | null, over: Location | null): Move | null {
  if (!active || !over) {
    return null;
  }

  if (over.pileKind !== 'tableau' && over.pileKind !== 'foundation') {
    return null;
  }

  if (active.pileKind === over.pileKind && active.pileIndex === over.pileIndex) {
    return null;
  }

  return {
    from: active,
    to: {
      pileKind: over.pileKind,
      pileIndex: over.pileIndex
    }
  };
}
