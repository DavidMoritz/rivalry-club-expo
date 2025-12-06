import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Text, Button } from 'react-native';

import {
  RivalryProvider,
  useRivalry,
  useRivalryContext,
  useUpdateRivalry,
} from '../../src/providers/rivalry';
import { getMRivalry } from '../../src/models/m-rivalry';

describe('RivalryProvider', () => {
  const mockRivalry = getMRivalry({
    rivalry: {
      __typename: 'Rivalry',
      id: 'rivalry-123',
      userAId: 'user-a',
      userBId: 'user-b',
      gameId: 'game-123',
      contestCount: 10,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  });

  it('should provide rivalry context to children', () => {
    const TestComponent = () => {
      const rivalry = useRivalry();

      return <Text testID="rivalry-id">{rivalry?.id}</Text>;
    };

    const { getByTestId } = render(
      <RivalryProvider rivalry={mockRivalry}>
        <TestComponent />
      </RivalryProvider>,
    );

    expect(getByTestId('rivalry-id').props.children).toBe('rivalry-123');
  });

  it('should handle null rivalry', () => {
    const TestComponent = () => {
      const rivalry = useRivalry();

      return (
        <Text testID="rivalry-id">{rivalry ? rivalry.id : 'No rivalry'}</Text>
      );
    };

    const { getByTestId } = render(
      <RivalryProvider rivalry={null}>
        <TestComponent />
      </RivalryProvider>,
    );

    expect(getByTestId('rivalry-id').props.children).toBe('No rivalry');
  });

  it('should allow updating rivalry', () => {
    const newRivalry = getMRivalry({
      rivalry: {
        __typename: 'Rivalry',
        id: 'rivalry-456',
        userAId: 'user-c',
        userBId: 'user-d',
        gameId: 'game-456',
        contestCount: 5,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
      },
    });

    const TestComponent = () => {
      const rivalry = useRivalry();
      const updateRivalry = useUpdateRivalry();

      return (
        <>
          <Text testID="rivalry-id">{rivalry?.id || 'No rivalry'}</Text>
          <Button
            testID="update-button"
            title="Update"
            onPress={() => updateRivalry(newRivalry)}
          />
        </>
      );
    };

    const { getByTestId } = render(
      <RivalryProvider rivalry={mockRivalry}>
        <TestComponent />
      </RivalryProvider>,
    );

    expect(getByTestId('rivalry-id').props.children).toBe('rivalry-123');

    fireEvent.press(getByTestId('update-button'));

    expect(getByTestId('rivalry-id').props.children).toBe('rivalry-456');
  });

  it('should allow setting rivalry to null', () => {
    const TestComponent = () => {
      const rivalry = useRivalry();
      const updateRivalry = useUpdateRivalry();

      return (
        <>
          <Text testID="rivalry-id">{rivalry?.id || 'No rivalry'}</Text>
          <Button
            testID="clear-button"
            title="Clear"
            onPress={() => updateRivalry(null)}
          />
        </>
      );
    };

    const { getByTestId } = render(
      <RivalryProvider rivalry={mockRivalry}>
        <TestComponent />
      </RivalryProvider>,
    );

    expect(getByTestId('rivalry-id').props.children).toBe('rivalry-123');

    fireEvent.press(getByTestId('clear-button'));

    expect(getByTestId('rivalry-id').props.children).toBe('No rivalry');
  });

  it('should maintain rivalry state across re-renders', () => {
    const TestComponent = () => {
      const rivalry = useRivalry();
      const [renderCount, setRenderCount] = React.useState(0);

      return (
        <>
          <Text testID="rivalry-id">{rivalry?.id}</Text>
          <Text testID="render-count">{renderCount}</Text>
          <Button
            testID="rerender-button"
            title="Rerender"
            onPress={() => setRenderCount(renderCount + 1)}
          />
        </>
      );
    };

    const { getByTestId } = render(
      <RivalryProvider rivalry={mockRivalry}>
        <TestComponent />
      </RivalryProvider>,
    );

    expect(getByTestId('rivalry-id').props.children).toBe('rivalry-123');

    fireEvent.press(getByTestId('rerender-button'));

    expect(getByTestId('rivalry-id').props.children).toBe('rivalry-123');
    expect(getByTestId('render-count').props.children).toBe(1);
  });

  describe('userId and user identification', () => {
    it('should provide userId through context', () => {
      const TestComponent = () => {
        const { userId } = useRivalryContext();

        return <Text testID="user-id">{userId || 'No user'}</Text>;
      };

      const { getByTestId } = render(
        <RivalryProvider rivalry={mockRivalry} userId="user-a">
          <TestComponent />
        </RivalryProvider>,
      );

      expect(getByTestId('user-id').props.children).toBe('user-a');
    });

    it('should correctly identify when user is UserA', () => {
      const TestComponent = () => {
        const { isUserA, isUserB } = useRivalryContext();

        return (
          <>
            <Text testID="is-user-a">{isUserA.toString()}</Text>
            <Text testID="is-user-b">{isUserB.toString()}</Text>
          </>
        );
      };

      const { getByTestId } = render(
        <RivalryProvider rivalry={mockRivalry} userId="user-a">
          <TestComponent />
        </RivalryProvider>,
      );

      expect(getByTestId('is-user-a').props.children).toBe('true');
      expect(getByTestId('is-user-b').props.children).toBe('false');
    });

    it('should correctly identify when user is UserB', () => {
      const TestComponent = () => {
        const { isUserA, isUserB } = useRivalryContext();

        return (
          <>
            <Text testID="is-user-a">{isUserA.toString()}</Text>
            <Text testID="is-user-b">{isUserB.toString()}</Text>
          </>
        );
      };

      const { getByTestId } = render(
        <RivalryProvider rivalry={mockRivalry} userId="user-b">
          <TestComponent />
        </RivalryProvider>,
      );

      expect(getByTestId('is-user-a').props.children).toBe('false');
      expect(getByTestId('is-user-b').props.children).toBe('true');
    });

    it('should handle when userId does not match either user', () => {
      const TestComponent = () => {
        const { isUserA, isUserB } = useRivalryContext();

        return (
          <>
            <Text testID="is-user-a">{isUserA.toString()}</Text>
            <Text testID="is-user-b">{isUserB.toString()}</Text>
          </>
        );
      };

      const { getByTestId } = render(
        <RivalryProvider rivalry={mockRivalry} userId="user-c">
          <TestComponent />
        </RivalryProvider>,
      );

      expect(getByTestId('is-user-a').props.children).toBe('false');
      expect(getByTestId('is-user-b').props.children).toBe('false');
    });

    it('should handle when no userId is provided', () => {
      const TestComponent = () => {
        const { userId, isUserA, isUserB } = useRivalryContext();

        return (
          <>
            <Text testID="user-id">{userId || 'No user'}</Text>
            <Text testID="is-user-a">{isUserA.toString()}</Text>
            <Text testID="is-user-b">{isUserB.toString()}</Text>
          </>
        );
      };

      const { getByTestId } = render(
        <RivalryProvider rivalry={mockRivalry}>
          <TestComponent />
        </RivalryProvider>,
      );

      expect(getByTestId('user-id').props.children).toBe('No user');
      expect(getByTestId('is-user-a').props.children).toBe('false');
      expect(getByTestId('is-user-b').props.children).toBe('false');
    });

    it('should handle when rivalry is null', () => {
      const TestComponent = () => {
        const { userId, isUserA, isUserB } = useRivalryContext();

        return (
          <>
            <Text testID="user-id">{userId || 'No user'}</Text>
            <Text testID="is-user-a">{isUserA.toString()}</Text>
            <Text testID="is-user-b">{isUserB.toString()}</Text>
          </>
        );
      };

      const { getByTestId } = render(
        <RivalryProvider rivalry={null} userId="user-a">
          <TestComponent />
        </RivalryProvider>,
      );

      expect(getByTestId('user-id').props.children).toBe('user-a');
      expect(getByTestId('is-user-a').props.children).toBe('false');
      expect(getByTestId('is-user-b').props.children).toBe('false');
    });

    it('should update isUserA/isUserB when rivalry changes', () => {
      const newRivalry = getMRivalry({
        rivalry: {
          __typename: 'Rivalry',
          id: 'rivalry-456',
          userAId: 'user-c',
          userBId: 'user-d',
          gameId: 'game-456',
          contestCount: 5,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
        },
      });

      const TestComponent = () => {
        const { isUserA, isUserB } = useRivalryContext();
        const updateRivalry = useUpdateRivalry();

        return (
          <>
            <Text testID="is-user-a">{isUserA.toString()}</Text>
            <Text testID="is-user-b">{isUserB.toString()}</Text>
            <Button
              testID="update-button"
              title="Update"
              onPress={() => updateRivalry(newRivalry)}
            />
          </>
        );
      };

      const { getByTestId } = render(
        <RivalryProvider rivalry={mockRivalry} userId="user-c">
          <TestComponent />
        </RivalryProvider>,
      );

      // Initially user-c is not in the rivalry
      expect(getByTestId('is-user-a').props.children).toBe('false');
      expect(getByTestId('is-user-b').props.children).toBe('false');

      // After update, user-c is UserA in the new rivalry
      fireEvent.press(getByTestId('update-button'));

      expect(getByTestId('is-user-a').props.children).toBe('true');
      expect(getByTestId('is-user-b').props.children).toBe('false');
    });

    it('should update isUserA/isUserB when same rivalry object is mutated and re-set', () => {
      // Create a rivalry without userIds (simulating initial load with just ID)
      const initialRivalry = getMRivalry({
        rivalry: {
          __typename: 'Rivalry',
          id: 'rivalry-123',
          gameId: 'game-123',
          contestCount: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as any,
      });

      const TestComponent = () => {
        const rivalry = useRivalry();
        const { isUserA, isUserB } = useRivalryContext();
        const updateRivalry = useUpdateRivalry();

        return (
          <>
            <Text testID="rivalry-user-a-id">{rivalry?.userAId || 'none'}</Text>
            <Text testID="rivalry-user-b-id">{rivalry?.userBId || 'none'}</Text>
            <Text testID="is-user-a">{isUserA.toString()}</Text>
            <Text testID="is-user-b">{isUserB.toString()}</Text>
            <Button
              testID="update-button"
              title="Update"
              onPress={() => {
                // Simulate what happens in the real app: same object reference
                // but with properties populated
                initialRivalry.userAId = 'user-a';
                initialRivalry.userBId = 'user-b';
                updateRivalry(initialRivalry);
              }}
            />
          </>
        );
      };

      const { getByTestId } = render(
        <RivalryProvider rivalry={initialRivalry} userId="user-b">
          <TestComponent />
        </RivalryProvider>,
      );

      // Initially userIds are not set
      expect(getByTestId('rivalry-user-a-id').props.children).toBe('none');
      expect(getByTestId('rivalry-user-b-id').props.children).toBe('none');
      expect(getByTestId('is-user-a').props.children).toBe('false');
      expect(getByTestId('is-user-b').props.children).toBe('false');

      // After update with same object reference but populated properties
      fireEvent.press(getByTestId('update-button'));

      // Should recognize the updated userIds and correctly identify user
      expect(getByTestId('rivalry-user-a-id').props.children).toBe('user-a');
      expect(getByTestId('rivalry-user-b-id').props.children).toBe('user-b');
      expect(getByTestId('is-user-a').props.children).toBe('false');
      expect(getByTestId('is-user-b').props.children).toBe('true');
    });

    it('should handle multiple updates to the same rivalry object', () => {
      const rivalry = getMRivalry({
        rivalry: {
          __typename: 'Rivalry',
          id: 'rivalry-123',
          userAId: 'user-a',
          userBId: 'user-b',
          gameId: 'game-123',
          contestCount: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      const TestComponent = () => {
        const { isUserA, isUserB } = useRivalryContext();
        const updateRivalry = useUpdateRivalry();

        return (
          <>
            <Text testID="is-user-a">{isUserA.toString()}</Text>
            <Text testID="is-user-b">{isUserB.toString()}</Text>
            <Button
              testID="swap-button"
              title="Swap"
              onPress={() => {
                // Swap the user IDs in the same object
                const temp = rivalry.userAId;
                rivalry.userAId = rivalry.userBId;
                rivalry.userBId = temp;
                updateRivalry(rivalry);
              }}
            />
          </>
        );
      };

      const { getByTestId } = render(
        <RivalryProvider rivalry={rivalry} userId="user-a">
          <TestComponent />
        </RivalryProvider>,
      );

      // Initially user-a is UserA
      expect(getByTestId('is-user-a').props.children).toBe('true');
      expect(getByTestId('is-user-b').props.children).toBe('false');

      // After swapping, user-a should be UserB
      fireEvent.press(getByTestId('swap-button'));

      expect(getByTestId('is-user-a').props.children).toBe('false');
      expect(getByTestId('is-user-b').props.children).toBe('true');
    });
  });
});
