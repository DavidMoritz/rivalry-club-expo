import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { ContestRow } from '../ContestRow';
import { getMContest, MContest } from '../../../models/m-contest';
import { getMGame, MGame } from '../../../models/m-game';
import { getMRivalry, MRivalry } from '../../../models/m-rivalry';
import { getMTierList } from '../../../models/m-tier-list';

describe('ContestRow', () => {
  const mockGame: MGame = getMGame({
    id: 'game-1',
    name: 'Super Smash Bros. Ultimate',
    fighters: {
      items: [
        {
          id: 'fighter-1',
          name: 'Mario',
          gamePosition: 1,
        },
        {
          id: 'fighter-2',
          name: 'Link',
          gamePosition: 2,
        },
      ],
    },
  } as any);

  const mockTierListA = getMTierList({
    id: 'tierlist-1',
    userId: 'user-1',
    rivalryId: 'rivalry-1',
    standing: 0,
    slots: [
      {
        id: 'slot-1',
        fighterId: 'fighter-1',
        position: 0,
      },
    ],
  } as any);

  const mockTierListB = getMTierList({
    id: 'tierlist-2',
    userId: 'user-2',
    rivalryId: 'rivalry-1',
    standing: 0,
    slots: [
      {
        id: 'slot-2',
        fighterId: 'fighter-2',
        position: 0,
      },
    ],
  } as any);

  const mockRivalry: MRivalry = getMRivalry({
    rivalry: {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 1,
    } as any,
  });

  mockRivalry.tierListA = mockTierListA;
  mockRivalry.tierListB = mockTierListB;

  it.skip('renders contest with winner on left (positive result)', async () => {
    const contest: MContest = getMContest({
      id: 'contest-1',
      rivalryId: 'rivalry-1',
      tierSlotAId: 'slot-1',
      tierSlotBId: 'slot-2',
      result: 3,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    } as any);

    contest.setRivalryAndSlots(mockRivalry);

    render(<ContestRow contest={contest} game={mockGame} rivalry={mockRivalry} />);

    // Wait for the component to render with data from useEffect
    await waitFor(() => {
      expect(screen.getByText('3 - 0')).toBeTruthy();
    });

    // Check that the date is displayed (format: MM/DD or MM/DD/YYYY)
    await waitFor(() => {
      expect(screen.queryByText(/01\/15/)).toBeTruthy();
    });
  });

  it.skip('renders contest with winner on right (negative result)', async () => {
    const contest: MContest = getMContest({
      id: 'contest-1',
      rivalryId: 'rivalry-1',
      tierSlotAId: 'slot-1',
      tierSlotBId: 'slot-2',
      result: -2,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    } as any);

    contest.setRivalryAndSlots(mockRivalry);

    render(<ContestRow contest={contest} game={mockGame} rivalry={mockRivalry} />);

    // Check that the score is displayed correctly for negative result
    await waitFor(() => {
      expect(screen.getByText('0 - 2')).toBeTruthy();
    });
  });

  it('returns null when contest has no result', () => {
    const contest: MContest = getMContest({
      id: 'contest-1',
      rivalryId: 'rivalry-1',
      tierSlotAId: 'slot-1',
      tierSlotBId: 'slot-2',
      result: null,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    } as any);

    contest.setRivalryAndSlots(mockRivalry);

    const { toJSON } = render(
      <ContestRow contest={contest} game={mockGame} rivalry={mockRivalry} />
    );

    // Should render nothing
    expect(toJSON()).toBeNull();
  });

  it('returns null when fighters are not found', () => {
    const contest: MContest = getMContest({
      id: 'contest-1',
      rivalryId: 'rivalry-1',
      tierSlotAId: 'slot-999', // Non-existent slot
      tierSlotBId: 'slot-888', // Non-existent slot
      result: 3,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    } as any);

    contest.setRivalryAndSlots(mockRivalry);

    const { toJSON } = render(
      <ContestRow contest={contest} game={mockGame} rivalry={mockRivalry} />
    );

    // Should render nothing when fighters can't be found
    expect(toJSON()).toBeNull();
  });

  it.skip('formats date correctly for current year', async () => {
    const currentYear = new Date().getFullYear();
    const contest: MContest = getMContest({
      id: 'contest-1',
      rivalryId: 'rivalry-1',
      tierSlotAId: 'slot-1',
      tierSlotBId: 'slot-2',
      result: 1,
      createdAt: `${currentYear}-03-20T10:00:00Z`,
      updatedAt: `${currentYear}-03-20T10:00:00Z`,
    } as any);

    contest.setRivalryAndSlots(mockRivalry);

    render(<ContestRow contest={contest} game={mockGame} rivalry={mockRivalry} />);

    // Date should not include year if it's the current year
    await waitFor(() => {
      expect(screen.queryByText(/03\/20/)).toBeTruthy();
    });
  });

  it.skip('formats date with year for past years', async () => {
    const contest: MContest = getMContest({
      id: 'contest-1',
      rivalryId: 'rivalry-1',
      tierSlotAId: 'slot-1',
      tierSlotBId: 'slot-2',
      result: 1,
      createdAt: '2020-03-20T10:00:00Z',
      updatedAt: '2020-03-20T10:00:00Z',
    } as any);

    contest.setRivalryAndSlots(mockRivalry);

    render(<ContestRow contest={contest} game={mockGame} rivalry={mockRivalry} />);

    // Date should include year if it's not the current year
    await waitFor(() => {
      expect(screen.queryByText(/03\/20\/20/)).toBeTruthy();
    });
  });
});
