import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import * as mutations from '../../src/axios/mutations';
import { useUpdateFighterViaApiMutation } from '../../src/controllers/c-fighter';

jest.mock('../../src/axios/mutations');

describe('c-fighter Controller', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('useUpdateFighterViaApiMutation', () => {
    it('should call updateFighterStats mutation', async () => {
      const mockResponse = { body: 'Success', statusCode: '200' };

      (mutations.updateFighterStats as jest.Mock).mockResolvedValue(
        mockResponse
      );

      const { result } = renderHook(() => useUpdateFighterViaApiMutation(), {
        wrapper,
      });

      result.current.mutate({
        fighterId: 'fighter-123',
        didWin: true,
        tier: 'S',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mutations.updateFighterStats).toHaveBeenCalledTimes(1);

      // React Query passes the mutation variables as the first argument
      const callArgs = (mutations.updateFighterStats as jest.Mock).mock
        .calls[0];

      expect(callArgs[0]).toEqual({
        fighterId: 'fighter-123',
        didWin: true,
        tier: 'S',
      });
    });

    it('should call onSuccess callback on successful mutation', async () => {
      const mockResponse = { body: 'Success', statusCode: '200' };
      const onSuccess = jest.fn();

      (mutations.updateFighterStats as jest.Mock).mockResolvedValue(
        mockResponse
      );

      const { result } = renderHook(
        () => useUpdateFighterViaApiMutation({ onSuccess }),
        { wrapper }
      );

      result.current.mutate({
        fighterId: 'fighter-123',
        didWin: false,
        tier: 'B',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle errors correctly', async () => {
      const mockError = new Error('Network error');

      (mutations.updateFighterStats as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useUpdateFighterViaApiMutation(), {
        wrapper,
      });

      result.current.mutate({
        fighterId: 'fighter-123',
        didWin: true,
        tier: 'A',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.error).toBe(mockError);
    });

    it('should pass correct mutation variables to updateFighterStats', async () => {
      const mockResponse = { body: 'Success', statusCode: '200' };

      (mutations.updateFighterStats as jest.Mock).mockResolvedValue(
        mockResponse
      );

      const { result } = renderHook(() => useUpdateFighterViaApiMutation(), {
        wrapper,
      });

      const mutationVariables = {
        fighterId: 'fighter-456',
        didWin: false,
        tier: 'C',
      };

      result.current.mutate(mutationVariables);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mutations.updateFighterStats).toHaveBeenCalledTimes(1);

      // React Query passes the mutation variables as the first argument
      const callArgs = (mutations.updateFighterStats as jest.Mock).mock
        .calls[0];

      expect(callArgs[0]).toEqual(mutationVariables);
    });
  });
});
