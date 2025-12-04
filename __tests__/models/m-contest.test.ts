import { getMContest } from '../../src/models/m-contest';
import { getMRivalry } from '../../src/models/m-rivalry';
import { getMTierList } from '../../src/models/m-tier-list';
import { getMUser } from '../../src/models/m-user';
import { TestContest, TestRivalry, TestTierList } from '../test-helpers';

describe('MContest Model', () => {
  const mockContest: TestContest = {
    id: 'contest-123',
    rivalryId: 'rivalry-123',
    tierSlotAId: 'slot-a-123',
    tierSlotBId: 'slot-b-123',
    result: 2,
    bias: 0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getMContest', () => {
    it('should create an MContest from a Contest object', () => {
      const mContest = getMContest(mockContest as any);

      expect(mContest).toBeDefined();
      expect(mContest.id).toBe(mockContest.id);
      expect(mContest.result).toBe(mockContest.result);
    });

    it('should return baseContest', () => {
      const mContest = getMContest(mockContest as any);

      expect(mContest.baseContest).toEqual(mockContest);
    });

    it('should initialize with undefined rivalry and tier slots', () => {
      const mContest = getMContest(mockContest as any);

      expect(mContest.rivalry).toBeUndefined();
      expect(mContest.tierSlotA).toBeUndefined();
      expect(mContest.tierSlotB).toBeUndefined();
    });
  });

  describe('getWinner and getLoser', () => {
    it('should return undefined winner/loser when result is null', () => {
      const contest = getMContest({ ...mockContest, result: null } as any);

      expect(contest.getWinner()).toBeUndefined();
      expect(contest.getLoser()).toBeUndefined();
    });

    it('should identify winner as A when result is positive', () => {
      const contest = getMContest({ ...mockContest, result: 2 } as any);
      const mockRivalry = getMRivalry({
        rivalry: {
          id: 'rivalry-123',
          userAId: 'user-a',
          userBId: 'user-b',
          gameId: 'game-123',
          contestCount: 10,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      mockRivalry.userA = getMUser({
        user: {
          id: 'user-a',
          email: 'a@test.com',
          firstName: 'Alice',
          lastName: 'Anderson',
          role: 1,
          awsSub: 'aws-a',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      mockRivalry.userB = getMUser({
        user: {
          id: 'user-b',
          email: 'b@test.com',
          firstName: 'Bob',
          lastName: 'Brown',
          role: 1,
          awsSub: 'aws-b',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      contest.rivalry = mockRivalry;

      const winner = contest.getWinner();
      const loser = contest.getLoser();

      expect(winner?.user?.id).toBe('user-a');
      expect(loser?.user?.id).toBe('user-b');
    });

    it('should identify winner as B when result is negative', () => {
      const contest = getMContest({ ...mockContest, result: -2 } as any);
      const mockRivalry = getMRivalry({
        rivalry: {
          id: 'rivalry-123',
          userAId: 'user-a',
          userBId: 'user-b',
          gameId: 'game-123',
          contestCount: 10,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      mockRivalry.userA = getMUser({
        user: {
          id: 'user-a',
          email: 'a@test.com',
          firstName: 'Alice',
          lastName: 'Anderson',
          role: 1,
          awsSub: 'aws-a',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      mockRivalry.userB = getMUser({
        user: {
          id: 'user-b',
          email: 'b@test.com',
          firstName: 'Bob',
          lastName: 'Brown',
          role: 1,
          awsSub: 'aws-b',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      contest.rivalry = mockRivalry;

      const winner = contest.getWinner();
      const loser = contest.getLoser();

      expect(winner?.user?.id).toBe('user-b');
      expect(loser?.user?.id).toBe('user-a');
    });
  });

  describe('getDetailsA and getDetailsB', () => {
    it('should return participant details', () => {
      const contest = getMContest(mockContest);
      const mockRivalry = getMRivalry({
        rivalry: {
          id: 'rivalry-123',
          userAId: 'user-a',
          userBId: 'user-b',
          gameId: 'game-123',
          contestCount: 10,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      contest.rivalry = mockRivalry;

      const detailsA = contest.getDetailsA();
      const detailsB = contest.getDetailsB();

      expect(detailsA).toHaveProperty('user');
      expect(detailsA).toHaveProperty('tierList');
      expect(detailsA).toHaveProperty('tierSlot');
      expect(detailsB).toHaveProperty('user');
      expect(detailsB).toHaveProperty('tierList');
      expect(detailsB).toHaveProperty('tierSlot');
    });
  });

  describe('setRivalryAndSlots', () => {
    it('should set rivalry and find matching tier slots', () => {
      const contest = getMContest(mockContest);

      const createMockTierList = (userId: string): TestTierList => ({
        id: `tier-list-${userId}`,
        rivalryId: 'rivalry-123',
        userId,
        standing: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        tierSlots: {
          items:
            userId === 'user-a'
              ? [
                  {
                    id: 'slot-a-123',
                    tierListId: 'tier-list-user-a',
                    fighterId: 'fighter-1',
                    position: 0,
                    winCount: 0,
                    contestCount: 0,
                    createdAt: '2024-01-01',
                    updatedAt: '2024-01-01',
                  },
                ]
              : [
                  {
                    id: 'slot-b-123',
                    tierListId: 'tier-list-user-b',
                    fighterId: 'fighter-2',
                    position: 0,
                    winCount: 0,
                    contestCount: 0,
                    createdAt: '2024-01-01',
                    updatedAt: '2024-01-01',
                  },
                ],
        },
      });

      const mockRivalry = getMRivalry({
        rivalry: {
          id: 'rivalry-123',
          userAId: 'user-a',
          userBId: 'user-b',
          gameId: 'game-123',
          contestCount: 10,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      mockRivalry.tierListA = getMTierList(createMockTierList('user-a'));
      mockRivalry.tierListB = getMTierList(createMockTierList('user-b'));

      contest.setRivalryAndSlots(mockRivalry);

      expect(contest.rivalry).toBe(mockRivalry);
      expect(contest.tierSlotA?.id).toBe('slot-a-123');
      expect(contest.tierSlotB?.id).toBe('slot-b-123');
    });
  });
});
