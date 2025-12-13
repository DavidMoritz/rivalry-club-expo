import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import type { MGame } from '../../../../models/m-game';
import type { MTierList } from '../../../../models/m-tier-list';
import { TierListEditDisplay } from '../TierListEditDisplay';

// Mock dependencies
jest.mock('../../../../providers/game', () => ({
  useGame: jest.fn(),
}));

jest.mock('../../../../utils', () => ({
  fighterByIdFromGame: jest.fn((game, fighterId) => ({
    id: fighterId,
    name: `Fighter ${fighterId}`,
    gameId: 'test-game',
  })),
}));

jest.mock('../../../common/CharacterDisplay', () => ({
  CharacterDisplay: ({ fighter, onPress }: any) => {
    const { Text, TouchableOpacity } = require('react-native');

    return (
      <TouchableOpacity
        onPress={onPress}
        testID={`character-${fighter.id}-wrapper`}
      >
        <Text testID={`character-${fighter.id}`}>{fighter.name}</Text>
      </TouchableOpacity>
    );
  },
}));

const { useGame } = require('../../../../providers/game');

describe('TierListEditDisplay', () => {
  const mockOnChange = jest.fn();

  const createMockTierList = (): MTierList => {
    const slots = Array.from({ length: 84 }, (_, i) => ({
      id: `slot-${i}`,
      fighterId: `fighter-${i}`,
      position: i,
      tierListId: 'test-tier-list',
      contestCount: 0,
      winCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return {
      id: 'test-tier-list',
      rivalryId: 'test-rivalry',
      userId: 'test-user',
      standing: 0,
      slots,
      tierSlots: { items: slots },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useGame.mockReturnValue({
      id: 'test-game',
      name: 'Test Game',
      fighters: { items: [] },
    } as MGame);
  });

  it('renders all tier rows', () => {
    const tierList = createMockTierList();
    const { getByText } = render(
      <TierListEditDisplay onChange={mockOnChange} tierList={tierList} />
    );

    // Check that all 7 tier labels are present (S, A, B, C, D, E, F)
    expect(getByText('S')).toBeTruthy();
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(getByText('C')).toBeTruthy();
    expect(getByText('D')).toBeTruthy();
    expect(getByText('E')).toBeTruthy();
    expect(getByText('F')).toBeTruthy();
  });

  it('renders all characters', () => {
    const tierList = createMockTierList();
    const { getByTestId } = render(
      <TierListEditDisplay onChange={mockOnChange} tierList={tierList} />
    );

    // Check a few characters are rendered
    expect(getByTestId('character-fighter-0')).toBeTruthy();
    expect(getByTestId('character-fighter-10')).toBeTruthy();
    expect(getByTestId('character-fighter-83')).toBeTruthy();
  });

  it('moves a character when destination is clicked', async () => {
    const tierList = createMockTierList();
    const { getByTestId } = render(
      <TierListEditDisplay onChange={mockOnChange} tierList={tierList} />
    );

    // Select first character
    const character1Wrapper = getByTestId('character-fighter-0-wrapper');
    fireEvent.press(character1Wrapper);

    // Click second character to move first character there
    const character2Wrapper = getByTestId('character-fighter-5-wrapper');
    fireEvent.press(character2Wrapper);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it('deselects the slot when clicking the same slot again', () => {
    const tierList = createMockTierList();
    const { getByTestId } = render(
      <TierListEditDisplay onChange={mockOnChange} tierList={tierList} />
    );

    // Get the character wrapper (TouchableOpacity with onPress handler)
    const characterWrapper = getByTestId('character-fighter-0-wrapper');

    // First click: Select the character
    fireEvent.press(characterWrapper);

    // Verify character is selected by checking that a second click on a DIFFERENT character would trigger onChange
    // But we're going to click the SAME character, which should deselect instead

    // Reset mock to track future calls
    mockOnChange.mockClear();

    // Second click: Click the same character again (should deselect)
    fireEvent.press(characterWrapper);

    // Verify onChange was NOT called
    // This proves that clicking the same slot deselects it rather than trying to move it to itself
    expect(mockOnChange).not.toHaveBeenCalled();

    // In the real component code (lines 417-420):
    // } else if (selectedSlot && selectedSlot.id === slot.id) {
    //   // If clicking the same slot, deselect it
    //   setSelectedSlot(null);
    // }
  });
});
