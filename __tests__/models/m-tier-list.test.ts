import { TierList, TierSlot } from '../../src/API';
import { getMTierList, TIERS } from '../../src/models/m-tier-list';

describe('MTierList Model', () => {
  const createMockTierSlots = (count: number): TierSlot[] => {
    return new Array(count).fill(null).map((_, i) => ({
      __typename: 'TierSlot' as const,
      id: `slot-${i}`,
      tierListId: 'tier-list-123',
      fighterId: `fighter-${i}`,
      position: i,
      contestCount: 0,
      winCount: 0,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }));
  };

  const mockTierList: TierList = {
    __typename: 'TierList',
    id: 'tier-list-123',
    rivalryId: 'rivalry-123',
    userId: 'user-123',
    standing: 0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    tierSlots: {
      __typename: 'ModelTierSlotConnection',
      items: createMockTierSlots(21), // 3 slots per tier * 7 tiers
    },
  };

  describe('getMTierList', () => {
    it('should create an MTierList from a TierList object', () => {
      const mTierList = getMTierList(mockTierList);

      expect(mTierList).toBeDefined();
      expect(mTierList.id).toBe(mockTierList.id);
      expect(mTierList.standing).toBe(mockTierList.standing);
    });

    it('should return baseTierList', () => {
      const mTierList = getMTierList(mockTierList);

      expect(mTierList.baseTierList).toEqual(mockTierList);
    });

    it('should convert tierSlots to MTierSlots', () => {
      const mTierList = getMTierList(mockTierList);

      expect(mTierList.slots).toHaveLength(21);
      expect(mTierList.slots[0]).toHaveProperty('baseTierSlot');
    });
  });

  describe('getCurrentTier', () => {
    it('should return tier 0 for standing 0', () => {
      const mTierList = getMTierList(mockTierList);

      expect(mTierList.getCurrentTier()).toBe(0);
    });

    it('should return tier 2 for standing 2', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 2 });

      expect(mTierList.getCurrentTier()).toBe(2);
    });

    it('should wrap around after 7 tiers (standing 7 = tier 0)', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 7 });

      expect(mTierList.getCurrentTier()).toBe(0);
    });

    it('should handle standing 14 (prestige 2, tier 0)', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 14 });

      expect(mTierList.getCurrentTier()).toBe(0);
    });
  });

  describe('title', () => {
    it('should return "S" for tier 0', () => {
      const mTierList = getMTierList(mockTierList);

      expect(mTierList.title).toBe('S');
    });

    it('should return "C" for tier 3', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 3 });

      expect(mTierList.title).toBe('C');
    });
  });

  describe('getPrestige', () => {
    it('should return 0 for standing 0-6', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 3 });

      expect(mTierList.getPrestige()).toBe(0);
    });

    it('should return 1 for standing 7-13', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 10 });

      expect(mTierList.getPrestige()).toBe(1);
    });

    it('should return 2 for standing 14-20', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 15 });

      expect(mTierList.getPrestige()).toBe(2);
    });
  });

  describe('prestigeDisplay', () => {
    it('should show no prestige for prestige 0', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 3 });

      expect(mTierList.prestigeDisplay).toBe('(C)');
    });

    it('should show + for prestige 1', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 8 });

      // Standing 8: 8 % 7 = 1 (A tier), floor(8/7) = 1 (prestige 1)
      expect(mTierList.prestigeDisplay).toBe('(A+)');
    });

    it('should show +2 for prestige 2', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 14 });

      expect(mTierList.prestigeDisplay).toBe('(S+2)');
    });
  });

  describe('slotsPerTier', () => {
    it('should calculate slots per tier correctly', () => {
      const mTierList = getMTierList(mockTierList);

      expect(mTierList.slotsPerTier).toBe(3); // 21 slots / 7 tiers = 3
    });
  });

  describe('moveDownATier', () => {
    it('should increment standing by 1', () => {
      const mTierList = getMTierList(mockTierList);
      const initialStanding = mTierList.standing;

      const result = mTierList.moveDownATier();

      expect(result).toBe(true);
      expect(mTierList.standing).toBe((initialStanding as number) + 1);
    });

    it('should return false if standing is not a number', () => {
      const tierListWithoutStanding = { ...mockTierList };
      delete (tierListWithoutStanding as any).standing;
      const mTierList = getMTierList(tierListWithoutStanding);

      const result = mTierList.moveDownATier();

      expect(result).toBe(false);
    });
  });

  describe('moveUpATier', () => {
    it('should decrement standing by 1', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 5 });
      const initialStanding = mTierList.standing;

      const result = mTierList.moveUpATier();

      expect(result).toBe(true);
      expect(mTierList.standing).toBe((initialStanding as number) - 1);
    });

    it('should return false if already at standing 0', () => {
      const mTierList = getMTierList(mockTierList);

      const result = mTierList.moveUpATier();

      expect(result).toBe(false);
      expect(mTierList.standing).toBe(0);
    });

    it('should return false if standing is not a number', () => {
      const tierListWithoutStanding = { ...mockTierList };
      delete (tierListWithoutStanding as any).standing;
      const mTierList = getMTierList(tierListWithoutStanding);

      const result = mTierList.moveUpATier();

      expect(result).toBe(false);
    });
  });

  describe('eligibleTierSlots', () => {
    it('should return slots for current tier', () => {
      const mTierList = getMTierList(mockTierList); // standing 0 = tier S

      const eligibleSlots = mTierList.eligibleTierSlots();

      expect(eligibleSlots).toHaveLength(3); // 3 slots per tier
      expect(eligibleSlots[0].position).toBe(0);
      expect(eligibleSlots[2].position).toBe(2);
    });

    it('should return correct slots for tier 2', () => {
      const mTierList = getMTierList({ ...mockTierList, standing: 2 });

      const eligibleSlots = mTierList.eligibleTierSlots();

      expect(eligibleSlots).toHaveLength(3);
      expect(eligibleSlots[0].position).toBe(6); // tier 2 starts at position 6
      expect(eligibleSlots[2].position).toBe(8);
    });
  });

  describe('adjustTierSlotPositionBySteps', () => {
    it('should move slot up (negative steps) and increment winCount', () => {
      const mTierList = getMTierList(mockTierList);
      const initialPosition = 10;
      const steps = -3;

      mTierList.adjustTierSlotPositionBySteps(initialPosition, steps);

      const movedSlot = mTierList.slots[initialPosition + steps];

      expect(movedSlot.contestCount).toBe(1);
      expect(movedSlot.winCount).toBe(1);
    });

    it('should move slot down (positive steps) and not increment winCount', () => {
      const mTierList = getMTierList(mockTierList);
      const initialPosition = 5;
      const steps = 3;

      mTierList.adjustTierSlotPositionBySteps(initialPosition, steps);

      const movedSlot = mTierList.slots[initialPosition + steps];

      expect(movedSlot.contestCount).toBe(1);
      expect(movedSlot.winCount).toBe(0);
    });
  });

  describe('getPositionsPojo', () => {
    it('should return object with tier slot positions', () => {
      const mTierList = getMTierList(mockTierList);

      const pojo = mTierList.getPositionsPojo();

      expect(pojo).toHaveProperty('tierSlot0');
      expect(pojo).toHaveProperty('tierSlot20');
      expect(pojo.tierSlot0).toHaveProperty('id');
      expect(pojo.tierSlot0).toHaveProperty('position');
      expect(pojo.tierSlot0).toHaveProperty('contestCount');
      expect(pojo.tierSlot0).toHaveProperty('winCount');
    });
  });

  describe('TIERS constant', () => {
    it('should have 7 tiers', () => {
      expect(TIERS).toHaveLength(7);
    });

    it('should have correct tier labels', () => {
      expect(TIERS[0].label).toBe('S');
      expect(TIERS[1].label).toBe('A');
      expect(TIERS[6].label).toBe('F');
    });

    it('should have correct positions', () => {
      TIERS.forEach((tier, index) => {
        expect(tier.position).toBe(index);
      });
    });
  });
});
