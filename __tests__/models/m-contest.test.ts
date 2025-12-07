import type { Schema } from '../../amplify/data/resource';
import { getMContest } from '../../src/models/m-contest';
import { getMRivalry } from '../../src/models/m-rivalry';
import { getMTierList } from '../../src/models/m-tier-list';
import { getMUser } from '../../src/models/m-user';
import { TestContest, TestTierList } from '../test-helpers';

type Contest = Schema['Contest']['type'];
type User = Schema['User']['type'];

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

  const createMockUser = (id: string, firstName: string, lastName: string): User => ({
    id,
    email: `${firstName.toLowerCase()}@test.com`,
    firstName,
    lastName,
    role: 1,
    awsSub: `aws-${id}`,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  });

  describe('getMContest', () => {
    it('should create an MContest from a Contest object', () => {
      const mContest = getMContest(mockContest as Contest);

      expect(mContest).toBeDefined();
      expect(mContest.id).toBe(mockContest.id);
      expect(mContest.result).toBe(mockContest.result);
    });

    it('should return baseContest', () => {
      const mContest = getMContest(mockContest as Contest);

      expect(mContest.baseContest).toEqual(mockContest);
    });

    it('should initialize with undefined rivalry and tier slots', () => {
      const mContest = getMContest(mockContest as Contest);

      expect(mContest.rivalry).toBeUndefined();
      expect(mContest.tierSlotA).toBeUndefined();
      expect(mContest.tierSlotB).toBeUndefined();
    });
  });

  describe('getWinner and getLoser', () => {
    it('should return undefined winner/loser when result is null', () => {
      const contest = getMContest({ ...mockContest, result: null } as Contest);

      expect(contest.getWinner()).toBeUndefined();
      expect(contest.getLoser()).toBeUndefined();
    });

    it('should return undefined winner/loser when result is 0', () => {
      const contest = getMContest({ ...mockContest, result: 0 } as Contest);

      expect(contest.getWinner()).toBeUndefined();
      expect(contest.getLoser()).toBeUndefined();
    });

    it('should identify winner as A when result is positive', () => {
      const contest = getMContest({ ...mockContest, result: 2 } as Contest);
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

      mockRivalry.userA = getMUser({ user: createMockUser('user-a', 'Alice', 'Anderson') });
      mockRivalry.userB = getMUser({ user: createMockUser('user-b', 'Bob', 'Brown') });

      contest.rivalry = mockRivalry;

      const winner = contest.getWinner();
      const loser = contest.getLoser();

      expect(winner?.user?.id).toBe('user-a');
      expect(loser?.user?.id).toBe('user-b');
    });

    it('should identify winner as B when result is negative', () => {
      const contest = getMContest({ ...mockContest, result: -2 } as Contest);
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

      mockRivalry.userA = getMUser({ user: createMockUser('user-a', 'Alice', 'Anderson') });
      mockRivalry.userB = getMUser({ user: createMockUser('user-b', 'Bob', 'Brown') });

      contest.rivalry = mockRivalry;

      const winner = contest.getWinner();
      const loser = contest.getLoser();

      expect(winner?.user?.id).toBe('user-b');
      expect(loser?.user?.id).toBe('user-a');
    });
  });

  describe('getDetailsA and getDetailsB', () => {
    it('should return participant details with all properties', () => {
      const contest = getMContest(mockContest as Contest);
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
      expect(detailsA).toHaveProperty('fighterId');
      expect(detailsA).toHaveProperty('tierList');
      expect(detailsA).toHaveProperty('tierSlot');
      expect(detailsB).toHaveProperty('user');
      expect(detailsB).toHaveProperty('fighterId');
      expect(detailsB).toHaveProperty('tierList');
      expect(detailsB).toHaveProperty('tierSlot');
    });

    it('should return undefined fighterId when tier slots are not set', () => {
      const contest = getMContest(mockContest as Contest);
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

      expect(detailsA.fighterId).toBeUndefined();
      expect(detailsB.fighterId).toBeUndefined();
    });
  });

  describe('setRivalryAndSlots', () => {
    const createMockTierList = (userId: string, slotId: string): TestTierList => ({
      id: `tier-list-${userId}`,
      rivalryId: 'rivalry-123',
      userId,
      standing: 0,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      tierSlots: {
        items: [
          {
            id: slotId,
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

    it('should set rivalry and find matching tier slots', () => {
      const contest = getMContest(mockContest as Contest);

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

      mockRivalry.tierListA = getMTierList(createMockTierList('user-a', 'slot-a-123'));
      mockRivalry.tierListB = getMTierList(createMockTierList('user-b', 'slot-b-123'));

      contest.setRivalryAndSlots(mockRivalry);

      expect(contest.rivalry).toBe(mockRivalry);
      expect(contest.tierSlotA?.id).toBe('slot-a-123');
      expect(contest.tierSlotB?.id).toBe('slot-b-123');
    });

    it('should handle case when tier slots are not found', () => {
      const contest = getMContest({
        ...mockContest,
        tierSlotAId: 'non-existent-a',
        tierSlotBId: 'non-existent-b',
      } as Contest);

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

      mockRivalry.tierListA = getMTierList(createMockTierList('user-a', 'slot-a-123'));
      mockRivalry.tierListB = getMTierList(createMockTierList('user-b', 'slot-b-123'));

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      contest.setRivalryAndSlots(mockRivalry);

      expect(contest.rivalry).toBe(mockRivalry);
      expect(contest.tierSlotA).toBeUndefined();
      expect(contest.tierSlotB).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[MContest] Failed to find tier slots for contest:',
        contest.id
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
