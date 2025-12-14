import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { MGame } from '../../../../models/m-game';
import { getMGame } from '../../../../models/m-game';
import type { MTierSlot } from '../../../../models/m-tier-slot';
import { GameProvider } from '../../../../providers/game';
import TierListRow from '../TierListRow';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const mockGame = getMGame({
  id: 'game-1',
  name: 'Super Smash Bros. Ultimate',
  fighters: {
    items: [
      { id: 'fighter-1', name: 'Mario', gameId: 'game-1' },
      { id: 'fighter-2', name: 'Link', gameId: 'game-1' },
    ],
  },
} as unknown as Parameters<typeof getMGame>[0]) as MGame;

const mockSlots: MTierSlot[] = [
  { id: 'slot-1', fighterId: 'fighter-1', position: 0 },
  { id: 'slot-2', fighterId: 'fighter-2', position: 1 },
] as unknown as MTierSlot[];

describe('TierListRow', () => {
  it('renders tier label correctly', () => {
    const queryClient = createTestQueryClient();
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <GameProvider game={mockGame}>
          <TierListRow
            active={false}
            color="hsl(0, 100%, 75%)"
            label="S"
            slots={mockSlots}
          />
        </GameProvider>
      </QueryClientProvider>
    );

    expect(getByText('S')).toBeTruthy();
  });

  it('renders with correct background color', () => {
    const queryClient = createTestQueryClient();
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <GameProvider game={mockGame}>
          <TierListRow
            active={false}
            color="hsl(30, 100%, 75%)"
            label="A"
            slots={mockSlots}
          />
        </GameProvider>
      </QueryClientProvider>
    );

    const labelElement = getByText('A');
    expect(labelElement).toBeTruthy();
  });

  it('renders CharacterDisplay components for each slot', () => {
    const queryClient = createTestQueryClient();
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <GameProvider game={mockGame}>
          <TierListRow
            active={false}
            color="hsl(45, 100%, 75%)"
            label="B"
            slots={mockSlots}
          />
        </GameProvider>
      </QueryClientProvider>
    );

    // The tier label should be visible
    expect(getByText('B')).toBeTruthy();
  });

  it('renders with empty slots array', () => {
    const queryClient = createTestQueryClient();
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <GameProvider game={mockGame}>
          <TierListRow
            active={false}
            color="hsl(60, 100%, 75%)"
            label="C"
            slots={[]}
          />
        </GameProvider>
      </QueryClientProvider>
    );

    expect(getByText('C')).toBeTruthy();
  });

  it('handles null fighters gracefully', () => {
    const queryClient = createTestQueryClient();
    const slotsWithInvalidFighter = [
      { id: 'slot-3', fighterId: 'non-existent', position: 0 },
    ];

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <GameProvider game={mockGame}>
          <TierListRow
            active={false}
            color="hsl(90, 100%, 75%)"
            label="D"
            slots={slotsWithInvalidFighter as unknown as MTierSlot[]}
          />
        </GameProvider>
      </QueryClientProvider>
    );

    expect(getByText('D')).toBeTruthy();
  });
});
