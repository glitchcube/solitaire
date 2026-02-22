import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import App from '../../src/App';
import type { Card, GameState, Rank, Suit } from '../../src/types/game';

const SAVED_REPLAYS_KEY = 'solitaire.saved-replays.v1';

function makeCard(suit: Suit, rank: Rank, faceUp = true): Card {
  return {
    id: `${suit}-${rank}-${faceUp ? 'up' : 'down'}`,
    suit,
    rank,
    faceUp
  };
}

function suitCards(suit: Suit, toRank: number): Card[] {
  const cards: Card[] = [];
  for (let rank = 1; rank <= toRank; rank += 1) {
    cards.push(makeCard(suit, rank as Rank, true));
  }

  return cards;
}

function nearWinState(): GameState {
  return {
    tableau: [
      { kind: 'tableau', cards: [makeCard('hearts', 13, true)] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] }
    ],
    foundations: [
      { kind: 'foundation', cards: suitCards('hearts', 12) },
      { kind: 'foundation', cards: suitCards('clubs', 13) },
      { kind: 'foundation', cards: suitCards('diamonds', 13) },
      { kind: 'foundation', cards: suitCards('spades', 13) }
    ],
    stock: { kind: 'stock', cards: [makeCard('hearts', 2, false)] },
    waste: { kind: 'waste', cards: [] },
    moveCount: 0,
    status: 'in_progress'
  };
}

function autoFinishState(): GameState {
  return {
    tableau: [
      { kind: 'tableau', cards: [makeCard('hearts', 2, true)] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] },
      { kind: 'tableau', cards: [] }
    ],
    foundations: [
      { kind: 'foundation', cards: [makeCard('hearts', 1, true)] },
      { kind: 'foundation', cards: [] },
      { kind: 'foundation', cards: [] },
      { kind: 'foundation', cards: [] }
    ],
    stock: { kind: 'stock', cards: [] },
    waste: { kind: 'waste', cards: [] },
    moveCount: 0,
    status: 'in_progress'
  };
}

afterEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
});

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Solitaire' })).toBeInTheDocument();
  });

  it('toggles hotkeys panel from help button and keyboard shortcut', () => {
    render(<App />);

    expect(screen.queryByTestId('hotkeys-panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle hotkeys help' }));
    expect(screen.getByTestId('hotkeys-panel')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '?' });
    expect(screen.queryByTestId('hotkeys-panel')).not.toBeInTheDocument();
  });

  it('starts fast replay mode after a winning move and returns to won state', async () => {
    vi.useFakeTimers();
    render(<App initialState={nearWinState()} />);

    fireEvent.click(screen.getByText('K♥'));
    fireEvent.click(screen.getByTestId('pile-foundation-0'));

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('replay-mode-banner')).toBeInTheDocument();
    expect(screen.getByText('Status: Replay')).toBeInTheDocument();
    expect(screen.getByText('Foundation 1 (12)')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(140);
    });
    expect(screen.getByText('Foundation 1 (13)')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(140);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId('replay-mode-banner')).not.toBeInTheDocument();
    expect(screen.getByText('Status: Won')).toBeInTheDocument();
  });

  it('auto-finishes to foundation when stock/waste are empty and all cards are revealed', async () => {
    vi.useFakeTimers();
    render(<App initialState={autoFinishState()} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('auto-finish-banner')).toBeInTheDocument();
    expect(screen.getByText('Status: Auto Finish')).toBeInTheDocument();
    expect(screen.getByText('Foundation 1 (1)')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(90);
    });
    expect(screen.getByText('Foundation 1 (2)')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(90);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId('auto-finish-banner')).not.toBeInTheDocument();
    expect(screen.getByText('Status: In Progress')).toBeInTheDocument();
  });

  it('saves completed run history after a winning move', async () => {
    vi.useFakeTimers();
    render(<App initialState={nearWinState()} />);

    fireEvent.click(screen.getByText('K♥'));
    fireEvent.click(screen.getByTestId('pile-foundation-0'));

    await act(async () => {
      await Promise.resolve();
    });

    const stored = window.localStorage.getItem(SAVED_REPLAYS_KEY);
    expect(stored).toBeTruthy();
    const entries = JSON.parse(stored ?? '[]') as Array<{
      moveCount: number;
      frames: unknown[];
    }>;
    expect(entries).toHaveLength(1);
    expect(entries[0].moveCount).toBe(1);
    expect(entries[0].frames.length).toBeGreaterThanOrEqual(2);
  });

  it('replays a saved run from the saved replays panel', async () => {
    vi.useFakeTimers();
    const frameA: GameState = {
      tableau: [
        { kind: 'tableau', cards: [makeCard('hearts', 7, true)] },
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] }
      ],
      foundations: [
        { kind: 'foundation', cards: [] },
        { kind: 'foundation', cards: [] },
        { kind: 'foundation', cards: [] },
        { kind: 'foundation', cards: [] }
      ],
      stock: { kind: 'stock', cards: [makeCard('spades', 9, false)] },
      waste: { kind: 'waste', cards: [] },
      moveCount: 0,
      status: 'in_progress'
    };
    const frameB: GameState = {
      ...frameA,
      tableau: [
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] },
        { kind: 'tableau', cards: [] }
      ],
      foundations: [
        { kind: 'foundation', cards: [makeCard('hearts', 7, true)] },
        { kind: 'foundation', cards: [] },
        { kind: 'foundation', cards: [] },
        { kind: 'foundation', cards: [] }
      ],
      moveCount: 1
    };

    window.localStorage.setItem(
      SAVED_REPLAYS_KEY,
      JSON.stringify([
        {
          id: 'saved-1',
          createdAt: '2026-02-22T00:00:00.000Z',
          moveCount: 1,
          frames: [frameA, frameB]
        }
      ])
    );

    render(<App initialState={nearWinState()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle saved replays' }));
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));

    expect(screen.getByTestId('replay-mode-banner')).toBeInTheDocument();
    expect(screen.getByText('Tableau 1 (1)')).toBeInTheDocument();
    expect(screen.getByText('Foundation 1 (0)')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(140);
    });
    expect(screen.getByText('Tableau 1 (0)')).toBeInTheDocument();
    expect(screen.getByText('Foundation 1 (1)')).toBeInTheDocument();
  });
});
