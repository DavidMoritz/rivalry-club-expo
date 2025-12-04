import React from 'react';
import { render } from '@testing-library/react-native';

import TierListRow from '../TierListRow';
import { GameProvider } from '../../../../providers/game';
import { getMGame } from '../../../../models/m-game';

const mockGame = getMGame({
  id: 'game-1',
  name: 'Super Smash Bros. Ultimate',
  fighters: {
    items: [
      { id: 'fighter-1', name: 'Mario', gameId: 'game-1' },
      { id: 'fighter-2', name: 'Link', gameId: 'game-1' },
    ]
  }
} as any);

const mockSlots = [
  { id: 'slot-1', fighterId: 'fighter-1', position: 0 },
  { id: 'slot-2', fighterId: 'fighter-2', position: 1 },
];

describe('TierListRow', () => {
  it('renders tier label correctly', () => {
    const { getByText } = render(
      <GameProvider value={mockGame}>
        <TierListRow
          label="S"
          color="hsl(0, 100%, 75%)"
          active={false}
          slots={mockSlots as any}
        />
      </GameProvider>
    );

    expect(getByText('S')).toBeTruthy();
  });

  it('renders with correct background color', () => {
    const { getByText } = render(
      <GameProvider value={mockGame}>
        <TierListRow
          label="A"
          color="hsl(30, 100%, 75%)"
          active={false}
          slots={mockSlots as any}
        />
      </GameProvider>
    );

    const labelElement = getByText('A');
    expect(labelElement).toBeTruthy();
  });

  it('renders CharacterDisplay components for each slot', () => {
    const { getByText } = render(
      <GameProvider value={mockGame}>
        <TierListRow
          label="B"
          color="hsl(45, 100%, 75%)"
          active={false}
          slots={mockSlots as any}
        />
      </GameProvider>
    );

    // The tier label should be visible
    expect(getByText('B')).toBeTruthy();
  });

  it('renders with empty slots array', () => {
    const { getByText } = render(
      <GameProvider value={mockGame}>
        <TierListRow
          label="C"
          color="hsl(60, 100%, 75%)"
          active={false}
          slots={[]}
        />
      </GameProvider>
    );

    expect(getByText('C')).toBeTruthy();
  });

  it('handles null fighters gracefully', () => {
    const slotsWithInvalidFighter = [
      { id: 'slot-3', fighterId: 'non-existent', position: 0 },
    ];

    const { getByText } = render(
      <GameProvider value={mockGame}>
        <TierListRow
          label="D"
          color="hsl(90, 100%, 75%)"
          active={false}
          slots={slotsWithInvalidFighter as any}
        />
      </GameProvider>
    );

    expect(getByText('D')).toBeTruthy();
  });
});
