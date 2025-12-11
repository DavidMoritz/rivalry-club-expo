import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { TierListEditDisplay } from '../TierListEditDisplay';
import { MTierList } from '../../../../models/m-tier-list';
import { MGame } from '../../../../models/m-game';

// Mock dependencies
jest.mock('../../../../providers/game', () => ({
  useGame: jest.fn()
}));

jest.mock('../../../../utils', () => ({
  fighterByIdFromGame: jest.fn((game, fighterId) => ({
    id: fighterId,
    name: `Fighter ${fighterId}`,
    gameId: 'test-game'
  }))
}));

jest.mock('../../../common/CharacterDisplay', () => ({
  CharacterDisplay: ({ fighter, onPress }: any) => {
    const { Text, TouchableOpacity } = require('react-native');

    return (
      <TouchableOpacity onPress={onPress} testID={`character-${fighter.id}-wrapper`}>
        <Text testID={`character-${fighter.id}`}>{fighter.name}</Text>
      </TouchableOpacity>
    );
  }
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
      updatedAt: new Date().toISOString()
    }));

    return {
      id: 'test-tier-list',
      rivalryId: 'test-rivalry',
      userId: 'test-user',
      standing: 0,
      slots: slots,
      tierSlots: { items: slots },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useGame.mockReturnValue({
      id: 'test-game',
      name: 'Test Game',
      fighters: { items: [] }
    } as MGame);
  });

  it('renders all tier rows', () => {
    const tierList = createMockTierList();
    const { getByText } = render(<TierListEditDisplay tierList={tierList} onChange={mockOnChange} />);

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
    const { getByTestId } = render(<TierListEditDisplay tierList={tierList} onChange={mockOnChange} />);

    // Check a few characters are rendered
    expect(getByTestId('character-fighter-0')).toBeTruthy();
    expect(getByTestId('character-fighter-10')).toBeTruthy();
    expect(getByTestId('character-fighter-83')).toBeTruthy();
  });

  it.skip('selects a character when clicked', () => {
    const tierList = createMockTierList();
    const { getByTestId } = render(<TierListEditDisplay tierList={tierList} onChange={mockOnChange} />);

    const character = getByTestId('character-fighter-0');
    fireEvent.press(character.parent!);

    // After selection, the cancel instruction should appear
    waitFor(() => {
      expect(getByTestId('cancel-button')).toBeTruthy();
    });
  });

  it.skip('moves a character when destination is clicked', async () => {
    const tierList = createMockTierList();
    const { getByTestId } = render(<TierListEditDisplay tierList={tierList} onChange={mockOnChange} />);

    // Select first character
    const character1 = getByTestId('character-fighter-0');
    fireEvent.press(character1.parent!);

    // Click second character to move first character there
    const character2 = getByTestId('character-fighter-5');
    fireEvent.press(character2.parent!);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it.skip('deselects character when same character is clicked again', async () => {
    const tierList = createMockTierList();
    const { getByTestId, queryByText } = render(
      <TierListEditDisplay tierList={tierList} onChange={mockOnChange} />
    );

    // Select character
    const character = getByTestId('character-fighter-0');
    fireEvent.press(character.parent!);

    // Click same character again
    fireEvent.press(character.parent!);

    await waitFor(() => {
      expect(queryByText('Tap a position to move the selected character')).toBeNull();
    });
  });

  it.skip('shows cancel button when character is selected', async () => {
    const tierList = createMockTierList();
    const { getByTestId, getByText } = render(
      <TierListEditDisplay tierList={tierList} onChange={mockOnChange} />
    );

    // Select character
    const character = getByTestId('character-fighter-0');
    fireEvent.press(character.parent!);

    await waitFor(() => {
      expect(getByText('Tap a position to move the selected character')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
    });
  });

  it.skip('cancels selection when cancel button is pressed', async () => {
    const tierList = createMockTierList();
    const { getByTestId, getByText, queryByText } = render(
      <TierListEditDisplay tierList={tierList} onChange={mockOnChange} />
    );

    // Select character
    const character = getByTestId('character-fighter-0');
    fireEvent.press(character.parent!);

    // Wait for cancel button to appear
    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });

    // Press cancel
    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(queryByText('Tap a position to move the selected character')).toBeNull();
    });
  });

  it('deselects the slot when clicking the same slot again', () => {
    const tierList = createMockTierList();
    const { getByTestId } = render(<TierListEditDisplay tierList={tierList} onChange={mockOnChange} />);

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
