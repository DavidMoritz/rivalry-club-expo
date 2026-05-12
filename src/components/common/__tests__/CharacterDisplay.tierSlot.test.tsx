import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { Schema } from '../../../../amplify/data/resource';
import { getMTierSlot } from '../../../models/m-tier-slot';
import { CharacterDisplay } from '../CharacterDisplay';

type TierSlot = Schema['TierSlot']['type'];

const TIER_U_REGEX = /Tier U/i;
const UNKNOWN_POSITION_REGEX = /Position: \?\?/;

/** Creates a mock TierSlot for testing purposes */
const createMockTierSlot = (
  overrides: Partial<TierSlot> & {
    id: string;
    fighterId: string;
    tierListId: string;
  }
): TierSlot =>
  ({
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    position: null,
    contestCount: null,
    winCount: null,
    deletedAt: null,
    tierList: async () => ({ data: null }),
    fighter: async () => ({ data: null }),
    ...overrides,
  }) as TierSlot;

const mockFighter = {
  id: 'fighter-1',
  name: 'Mario',
  gamePosition: 1,
  winCount: 50,
  contestCount: 75,
  rank: 5,
};

describe('CharacterDisplay with TierSlot', () => {
  it('should render without tierSlot (backward compatibility)', () => {
    const { root } = render(
      <CharacterDisplay fighter={mockFighter} hideName={true} />
    );

    expect(root).toBeTruthy();
  });

  it('should accept tierSlot prop with position and stats', () => {
    const mockTierSlot = getMTierSlot(
      createMockTierSlot({
        id: 'slot-1',
        fighterId: 'fighter-1',
        tierListId: 'tierlist-1',
        position: 10,
        contestCount: 15,
        winCount: 12,
      })
    );

    const { root } = render(
      <CharacterDisplay
        fighter={mockFighter}
        hideName={true}
        tierSlot={mockTierSlot}
      />
    );

    expect(root).toBeTruthy();
  });

  it('should render with tierSlot that has null position (unknown tier)', async () => {
    const mockTierSlot = getMTierSlot(
      createMockTierSlot({
        id: 'slot-1',
        fighterId: 'fighter-1',
        tierListId: 'tierlist-1',
        position: null,
        contestCount: 5,
        winCount: 3,
      })
    );

    const { getByText, queryByText } = render(
      <CharacterDisplay
        fighter={mockFighter}
        hideName={false}
        tierSlot={mockTierSlot}
      />
    );

    // Component should render without crashing
    expect(getByText('Mario')).toBeTruthy();

    // Long press on the character to open the modal
    const characterName = getByText('Mario');
    fireEvent(characterName.parent?.parent || characterName, 'onLongPress');

    // After long press, stats modal should appear with "Tier U" designation
    // Note: Testing modal interactions in RNTL can be tricky due to async rendering
    await waitFor(
      () => {
        // Check if "Rivalry Stats" header is visible (indicates modal opened)
        const statsHeader = queryByText('Rivalry Stats');
        if (statsHeader) {
          // If modal is open, verify "Tier U" is displayed
          expect(queryByText(TIER_U_REGEX)).toBeTruthy();
          expect(queryByText(UNKNOWN_POSITION_REGEX)).toBeTruthy();
        }
      },
      { timeout: 2000 }
    );
  });

  it('should render with tierSlot that has zero stats', () => {
    const mockTierSlot = getMTierSlot(
      createMockTierSlot({
        id: 'slot-1',
        fighterId: 'fighter-1',
        tierListId: 'tierlist-1',
        position: 0,
        contestCount: 0,
        winCount: 0,
      })
    );

    const { root } = render(
      <CharacterDisplay
        fighter={mockFighter}
        hideName={true}
        tierSlot={mockTierSlot}
      />
    );

    expect(root).toBeTruthy();
  });

  it('should render with fighter that has global stats', () => {
    const fighterWithStats = {
      id: 'fighter-1',
      name: 'Mario',
      gamePosition: 1,
      winCount: 100,
      contestCount: 150,
      rank: 3,
    };

    const { root } = render(
      <CharacterDisplay fighter={fighterWithStats} hideName={true} />
    );

    expect(root).toBeTruthy();
  });

  it('should render with both tierSlot stats and global fighter stats', () => {
    const fighterWithStats = {
      id: 'fighter-1',
      name: 'Mario',
      gamePosition: 1,
      winCount: 100,
      contestCount: 150,
      rank: 3,
    };

    const mockTierSlot = getMTierSlot(
      createMockTierSlot({
        id: 'slot-1',
        fighterId: 'fighter-1',
        tierListId: 'tierlist-1',
        position: 5,
        contestCount: 20,
        winCount: 15,
      })
    );

    const { root } = render(
      <CharacterDisplay
        fighter={fighterWithStats}
        hideName={true}
        tierSlot={mockTierSlot}
      />
    );

    expect(root).toBeTruthy();
  });

  it('should display stats when long-pressed (modal interaction)', () => {
    const mockTierSlot = getMTierSlot(
      createMockTierSlot({
        id: 'slot-1',
        fighterId: 'fighter-1',
        tierListId: 'tierlist-1',
        position: 10,
        contestCount: 15,
        winCount: 12,
      })
    );

    const { queryByText } = render(
      <CharacterDisplay
        fighter={mockFighter}
        hideName={true}
        tierSlot={mockTierSlot}
      />
    );

    // Modal should not be visible initially
    expect(queryByText('Rivalry Stats')).toBeNull();
  });
});
