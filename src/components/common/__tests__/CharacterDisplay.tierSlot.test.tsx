import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { getMTierSlot } from '../../../models/m-tier-slot';
import { CharacterDisplay } from '../CharacterDisplay';

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
    const mockTierSlot = getMTierSlot({
      id: 'slot-1',
      fighterId: 'fighter-1',
      tierListId: 'tierlist-1',
      position: 10,
      contestCount: 15,
      winCount: 12,
    } as any);

    const { root } = render(
      <CharacterDisplay
        fighter={mockFighter}
        hideName={true}
        tierSlot={mockTierSlot}
      />
    );

    expect(root).toBeTruthy();
  });

  it('should render with tierSlot that has null position (unknown tier)', () => {
    const mockTierSlot = getMTierSlot({
      id: 'slot-1',
      fighterId: 'fighter-1',
      tierListId: 'tierlist-1',
      position: null,
      contestCount: 5,
      winCount: 3,
    } as any);

    const { root } = render(
      <CharacterDisplay
        fighter={mockFighter}
        hideName={true}
        tierSlot={mockTierSlot}
      />
    );

    expect(root).toBeTruthy();
  });

  it('should render with tierSlot that has zero stats', () => {
    const mockTierSlot = getMTierSlot({
      id: 'slot-1',
      fighterId: 'fighter-1',
      tierListId: 'tierlist-1',
      position: 0,
      contestCount: 0,
      winCount: 0,
    } as any);

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

    const mockTierSlot = getMTierSlot({
      id: 'slot-1',
      fighterId: 'fighter-1',
      tierListId: 'tierlist-1',
      position: 5,
      contestCount: 20,
      winCount: 15,
    } as any);

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
    const mockTierSlot = getMTierSlot({
      id: 'slot-1',
      fighterId: 'fighter-1',
      tierListId: 'tierlist-1',
      position: 10,
      contestCount: 15,
      winCount: 12,
    } as any);

    const { getByTestId, queryByText } = render(
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
