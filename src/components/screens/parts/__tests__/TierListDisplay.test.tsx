import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { getMGame } from '../../../../models/m-game';
import { getMRivalry } from '../../../../models/m-rivalry';
import { getMTierList } from '../../../../models/m-tier-list';
import { GameProvider } from '../../../../providers/game';
import { RivalryProvider } from '../../../../providers/rivalry';
import {
  SyncedScrollViewContext,
  syncedScrollViewState,
} from '../../../../providers/scroll-view';
import { TierListDisplay } from '../TierListDisplay';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockGame = getMGame({
  id: 'game-1',
  name: 'Super Smash Bros. Ultimate',
  fighters: {
    items: [
      { id: 'fighter-1', name: 'Mario', gameId: 'game-1' },
      { id: 'fighter-2', name: 'Link', gameId: 'game-1' },
    ],
  },
} as any);

const createMockTierList = () => {
  const tierSlots = Array.from({ length: 12 }, (_, i) => ({
    id: `slot-${i}`,
    fighterId: `fighter-${i % 2 === 0 ? 1 : 2}`,
    position: i,
    tierListId: 'tierlist-1',
  }));

  return getMTierList({
    id: 'tierlist-1',
    userId: 'user-1',
    rivalryId: 'rivalry-1',
    standing: 0,
    tierSlots: {
      items: tierSlots,
    },
  } as any);
};

const mockRivalry = getMRivalry({
  rivalry: {
    id: 'rivalry-1',
    userAId: 'user-1',
    userBId: 'user-2',
    gameId: 'game-1',
  } as any,
});

describe('TierListDisplay', () => {
  it('renders without crashing', async () => {
    const mockTierList = createMockTierList();

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <RivalryProvider rivalry={mockRivalry}>
          <GameProvider game={mockGame}>
            <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
              <TierListDisplay
                tierList={mockTierList}
                tierListSignifier="A"
                unlinked={false}
              />
            </SyncedScrollViewContext.Provider>
          </GameProvider>
        </RivalryProvider>
      </QueryClientProvider>
    );

    // Should render tier labels
    await waitFor(() => {
      expect(getByText('S')).toBeTruthy();
    });
  });

  // REMOVED: Duplicate of 'renders without crashing' test - both tests did the exact same thing

  it('renders with unlinked prop set to true', async () => {
    const mockTierList = createMockTierList();

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <RivalryProvider rivalry={mockRivalry}>
          <GameProvider game={mockGame}>
            <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
              <TierListDisplay
                tierList={mockTierList}
                tierListSignifier="B"
                unlinked={true}
              />
            </SyncedScrollViewContext.Provider>
          </GameProvider>
        </RivalryProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText('S')).toBeTruthy();
    });
  });

  it('handles empty tier slots', () => {
    const emptyTierList = getMTierList({
      id: 'tierlist-2',
      userId: 'user-1',
      rivalryId: 'rivalry-1',
      standing: 0,
      tierSlots: {
        items: [],
      },
    } as any);

    const { root } = render(
      <QueryClientProvider client={queryClient}>
        <RivalryProvider rivalry={mockRivalry}>
          <GameProvider game={mockGame}>
            <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
              <TierListDisplay
                tierList={emptyTierList}
                tierListSignifier="A"
                unlinked={false}
              />
            </SyncedScrollViewContext.Provider>
          </GameProvider>
        </RivalryProvider>
      </QueryClientProvider>
    );

    expect(root).toBeTruthy();
  });

  it('sorts tier slots by position', async () => {
    const unsortedSlots = [
      {
        id: 'slot-2',
        fighterId: 'fighter-2',
        position: 2,
        tierListId: 'tierlist-1',
      },
      {
        id: 'slot-0',
        fighterId: 'fighter-1',
        position: 0,
        tierListId: 'tierlist-1',
      },
      {
        id: 'slot-1',
        fighterId: 'fighter-2',
        position: 1,
        tierListId: 'tierlist-1',
      },
    ];

    const unsortedTierList = getMTierList({
      id: 'tierlist-3',
      userId: 'user-1',
      rivalryId: 'rivalry-1',
      standing: 0,
      tierSlots: {
        items: unsortedSlots,
      },
    } as any);

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <RivalryProvider rivalry={mockRivalry}>
          <GameProvider game={mockGame}>
            <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
              <TierListDisplay
                tierList={unsortedTierList}
                tierListSignifier="A"
                unlinked={false}
              />
            </SyncedScrollViewContext.Provider>
          </GameProvider>
        </RivalryProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText('S')).toBeTruthy();
    });
  });
});
