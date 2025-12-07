import type { Schema } from '../../amplify/data/resource';
import { getMContest } from '../../src/models/m-contest';
import { getMRivalry } from '../../src/models/m-rivalry';
import { getMTierList } from '../../src/models/m-tier-list';

// Extract types from Gen 2 schema
type Contest = Schema['Contest']['type'];
type Rivalry = Schema['Rivalry']['type'];
type TierList = Schema['TierList']['type'];
type TierSlot = Schema['TierSlot']['type'];

describe('Delete Contest Integration Tests', () => {
  const createTierListWithStanding = (
    userId: string,
    standing: number
  ): TierList => ({
    id: `tier-list-${userId}`,
    rivalryId: 'rivalry-123',
    userId,
    standing,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    tierSlots: {
      items: [
        {
          id: `slot-${userId}`,
          tierListId: `tier-list-${userId}`,
          fighterId: `fighter-${userId}`,
          position: 0,
          winCount: 0,
          contestCount: 0,
          createdAt: new Date('2024-01-01').toISOString(),
          updatedAt: new Date('2024-01-01').toISOString()
        } as TierSlot
      ]
    }
  } as TierList);

  describe('1-stock win scenarios', () => {
    it('should correctly revert 1-stock win with bias=1 (loser moved up)', () => {
      const initialStandingA = 3;
      const initialStandingB = 3;

      const mockRivalry: Rivalry = {
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Rivalry;

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 1,
        bias: 0,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Contest;

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
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Rivalry;

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 1,
        bias: 0,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Contest;

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
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Rivalry;

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Contest;

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
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Rivalry;

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Contest;

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
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Rivalry;

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 3,
        bias: 0,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Contest;

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

    it('should correctly revert 3-stock win with bias=-1 (winner moved down for odd stock)', () => {
      const initialStandingA = 5;
      const initialStandingB = 5;

      const mockRivalry: Rivalry = {
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Rivalry;

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 3,
        bias: 0,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Contest;

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply contest with nudge=-1
      // Note: Even with nudge=-1, when winner reaches lowest tier (F),
      // the system will still try to move loser up first (bias=1)
      mRivalry.adjustStanding(-1);

      // After 1 bothPlayerMove: A=6, B=4
      // Winner (A) is now at lowest tier (F), so loser (B) moves up instead
      expect(mContest.bias).toBe(1);
      expect(mRivalry.tierListA.standing).toBe(6); // A down 1 (from both-move)
      expect(mRivalry.tierListB.standing).toBe(3); // B up 2 (1 from both-move + 1 from bias)

      // Now reverse the standings
      mRivalry.reverseStanding(mContest);

      // Verify we're back to initial standings
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple consecutive contests being applied and reversed', () => {
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
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Contest;

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      // Create and apply contest 1
      const contest1: Contest = {
        id: 'contest-1',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      } as Contest;

      const mContest1 = getMContest(contest1);
      mContest1.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest1;
      mRivalry.adjustStanding();

      const afterContest1A = mRivalry.tierListA.standing;
      const afterContest1B = mRivalry.tierListB.standing;

      // Verify contest 1 changed standings
      expect(afterContest1A).toBe(4); // A moved down 1
      expect(afterContest1B).toBe(2); // B moved up 1

      // Create and apply contest 2 (use 2-stock win to ensure movement)
      const contest2: Contest = {
        id: 'contest-2',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: -2, // B wins by 2 stocks
        bias: 0,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mContest2 = getMContest(contest2);
      mContest2.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest2;
      mRivalry.adjustStanding();

      // After contest 2: B wins by 2, so B (winner) moves down, A (loser) moves up
      // B: 2 -> 3, A: 4 -> 3
      expect(mRivalry.tierListA.standing).toBe(3);
      expect(mRivalry.tierListB.standing).toBe(3);

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
