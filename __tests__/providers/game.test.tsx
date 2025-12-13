import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { getMGame } from '../../src/models/m-game';
import { GameProvider, useGame } from '../../src/providers/game';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('GameProvider', () => {
  const mockGame = getMGame({
    __typename: 'Game',
    id: 'game-123',
    name: 'Super Smash Bros Ultimate',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  });

  it('should provide game context to children', () => {
    const queryClient = createTestQueryClient();
    const TestComponent = () => {
      const game = useGame();

      return <Text testID="game-name">{game?.name}</Text>;
    };

    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <GameProvider game={mockGame}>
          <TestComponent />
        </GameProvider>
      </QueryClientProvider>
    );

    expect(getByTestId('game-name').props.children).toBe(
      'Super Smash Bros Ultimate'
    );
  });

  it('should return null when no game is provided initially', () => {
    const queryClient = createTestQueryClient();
    const TestComponent = () => {
      const game = useGame();

      return <Text testID="game-name">{game ? game.name : 'No game'}</Text>;
    };

    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <GameProvider game={null}>
          <TestComponent />
        </GameProvider>
      </QueryClientProvider>
    );

    // Should initially show 'No game' before query runs
    expect(getByTestId('game-name').props.children).toBe('No game');
  });

  it('should provide computed properties from MGame', () => {
    const queryClient = createTestQueryClient();
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
      <QueryClientProvider client={queryClient}>
        <GameProvider game={mockGame}>
          <TestComponent />
        </GameProvider>
      </QueryClientProvider>
    );

    expect(getByTestId('game-abbr').props.children).toBe('SSBU');
    expect(getByTestId('game-title').props.children).toBe(
      'Super Smash Bros Ultimate (unofficial)'
    );
  });

  it('should provide game with fighter stats when fetched', () => {
    const queryClient = createTestQueryClient();
    const gameWithStats = getMGame({
      __typename: 'Game',
      id: 'game-123',
      name: 'Super Smash Bros Ultimate',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      fighters: {
        items: [
          {
            id: 'fighter-1',
            name: 'Mario',
            gamePosition: 1,
            winCount: 50,
            contestCount: 75,
            rank: 5,
          },
          {
            id: 'fighter-2',
            name: 'Link',
            gamePosition: 2,
            winCount: 60,
            contestCount: 80,
            rank: 3,
          },
        ],
      },
    } as any);

    const TestComponent = () => {
      const game = useGame();

      return (
        <Text testID="fighter-count">{game?.fighters?.items?.length || 0}</Text>
      );
    };

    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <GameProvider game={gameWithStats}>
          <TestComponent />
        </GameProvider>
      </QueryClientProvider>
    );

    expect(getByTestId('fighter-count').props.children).toBe(2);
  });
});
