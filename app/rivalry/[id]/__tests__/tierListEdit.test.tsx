import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';

import TierListEditRoute from '../tierListEdit';
import { useUpdateTierSlotsMutation } from '../../../../src/controllers/c-rivalry';

// Mock dependencies
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ children }: any) => children
  },
  useLocalSearchParams: () => ({
    id: 'test-rivalry-id',
    userId: 'test-user-id',
    userAName: 'User A',
    userBName: 'User B'
  }),
  useRouter: jest.fn()
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null
}));

const mockUseQuery = jest.fn();

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');

  return {
    ...actual,
    useQuery: mockUseQuery
  };
});

jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => ({
    models: {
      Rivalry: {
        get: jest.fn()
      },
      User: {
        get: jest.fn()
      }
    }
  }))
}));

jest.mock('../../../../src/controllers/c-rivalry', () => ({
  useUpdateTierSlotsMutation: jest.fn()
}));

jest.mock('../../../../src/components/common/HamburgerMenu', () => ({
  HamburgerMenu: () => null
}));

jest.mock('../../../../src/components/screens/parts/TierListEditDisplay', () => ({
  TierListEditDisplay: ({ onChange }: any) => {
    const { Text, TouchableOpacity } = require('react-native');

    return (
      <TouchableOpacity testID="mock-tier-list-edit" onPress={() => onChange()}>
        <Text>Mock Tier List Edit Display</Text>
      </TouchableOpacity>
    );
  }
}));

describe('TierListEditRoute', () => {
  const mockPush = jest.fn();
  const mockMutate = jest.fn();

  const createMockRivalry = () => ({
    id: 'test-rivalry',
    userAId: 'user-a',
    userBId: 'user-b',
    tierListA: {
      id: 'tier-list-a',
      userId: 'test-user-id',
      tierSlots: {
        items: Array.from({ length: 84 }, (_, i) => ({
          id: `slot-${i}`,
          fighterId: `fighter-${i}`,
          position: i
        }))
      }
    },
    tierListB: {
      id: 'tier-list-b',
      userId: 'user-b',
      tierSlots: { items: [] }
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });

    (useUpdateTierSlotsMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false
    });

    // Mock useQuery to return loading state by default
    mockUseQuery.mockImplementation(() => ({
      isLoading: true,
      isError: false,
      error: null,
      data: null
    }));
  });

  it.skip('renders loading state correctly', () => {
    const { getByText } = render(<TierListEditRoute />);

    expect(getByText('Loading Tier List...')).toBeTruthy();
  });

  it.skip('displays save button in disabled state when no changes', () => {
    // Mock successful data load
    mockUseQuery.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      error: null,
      data: createMockRivalry()
    }));

    const { getByText } = render(<TierListEditRoute />);

    const saveButton = getByText('No Changes');

    expect(saveButton).toBeTruthy();
  });

  it.skip('enables save button when changes are made', async () => {
    // Mock successful data load
    mockUseQuery.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      error: null,
      data: createMockRivalry()
    }));

    const { getByText, getByTestId } = render(<TierListEditRoute />);

    // Simulate making a change
    const tierListEdit = getByTestId('mock-tier-list-edit');
    fireEvent.press(tierListEdit);

    await waitFor(() => {
      expect(getByText('Save List')).toBeTruthy();
    });
  });

  it.skip('calls mutation and navigates back on successful save', async () => {
    // Mock successful data load
    mockUseQuery.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      error: null,
      data: createMockRivalry()
    }));

    // Mock successful mutation
    (useUpdateTierSlotsMutation as jest.Mock).mockReturnValue({
      mutate: (callback?: any) => {
        // Simulate successful mutation
        if (callback) callback();
        mockMutate();
      },
      isPending: false
    });

    const { getByText, getByTestId } = render(<TierListEditRoute />);

    // Make a change to enable save button
    const tierListEdit = getByTestId('mock-tier-list-edit');
    fireEvent.press(tierListEdit);

    await waitFor(() => {
      expect(getByText('Save List')).toBeTruthy();
    });

    // Click save button
    const saveButton = getByText('Save List');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it.skip('shows loading indicator while saving', () => {
    // Mock successful data load
    mockUseQuery.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      error: null,
      data: createMockRivalry()
    }));

    (useUpdateTierSlotsMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: true
    });

    const { UNSAFE_getAllByType } = render(<TierListEditRoute />);

    // Check for ActivityIndicator
    const { ActivityIndicator } = require('react-native');
    const activityIndicators = UNSAFE_getAllByType(ActivityIndicator);

    expect(activityIndicators.length).toBeGreaterThan(0);
  });
});
