import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { GameProvider, useGame } from '../../src/providers/game';
import { getMGame } from '../../src/models/m-game';

describe('GameProvider', () => {
  const mockGame = getMGame({
    __typename: 'Game',
    id: 'game-123',
    name: 'Super Smash Bros Ultimate',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  });

  it('should provide game context to children', () => {
    const TestComponent = () => {
      const game = useGame();

      return <Text testID="game-name">{game?.name}</Text>;
    };

    const { getByTestId } = render(
      <GameProvider game={mockGame}>
        <TestComponent />
      </GameProvider>,
    );

    expect(getByTestId('game-name').props.children).toBe(
      'Super Smash Bros Ultimate',
    );
  });

  it('should return null when no game is provided', () => {
    const TestComponent = () => {
      const game = useGame();

      return <Text testID="game-name">{game ? game.name : 'No game'}</Text>;
    };

    const { getByTestId } = render(
      <GameProvider game={null}>
        <TestComponent />
      </GameProvider>,
    );

    expect(getByTestId('game-name').props.children).toBe('No game');
  });

  it('should provide computed properties from MGame', () => {
    const TestComponent = () => {
      const game = useGame();

      return (
        <>
          <Text testID="game-abbr">{game?.abbr}</Text>
          <Text testID="game-title">{game?.title}</Text>
        </>
      );
    };

    const { getByTestId } = render(
      <GameProvider game={mockGame}>
        <TestComponent />
      </GameProvider>,
    );

    expect(getByTestId('game-abbr').props.children).toBe('SSBU');
    expect(getByTestId('game-title').props.children).toBe(
      'Super Smash Bros Ultimate (unofficial)',
    );
  });
});
