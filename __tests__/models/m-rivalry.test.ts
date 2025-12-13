import type { Schema } from '../../amplify/data/resource';
import { getMContest } from '../../src/models/m-contest';
import { getMRivalry } from '../../src/models/m-rivalry';
import { getMTierList, TIERS } from '../../src/models/m-tier-list';
import { getMUser } from '../../src/models/m-user';

// Extract Gen 2 types
type Rivalry = Schema['Rivalry']['type'];
type Contest = Schema['Contest']['type'];
type TierList = Schema['TierList']['type'];
type User = Schema['User']['type'];

describe('MRivalry Model', () => {
  const mockRivalry: Rivalry = {
    __typename: 'Rivalry',
    id: 'rivalry-123',
    userAId: 'user-a',
    userBId: 'user-b',
    gameId: 'game-123',
    contestCount: 10,
    currentContestId: 'contest-current',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getMRivalry', () => {
    it('should create an MRivalry from a Rivalry object', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });

      expect(mRivalry).toBeDefined();
      expect(mRivalry.id).toBe(mockRivalry.id);
      expect(mRivalry.contestCount).toBe(mockRivalry.contestCount);
    });

    it('should return baseRivalry', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });

      expect(mRivalry.baseRivalry).toEqual(mockRivalry);
    });

    it('should initialize with empty contests and undefined properties', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });

      expect(mRivalry.mContests).toEqual([]);
      expect(mRivalry.currentContest).toBeUndefined();
      expect(mRivalry.tierListA).toBeUndefined();
      expect(mRivalry.tierListB).toBeUndefined();
    });
  });

  describe('displayTitle', () => {
    it('should return formatted title with user names', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });

      mRivalry.userA = getMUser({
        user: {
          __typename: 'User',
          id: 'user-a',
          email: 'alice@test.com',
          firstName: 'Alice',
          lastName: 'Anderson',
          role: 1,
          awsSub: 'aws-a',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      mRivalry.userB = getMUser({
        user: {
          __typename: 'User',
          id: 'user-b',
          email: 'bob@test.com',
          firstName: 'Bob',
          lastName: 'Brown',
          role: 1,
          awsSub: 'aws-b',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      expect(mRivalry.displayTitle()).toBe('Alice vs. Bob');
    });
  });

  describe('fighterMoves', () => {
    it('should calculate fighter moves based on result', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      const contest = getMContest({
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-a',
        tierSlotBId: 'slot-b',
        result: 2,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      mRivalry.currentContest = contest;

      expect(mRivalry.fighterMoves()).toBe(6); // 2 stocks * 3 moves per stock
    });

    it('should handle negative results', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      const contest = getMContest({
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-a',
        tierSlotBId: 'slot-b',
        result: -3,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      mRivalry.currentContest = contest;

      expect(mRivalry.fighterMoves()).toBe(9); // 3 stocks * 3 moves per stock
    });
  });

  describe('setCurrentContest', () => {
    it('should set current contest and add to contests list', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      const contest = getMContest({
        __typename: 'Contest',
        id: 'contest-new',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-a',
        tierSlotBId: 'slot-b',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      mRivalry.setCurrentContest(contest);

      expect(mRivalry.currentContest).toBe(contest);
      expect(mRivalry.currentContestId).toBe('contest-new');
      expect(mRivalry.mContests[0]).toBe(contest);
    });
  });

  describe('setMContests', () => {
    it('should set contests from connection', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      const contestConnection = {
        __typename: 'ModelContestConnection' as const,
        items: [
          {
            __typename: 'Contest' as const,
            id: 'contest-1',
            rivalryId: 'rivalry-123',
            tierSlotAId: 'slot-a',
            tierSlotBId: 'slot-b',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          {
            __typename: 'Contest' as const,
            id: 'contest-current',
            rivalryId: 'rivalry-123',
            tierSlotAId: 'slot-a',
            tierSlotBId: 'slot-b',
            createdAt: '2024-01-02',
            updatedAt: '2024-01-02',
          },
        ],
      };

      mRivalry.setMContests(contestConnection);

      expect(mRivalry.mContests).toHaveLength(2);
      expect(mRivalry.currentContest?.id).toBe('contest-current');
    });

    it('should handle null items in connection', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      const contestConnection = {
        __typename: 'ModelContestConnection' as const,
        items: [
          {
            __typename: 'Contest' as const,
            id: 'contest-1',
            rivalryId: 'rivalry-123',
            tierSlotAId: 'slot-a',
            tierSlotBId: 'slot-b',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          null,
        ],
      };

      mRivalry.setMContests(contestConnection);

      expect(mRivalry.mContests).toHaveLength(1);
    });
  });

  describe('setMTierLists', () => {
    it('should set tier lists from connection', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      const tierListConnection = {
        __typename: 'ModelTierListConnection' as const,
        items: [
          {
            __typename: 'TierList' as const,
            id: 'tier-list-a',
            rivalryId: 'rivalry-123',
            userId: 'user-a',
            standing: 0,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            tierSlots: {
              __typename: 'ModelTierSlotConnection' as const,
              items: [],
            },
          },
          {
            __typename: 'TierList' as const,
            id: 'tier-list-b',
            rivalryId: 'rivalry-123',
            userId: 'user-b',
            standing: 1,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            tierSlots: {
              __typename: 'ModelTierSlotConnection' as const,
              items: [],
            },
          },
        ],
      };

      mRivalry.setMTierLists(tierListConnection);

      expect(mRivalry.tierListA?.id).toBe('tier-list-a');
      expect(mRivalry.tierListB?.id).toBe('tier-list-b');
      expect(mRivalry.tierListA?.rivalry).toBe(mRivalry);
    });
  });

  describe('adjustStanding', () => {
    const createTierListWithStanding = (
      userId: string,
      standing: number
    ): TierList => ({
      __typename: 'TierList',
      id: `tier-list-${userId}`,
      rivalryId: 'rivalry-123',
      userId,
      standing,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      tierSlots: {
        __typename: 'ModelTierSlotConnection',
        items: [
          {
            __typename: 'TierSlot',
            id: `slot-${userId}`,
            tierListId: `tier-list-${userId}`,
            fighterId: `fighter-${userId}`,
            position: 0,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      },
    });

    it('should adjust standings for 2-stock win', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', 3)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', 3)
      );

      const contest = getMContest({
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      contest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = contest;

      mRivalry.adjustStanding();

      // Winner moves down 1, loser moves up 1 (for 2 stocks)
      expect(mRivalry.tierListA?.standing).toBe(4); // moved down
      expect(mRivalry.tierListB?.standing).toBe(2); // moved up
    });

    it('should handle loser at top tier', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', 3)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', 0)
      );

      const contest = getMContest({
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      contest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = contest;

      mRivalry.adjustStanding();

      // Loser can't move up, so winner moves down twice
      expect(mRivalry.tierListA?.standing).toBe(5); // moved down 2
      expect(mRivalry.tierListB?.standing).toBe(0); // stayed at top
    });

    it('should handle prestige adjustment', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', 14)
      ); // prestige 2
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', 14)
      ); // prestige 2

      const contest = getMContest({
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      contest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = contest;

      mRivalry.adjustStanding();

      // Both should lose prestige
      expect(mRivalry.tierListA?.standing).toBe(8); // 15 - 7 = 8
      expect(mRivalry.tierListB?.standing).toBe(6); // 13 - 7 = 6
    });

    it('should not adjust if contest or tier lists are missing', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });

      mRivalry.adjustStanding();

      // Should not throw and should exit early
      expect(mRivalry.tierListA).toBeUndefined();
    });
  });

  describe('reverseStanding', () => {
    const createTierListWithStanding = (
      userId: string,
      standing: number
    ): TierList => ({
      __typename: 'TierList',
      id: `tier-list-${userId}`,
      rivalryId: 'rivalry-123',
      userId,
      standing,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      tierSlots: {
        __typename: 'ModelTierSlotConnection',
        items: [
          {
            __typename: 'TierSlot',
            id: `slot-${userId}`,
            tierListId: `tier-list-${userId}`,
            fighterId: `fighter-${userId}`,
            position: 0,
            winCount: 0,
            contestCount: 0,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      },
    });

    describe('1-stock win reversal', () => {
      it('should reverse 1-stock win with positive nudge (bias=1)', () => {
        const mRivalry = getMRivalry({ rivalry: mockRivalry });
        const initialStandingA = 3;
        const initialStandingB = 3;

        mRivalry.tierListA = getMTierList(
          createTierListWithStanding('user-a', initialStandingA)
        );
        mRivalry.tierListB = getMTierList(
          createTierListWithStanding('user-b', initialStandingB)
        );

        const contest = getMContest({
          __typename: 'Contest',
          id: 'contest-123',
          rivalryId: 'rivalry-123',
          tierSlotAId: 'slot-user-a',
          tierSlotBId: 'slot-user-b',
          result: 1, // A wins by 1 stock
          bias: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as any);

        contest.setRivalryAndSlots(mRivalry);
        mRivalry.currentContest = contest;

        // Apply standing with nudge=1 to force loser to move up
        mRivalry.adjustStanding(1);

        // With 1-stock win and nudge=1, only loser (B) moves up
        expect(mRivalry.tierListA?.standing).toBe(initialStandingA); // Winner stays
        expect(mRivalry.tierListB?.standing).toBe(initialStandingB - 1); // Loser moves up
        expect(contest.bias).toBe(1);

        // Reverse standing
        mRivalry.reverseStanding(contest);

        // Verify we're back to initial
        expect(mRivalry.tierListA?.standing).toBe(initialStandingA);
        expect(mRivalry.tierListB?.standing).toBe(initialStandingB);
      });

      it('should reverse 1-stock win with negative nudge (bias=-1)', () => {
        const mRivalry = getMRivalry({ rivalry: mockRivalry });
        const initialStandingA = 3;
        const initialStandingB = 3;

        mRivalry.tierListA = getMTierList(
          createTierListWithStanding('user-a', initialStandingA)
        );
        mRivalry.tierListB = getMTierList(
          createTierListWithStanding('user-b', initialStandingB)
        );

        const contest = getMContest({
          __typename: 'Contest',
          id: 'contest-123',
          rivalryId: 'rivalry-123',
          tierSlotAId: 'slot-user-a',
          tierSlotBId: 'slot-user-b',
          result: 1, // A wins by 1 stock
          bias: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as any);

        contest.setRivalryAndSlots(mRivalry);
        mRivalry.currentContest = contest;

        // Apply standing with nudge=-1 to force winner to move down
        mRivalry.adjustStanding(-1);

        // With 1-stock win and nudge=-1, only winner (A) moves down
        expect(mRivalry.tierListA?.standing).toBe(initialStandingA + 1); // Winner moves down
        expect(mRivalry.tierListB?.standing).toBe(initialStandingB); // Loser stays
        expect(contest.bias).toBe(-1);

        // Reverse standing
        mRivalry.reverseStanding(contest);

        // Verify we're back to initial
        expect(mRivalry.tierListA?.standing).toBe(initialStandingA);
        expect(mRivalry.tierListB?.standing).toBe(initialStandingB);
      });
    });

    describe('2-stock win reversal', () => {
      it('should correctly reverse 2-stock win', () => {
        const mRivalry = getMRivalry({ rivalry: mockRivalry });
        const initialStandingA = 3;
        const initialStandingB = 3;

        mRivalry.tierListA = getMTierList(
          createTierListWithStanding('user-a', initialStandingA)
        );
        mRivalry.tierListB = getMTierList(
          createTierListWithStanding('user-b', initialStandingB)
        );

        const contest = getMContest({
          __typename: 'Contest',
          id: 'contest-123',
          rivalryId: 'rivalry-123',
          tierSlotAId: 'slot-user-a',
          tierSlotBId: 'slot-user-b',
          result: 2, // A wins by 2 stocks
          bias: 0, // No bias for even stock count
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as any);

        contest.setRivalryAndSlots(mRivalry);
        mRivalry.currentContest = contest;

        // Apply standing
        mRivalry.adjustStanding();

        // Verify standings changed
        expect(mRivalry.tierListA?.standing).not.toBe(initialStandingA);
        expect(mRivalry.tierListB?.standing).not.toBe(initialStandingB);

        // Reverse standing
        mRivalry.reverseStanding(contest);

        // Verify we're back to initial
        expect(mRivalry.tierListA?.standing).toBe(initialStandingA);
        expect(mRivalry.tierListB?.standing).toBe(initialStandingB);
      });

      it('should correctly reverse 2-stock win when loser is at top tier', () => {
        const mRivalry = getMRivalry({ rivalry: mockRivalry });
        const initialStandingA = 3;
        const initialStandingB = 0; // At top tier

        mRivalry.tierListA = getMTierList(
          createTierListWithStanding('user-a', initialStandingA)
        );
        mRivalry.tierListB = getMTierList(
          createTierListWithStanding('user-b', initialStandingB)
        );

        const contest = getMContest({
          __typename: 'Contest',
          id: 'contest-123',
          rivalryId: 'rivalry-123',
          tierSlotAId: 'slot-user-a',
          tierSlotBId: 'slot-user-b',
          result: 2, // A wins by 2 stocks
          bias: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as any);

        contest.setRivalryAndSlots(mRivalry);
        mRivalry.currentContest = contest;

        // Apply standing
        mRivalry.adjustStanding();

        // Verify standings changed
        expect(mRivalry.tierListA?.standing).not.toBe(initialStandingA);
        expect(mRivalry.tierListB?.standing).toBe(initialStandingB); // Stayed at top

        // Reverse standing
        mRivalry.reverseStanding(contest);

        // Verify we're back to initial
        expect(mRivalry.tierListA?.standing).toBe(initialStandingA);
        expect(mRivalry.tierListB?.standing).toBe(initialStandingB);
      });
    });

    describe('3-stock win reversal', () => {
      it('should correctly reverse 3-stock win with bias=1', () => {
        const mRivalry = getMRivalry({ rivalry: mockRivalry });
        const initialStandingA = 5;
        const initialStandingB = 5;

        mRivalry.tierListA = getMTierList(
          createTierListWithStanding('user-a', initialStandingA)
        );
        mRivalry.tierListB = getMTierList(
          createTierListWithStanding('user-b', initialStandingB)
        );

        const contest = getMContest({
          __typename: 'Contest',
          id: 'contest-123',
          rivalryId: 'rivalry-123',
          tierSlotAId: 'slot-user-a',
          tierSlotBId: 'slot-user-b',
          result: 3, // A wins by 3 stocks
          bias: 1, // Loser moved up for the odd stock
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as any);

        contest.setRivalryAndSlots(mRivalry);
        mRivalry.currentContest = contest;

        // Apply standing
        mRivalry.adjustStanding();
        const standingAfterA = mRivalry.tierListA?.standing;
        const standingAfterB = mRivalry.tierListB?.standing;

        // 3 stocks = 1 move where both move + 1 additional move
        // Both move: A down 1, B up 1
        // Additional: B up 1 (bias=1)
        expect(standingAfterA).toBe(initialStandingA + 1); // Down 1
        expect(standingAfterB).toBe(initialStandingB - 2); // Up 2

        // Reverse standing
        mRivalry.reverseStanding(contest);

        expect(mRivalry.tierListA?.standing).toBe(initialStandingA);
        expect(mRivalry.tierListB?.standing).toBe(initialStandingB);
      });

      it('should correctly reverse 3-stock win with bias=-1', () => {
        const mRivalry = getMRivalry({ rivalry: mockRivalry });
        // Use standing=2 to avoid hitting the lowest tier boundary
        const initialStandingA = 2;
        const initialStandingB = 2;

        mRivalry.tierListA = getMTierList(
          createTierListWithStanding('user-a', initialStandingA)
        );
        mRivalry.tierListB = getMTierList(
          createTierListWithStanding('user-b', initialStandingB)
        );

        const contest = getMContest({
          __typename: 'Contest',
          id: 'contest-123',
          rivalryId: 'rivalry-123',
          tierSlotAId: 'slot-user-a',
          tierSlotBId: 'slot-user-b',
          result: 3, // A wins by 3 stocks
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as any);

        contest.setRivalryAndSlots(mRivalry);
        mRivalry.currentContest = contest;

        // Apply standing with nudge=-1 to force winner down
        mRivalry.adjustStanding(-1);
        const standingAfterA = mRivalry.tierListA?.standing;
        const standingAfterB = mRivalry.tierListB?.standing;

        // 3 stocks = 1 move where both move + 1 additional move
        // Both move: A down 1 (2→3), B up 1 (2→1)
        // Additional: A down 1 more (3→4) since nudge=-1 and winner not at lowest tier
        expect(contest.bias).toBe(-1);
        expect(standingAfterA).toBe(initialStandingA + 2); // Down 2 (2→4)
        expect(standingAfterB).toBe(initialStandingB - 1); // Up 1 (2→1)

        // Reverse standing
        mRivalry.reverseStanding(contest);

        expect(mRivalry.tierListA?.standing).toBe(initialStandingA);
        expect(mRivalry.tierListB?.standing).toBe(initialStandingB);
      });
    });

    it('should not reverse if contest or tier lists are missing', () => {
      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      const contest = getMContest({
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      } as any);

      mRivalry.reverseStanding(contest);

      // Should not throw and should exit early
      expect(mRivalry.tierListA).toBeUndefined();
    });
  });
});
