import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Text, Button } from 'react-native';

import {
  RivalryProvider,
  useRivalry,
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
});
