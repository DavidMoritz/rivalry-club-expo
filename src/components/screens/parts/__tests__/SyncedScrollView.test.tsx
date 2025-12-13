import { render } from '@testing-library/react-native';
import React from 'react';
import { Animated, Text, View } from 'react-native';
import {
  SyncedScrollViewContext,
  syncedScrollViewState,
} from '../../../../providers/scroll-view';
import { SyncedScrollView } from '../SyncedScrollView';

describe('SyncedScrollView', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
        <SyncedScrollView id={1}>
          <Text>Test Content</Text>
        </SyncedScrollView>
      </SyncedScrollViewContext.Provider>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('renders with unlinked prop', () => {
    const { getByText } = render(
      <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
        <SyncedScrollView id={1} unlinked={true}>
          <Text>Test Content</Text>
        </SyncedScrollView>
      </SyncedScrollViewContext.Provider>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('accepts ScrollView props', () => {
    const { getByText } = render(
      <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
        <SyncedScrollView horizontal={true} id={1}>
          <Text>Horizontal Content</Text>
        </SyncedScrollView>
      </SyncedScrollViewContext.Provider>
    );

    expect(getByText('Horizontal Content')).toBeTruthy();
  });

  it('renders multiple synced scroll views', () => {
    const { getByText } = render(
      <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
        <View>
          <SyncedScrollView id={1}>
            <Text>Scroll View 1</Text>
          </SyncedScrollView>
          <SyncedScrollView id={2}>
            <Text>Scroll View 2</Text>
          </SyncedScrollView>
        </View>
      </SyncedScrollViewContext.Provider>
    );

    expect(getByText('Scroll View 1')).toBeTruthy();
    expect(getByText('Scroll View 2')).toBeTruthy();
  });
});
