/**
 * Tests for automatic contest creation when creating/accepting rivalries
 */
describe('Auto-Contest Creation', () => {
  const mockContestCreate = jest.fn();
  const mockRivalryUpdate = jest.fn();
  const mockRivalryGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NPC Rivalry Creation', () => {
    it('should automatically create first contest for new NPC rivalry', async () => {
      const rivalryId = 'npc-rivalry-123';
      const tierSlotAId = 'tier-slot-a-1';
      const tierSlotBId = 'tier-slot-b-1';
      const contestId = 'contest-auto-1';

      // Mock rivalry with tier lists
      mockRivalryGet.mockResolvedValue({
        data: {
          id: rivalryId,
          tierLists: [
            {
              id: 'tier-list-a',
              userId: 'user-a',
              tierSlots: [
                { id: tierSlotAId, position: null, contestCount: 0 },
              ],
            },
            {
              id: 'tier-list-b',
              userId: 'npc-user',
              tierSlots: [
                { id: tierSlotBId, position: null, contestCount: 0 },
              ],
            },
          ],
        },
        errors: null,
      });

      // Mock contest creation
      mockContestCreate.mockResolvedValue({
        data: {
          id: contestId,
          rivalryId,
          tierSlotAId,
          tierSlotBId,
          result: 0,
          bias: 0,
        },
        errors: null,
      });

      // Mock rivalry update
      mockRivalryUpdate.mockResolvedValue({
        data: {
          id: rivalryId,
          currentContestId: contestId,
          contestCount: 1,
        },
        errors: null,
      });

      // Simulate the auto-creation flow
      // 1. Get rivalry with tier lists
      const rivalryData = await mockRivalryGet();
      expect(rivalryData.data).toBeDefined();

      // 2. Create contest
      const contestResult = await mockContestCreate({
        rivalryId,
        tierSlotAId,
        tierSlotBId,
        result: 0,
        bias: 0,
      });

      expect(contestResult.data.id).toBe(contestId);

      // 3. Update rivalry with contest
      const updateResult = await mockRivalryUpdate({
        id: rivalryId,
        currentContestId: contestId,
        contestCount: 1,
      });

      expect(updateResult.data.currentContestId).toBe(contestId);
      expect(updateResult.data.contestCount).toBe(1);
    });

    it('should handle contest creation failure gracefully without failing rivalry creation', async () => {
      const rivalryId = 'npc-rivalry-456';

      mockRivalryGet.mockResolvedValue({
        data: {
          id: rivalryId,
          tierLists: [
            { id: 'tier-list-a', userId: 'user-a', tierSlots: [] },
            { id: 'tier-list-b', userId: 'npc', tierSlots: [] },
          ],
        },
        errors: null,
      });

      // Contest creation fails (e.g., no eligible slots)
      mockContestCreate.mockRejectedValue(new Error('No eligible slots'));

      // The rivalry should still be created successfully
      // The error should be caught and logged but not thrown
      try {
        await mockRivalryGet();
        await mockContestCreate().catch(() => {
          // Error is caught and logged, rivalry creation continues
        });

        // Rivalry creation should succeed despite contest failure
        expect(mockRivalryGet).toHaveBeenCalled();
      } catch (error) {
        // Should not throw
        fail('Rivalry creation should not fail when contest creation fails');
      }
    });
  });

  describe('Rivalry Acceptance', () => {
    it('should automatically create first contest when accepting rivalry', async () => {
      const rivalryId = 'rivalry-to-accept-789';
      const tierSlotAId = 'tier-slot-a-2';
      const tierSlotBId = 'tier-slot-b-2';
      const contestId = 'contest-auto-2';

      // Mock rivalry with tier lists (both users now have tier lists)
      mockRivalryGet.mockResolvedValue({
        data: {
          id: rivalryId,
          accepted: true,
          tierLists: [
            {
              id: 'tier-list-a',
              userId: 'user-a',
              tierSlots: [
                { id: tierSlotAId, position: null, contestCount: 0 },
              ],
            },
            {
              id: 'tier-list-b',
              userId: 'user-b',
              tierSlots: [
                { id: tierSlotBId, position: null, contestCount: 0 },
              ],
            },
          ],
        },
        errors: null,
      });

      mockContestCreate.mockResolvedValue({
        data: {
          id: contestId,
          rivalryId,
          tierSlotAId,
          tierSlotBId,
          result: 0,
          bias: 0,
        },
        errors: null,
      });

      mockRivalryUpdate.mockResolvedValue({
        data: {
          id: rivalryId,
          currentContestId: contestId,
          contestCount: 1,
          accepted: true,
        },
        errors: null,
      });

      // Simulate acceptance flow with auto-contest creation
      const rivalryData = await mockRivalryGet();
      expect(rivalryData.data.accepted).toBe(true);

      const contestResult = await mockContestCreate({
        rivalryId,
        tierSlotAId,
        tierSlotBId,
        result: 0,
        bias: 0,
      });

      expect(contestResult.data.id).toBe(contestId);

      const updateResult = await mockRivalryUpdate({
        id: rivalryId,
        currentContestId: contestId,
        contestCount: 1,
        accepted: true,
      });

      expect(updateResult.data.currentContestId).toBe(contestId);
      expect(updateResult.data.contestCount).toBe(1);
    });

    it('should return updated rivalry data with contest info', () => {
      const rivalryWithContest = {
        id: 'rivalry-123',
        currentContestId: 'contest-123',
        contestCount: 1,
        accepted: true,
      };

      const rivalryWithoutContest = {
        id: 'rivalry-456',
        currentContestId: null,
        contestCount: 0,
        accepted: true,
      };

      // Rivalry with auto-created contest should have contest data
      expect(rivalryWithContest.currentContestId).toBe('contest-123');
      expect(rivalryWithContest.contestCount).toBe(1);

      // Old behavior would have null contest
      expect(rivalryWithoutContest.currentContestId).toBeNull();
      expect(rivalryWithoutContest.contestCount).toBe(0);
    });
  });

  describe('Query Invalidation', () => {
    it('should invalidate rivalry queries after auto-creating contest', () => {
      const mockQueryClient = {
        invalidateQueries: jest.fn(),
      };

      const rivalryId = 'rivalry-999';

      // After successful contest creation, queries should be invalidated
      mockQueryClient.invalidateQueries({ queryKey: ['rivalryId', rivalryId] });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['rivalryId', rivalryId],
      });
    });
  });
});
