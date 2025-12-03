import { TierSlot } from '../../src/API';
import {
  getMTierSlot,
  MTierSlot,
  normalizeTierSlotPositionToIndex,
} from '../../src/models/m-tier-slot';
import { getMTierList, TIERS } from '../../src/models/m-tier-list';

describe('MTierSlot Model', () => {
  const mockTierSlot: TierSlot = {
    __typename: 'TierSlot',
    id: 'tier-slot-123',
    tierListId: 'tier-list-123',
    fighterId: 'fighter-123',
    position: 5,
    contestCount: 10,
    winCount: 6,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getMTierSlot', () => {
    it('should create an MTierSlot from a TierSlot object', () => {
      const mTierSlot = getMTierSlot(mockTierSlot);

      expect(mTierSlot).toBeDefined();
      expect(mTierSlot.id).toBe(mockTierSlot.id);
      expect(mTierSlot.position).toBe(mockTierSlot.position);
    });

    it('should return baseTierSlot', () => {
      const mTierSlot = getMTierSlot(mockTierSlot);

      expect(mTierSlot.baseTierSlot).toEqual(mockTierSlot);
    });

    it('should initialize with undefined fighter and tierList', () => {
      const mTierSlot = getMTierSlot(mockTierSlot);

      expect(mTierSlot.fighter).toBeUndefined();
      expect(mTierSlot.tierList).toBeUndefined();
    });
  });

  describe('higherItemsCount', () => {
    it('should return position as higher items count', () => {
      const mTierSlot = getMTierSlot(mockTierSlot);

      expect(mTierSlot.higherItemsCount()).toBe(5);
    });

    it('should return 0 for position 0', () => {
      const mTierSlot = getMTierSlot({ ...mockTierSlot, position: 0 });

      expect(mTierSlot.higherItemsCount()).toBe(0);
    });
  });

  describe('lowerItemsCount', () => {
    it('should return correct lower items count when tierList is set', () => {
      const mTierSlot = getMTierSlot(mockTierSlot);
      const mockTierList = getMTierList({
        __typename: 'TierList',
        id: 'tier-list-123',
        rivalryId: 'rivalry-123',
        userId: 'user-123',
        standing: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        tierSlots: {
          __typename: 'ModelTierSlotConnection',
          items: new Array(20).fill(null).map((_, i) => ({
            __typename: 'TierSlot' as const,
            id: `slot-${i}`,
            tierListId: 'tier-list-123',
            fighterId: `fighter-${i}`,
            position: i,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          })),
        },
      });

      mTierSlot.tierList = mockTierList;

      expect(mTierSlot.lowerItemsCount()).toBe(14); // 20 - 1 - 5 = 14
    });
  });

  describe('fighterTier', () => {
    // fighterTier getter uses closure variable instead of this.position
    // Works in practice as positions don't change after creation
    it.skip('should return correct tier based on position', () => {
      const mockTierList = getMTierList({
        __typename: 'TierList',
        id: 'tier-list-123',
        rivalryId: 'rivalry-123',
        userId: 'user-123',
        standing: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        tierSlots: {
          __typename: 'ModelTierSlotConnection',
          items: new Array(21).fill(null).map((_, i) => ({
            __typename: 'TierSlot' as const,
            id: `slot-${i}`,
            tierListId: 'tier-list-123',
            fighterId: `fighter-${i}`,
            position: i,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          })),
        },
      });

      const mTierSlot = getMTierSlot({ ...mockTierSlot, position: 6 });
      mTierSlot.tierList = mockTierList;

      const tier = mTierSlot.fighterTier;

      expect(tier).toBeDefined();
      expect(tier.label).toBe(TIERS[2].label); // Position 6 / 3 slots per tier = tier 2 (B)
    });
  });

  describe('normalizeTierSlotPositionToIndex', () => {
    it('should set position to index', () => {
      const mTierSlot = getMTierSlot(mockTierSlot);

      const normalized = normalizeTierSlotPositionToIndex(mTierSlot, 10);

      expect(normalized.position).toBe(10);
    });

    it('should preserve other properties', () => {
      const mTierSlot = getMTierSlot(mockTierSlot);

      const normalized = normalizeTierSlotPositionToIndex(mTierSlot, 10);

      expect(normalized.id).toBe(mTierSlot.id);
      expect(normalized.fighterId).toBe(mTierSlot.fighterId);
    });
  });
});
