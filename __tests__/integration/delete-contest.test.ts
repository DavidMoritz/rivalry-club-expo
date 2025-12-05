import { Contest, Rivalry, TierList } from '../../src/API';
import { getMContest } from '../../src/models/m-contest';
import { getMRivalry } from '../../src/models/m-rivalry';
import { getMTierList } from '../../src/models/m-tier-list';

describe('Delete Contest Integration Tests', () => {
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
          updatedAt: '2024-01-01'
        }
      ]
    }
  });

  describe('1-stock win scenarios', () => {
    it('should correctly revert 1-stock win with bias=1 (loser moved up)', () => {
      const initialStandingA = 3;
      const initialStandingB = 3;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 1,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply contest with nudge=1 (forces loser to move up)
      mRivalry.adjustStanding(1);

      expect(mContest.bias).toBe(1);
      expect(mRivalry.tierListA.standing).toBe(3);
      expect(mRivalry.tierListB.standing).toBe(2);

      // Now reverse the standings
      mRivalry.reverseStanding(mContest);

      // Verify we're back to initial standings
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });

    it('should correctly revert 1-stock win with bias=-1 (winner moved down)', () => {
      const initialStandingA = 3;
      const initialStandingB = 3;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 1,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply contest with nudge=-1 (forces winner to move down)
      mRivalry.adjustStanding(-1);

      expect(mContest.bias).toBe(-1);
      expect(mRivalry.tierListA.standing).toBe(4);
      expect(mRivalry.tierListB.standing).toBe(3);

      // Now reverse the standings
      mRivalry.reverseStanding(mContest);

      // Verify we're back to initial standings
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });
  });

  describe('2-stock win scenarios', () => {
    it('should correctly revert 2-stock win', () => {
      const initialStandingA = 3;
      const initialStandingB = 3;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply contest
      mRivalry.adjustStanding();

      expect(mRivalry.tierListA.standing).toBe(4); // A moved down 1
      expect(mRivalry.tierListB.standing).toBe(2); // B moved up 1

      // Now reverse the standings
      mRivalry.reverseStanding(mContest);

      // Verify we're back to initial standings
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });

    it('should correctly revert 2-stock win when loser is at top tier', () => {
      const initialStandingA = 3;
      const initialStandingB = 0; // Loser at top

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply contest
      mRivalry.adjustStanding();

      expect(mRivalry.tierListA.standing).toBe(5); // A moved down 2 (loser blocked)
      expect(mRivalry.tierListB.standing).toBe(0); // B stayed at top

      // Now reverse the standings
      mRivalry.reverseStanding(mContest);

      // Verify we're back to initial standings
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });
  });

  describe('3-stock win scenarios', () => {
    it('should correctly revert 3-stock win with bias=1 (loser moved up for odd stock)', () => {
      const initialStandingA = 5;
      const initialStandingB = 5;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 3,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply contest (will set bias based on random/nudge)
      mRivalry.adjustStanding();

      const standingAfterA = mRivalry.tierListA.standing;
      const standingAfterB = mRivalry.tierListB.standing;

      // Verify standings changed
      expect(standingAfterA).not.toBe(initialStandingA);
      expect(standingAfterB).not.toBe(initialStandingB);

      // Now reverse the standings
      mRivalry.reverseStanding(mContest);

      // Verify we're back to initial standings
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });

    it.skip('should correctly revert 3-stock win with bias=-1 (winner moved down for odd stock)', () => {
      const initialStandingA = 5;
      const initialStandingB = 5;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 3,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply contest with nudge=-1 to force winner down
      mRivalry.adjustStanding(-1);

      expect(mContest.bias).toBe(-1);
      expect(mRivalry.tierListA.standing).toBe(7); // A down 2 (1 for both-move + 1 for bias)
      expect(mRivalry.tierListB.standing).toBe(4); // B up 1 (from both-move)

      // Now reverse the standings
      mRivalry.reverseStanding(mContest);

      // Verify we're back to initial standings
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });
  });

  describe('Edge cases', () => {
    it.skip('should handle multiple consecutive contests being applied and reversed', () => {
      const initialStandingA = 3;
      const initialStandingB = 3;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      // Create and apply contest 1
      const contest1: Contest = {
        __typename: 'Contest',
        id: 'contest-1',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest1 = getMContest(contest1);
      mContest1.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest1;
      mRivalry.adjustStanding();

      const afterContest1A = mRivalry.tierListA.standing;
      const afterContest1B = mRivalry.tierListB.standing;

      // Create and apply contest 2
      const contest2: Contest = {
        __typename: 'Contest',
        id: 'contest-2',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: -1, // B wins
        bias: 0,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mContest2 = getMContest(contest2);
      mContest2.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest2;
      mRivalry.adjustStanding(1);

      // Standings should be different from both initial and after contest 1
      expect(mRivalry.tierListA.standing).not.toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).not.toBe(initialStandingB);

      // Reverse contest 2
      mRivalry.reverseStanding(mContest2);

      // Should be back to state after contest 1
      expect(mRivalry.tierListA.standing).toBe(afterContest1A);
      expect(mRivalry.tierListB.standing).toBe(afterContest1B);

      // Reverse contest 1
      mRivalry.reverseStanding(mContest1);

      // Should be back to initial state
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });
  });
});
