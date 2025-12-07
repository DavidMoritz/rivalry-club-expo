import { render } from '@testing-library/react-native';
import React, { useContext } from 'react';
import { Animated, Text, View } from 'react-native';

import {
  SyncedScrollViewContext,
  syncedScrollViewState,
} from '../../src/providers/scroll-view';

describe('SyncedScrollViewContext', () => {
  describe('Context Provider', () => {
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

      const { getByTestId } = render(
        <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
          <TestComponent />
        </SyncedScrollViewContext.Provider>,
      );

      expect(getByTestId('has-active-scroll-view').props.children).toBe(
        'true',
      );
      expect(getByTestId('has-offset-percent').props.children).toBe('true');
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
        <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
          <View>
            <TestComponent1 />
            <TestComponent2 />
          </View>
        </SyncedScrollViewContext.Provider>,
      );

      expect(getByTestId('component1').props.children).toBe('same');
      expect(getByTestId('component2').props.children).toBe('same');
    });
  });

  describe('syncedScrollViewState', () => {
    it('should have activeScrollView as an Animated.Value', () => {
      expect(syncedScrollViewState.activeScrollView).toBeDefined();
      expect(syncedScrollViewState.activeScrollView).toBeInstanceOf(
        Animated.Value,
      );
    });

    it('should have offsetPercent as an Animated.Value', () => {
      expect(syncedScrollViewState.offsetPercent).toBeDefined();
      expect(syncedScrollViewState.offsetPercent).toBeInstanceOf(
        Animated.Value,
      );
    });

    it('should initialize activeScrollView with value 0', () => {
      // Access the internal _value property to check initial value
      expect((syncedScrollViewState.activeScrollView as any)._value).toBe(0);
    });

    it('should initialize offsetPercent with value 0', () => {
      // Access the internal _value property to check initial value
      expect((syncedScrollViewState.offsetPercent as any)._value).toBe(0);
    });

    it('should allow activeScrollView to be updated', () => {
      const testValue = 42;

      syncedScrollViewState.activeScrollView.setValue(testValue);

      expect((syncedScrollViewState.activeScrollView as any)._value).toBe(
        testValue,
      );

      // Reset to 0 for other tests
      syncedScrollViewState.activeScrollView.setValue(0);
    });

    it('should allow offsetPercent to be updated', () => {
      const testValue = 0.75;

      syncedScrollViewState.offsetPercent.setValue(testValue);

      expect((syncedScrollViewState.offsetPercent as any)._value).toBe(
        testValue,
      );

      // Reset to 0 for other tests
      syncedScrollViewState.offsetPercent.setValue(0);
    });
  });

  describe('State Persistence', () => {
    it('should maintain state across multiple renders', () => {
      const TestComponent = () => {
        const context = useContext(SyncedScrollViewContext);

        return (
          <Text testID="state-reference">
            {context === syncedScrollViewState ? 'persistent' : 'changed'}
          </Text>
        );
      };

      const { getByTestId, rerender } = render(
        <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
          <TestComponent />
        </SyncedScrollViewContext.Provider>,
      );

      expect(getByTestId('state-reference').props.children).toBe('persistent');

      // Rerender the component
      rerender(
        <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
          <TestComponent />
        </SyncedScrollViewContext.Provider>,
      );

      expect(getByTestId('state-reference').props.children).toBe('persistent');
    });
  });
});
