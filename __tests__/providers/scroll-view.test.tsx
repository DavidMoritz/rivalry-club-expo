import { render } from '@testing-library/react-native';
import React, { useContext } from 'react';
import { Text, View } from 'react-native';

import {
  SyncedScrollViewContext,
  syncedScrollViewState,
} from '../../src/providers/scroll-view';

describe('SyncedScrollViewContext', () => {
  it('should provide default synced scroll view state', () => {
    const TestComponent = () => {
      const context = useContext(SyncedScrollViewContext);

      return (
        <View>
          <Text testID="has-active-scroll-view">
            {context.activeScrollView ? 'true' : 'false'}
          </Text>
          <Text testID="has-offset-percent">
            {context.offsetPercent ? 'true' : 'false'}
          </Text>
        </View>
      );
    };

    const { getByTestId } = render(<TestComponent />);

    expect(getByTestId('has-active-scroll-view').props.children).toBe('true');
    expect(getByTestId('has-offset-percent').props.children).toBe('true');
  });

  it('should have correct initial values in state', () => {
    expect(syncedScrollViewState.activeScrollView).toBeDefined();
    expect(syncedScrollViewState.offsetPercent).toBeDefined();
  });

  it('should use the same state object across components', () => {
    const TestComponent1 = () => {
      const context = useContext(SyncedScrollViewContext);

      return (
        <Text testID="component1">
          {context === syncedScrollViewState ? 'same' : 'different'}
        </Text>
      );
    };

    const TestComponent2 = () => {
      const context = useContext(SyncedScrollViewContext);

      return (
        <Text testID="component2">
          {context === syncedScrollViewState ? 'same' : 'different'}
        </Text>
      );
    };

    const { getByTestId } = render(
      <View>
        <TestComponent1 />
        <TestComponent2 />
      </View>,
    );

    expect(getByTestId('component1').props.children).toBe('same');
    expect(getByTestId('component2').props.children).toBe('same');
  });
});
