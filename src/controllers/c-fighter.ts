import { useMutation, useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

import {
  type UpdateFighterResponse,
  updateFighterStats,
} from '../axios/mutations';

const SAMPLE_FIGHTERS_COUNT = 3;

// Lazy client initialization
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
}

/** Queries */

export function useFightersByGameIdQuery({
  gameId,
  enabled = true,
}: {
  gameId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['fighters', gameId],
    queryFn: async () => {
      if (!gameId) return [];

      console.log(
        '[useFightersByGameIdQuery] Starting DB call to fighters table for gameId:',
        gameId
      );

      const { data: fighters, errors } = await getClient().models.Fighter.list({
        filter: {
          gameId: {
            eq: gameId,
          },
        },
        selectionSet: [
          'id',
          'name',
          'gamePosition',
          'winCount',
          'contestCount',
        ],
      });

      if (errors) {
        console.error(
          '[useFightersByGameIdQuery] Error fetching fighters:',
          errors
        );
        throw new Error('Failed to fetch fighters');
      }

      console.log(
        '[useFightersByGameIdQuery] DB call finished. Found',
        fighters.length,
        'fighters with stats'
      );

      // Log sample fighters to verify data structure
      const samples = fighters.slice(0, SAMPLE_FIGHTERS_COUNT);
      console.log(
        '[useFightersByGameIdQuery] Sample fighters:',
        JSON.stringify(samples, null, 2)
      );

      return fighters;
    },
    enabled: enabled && !!gameId,
  });
}

/** Mutations */

export function useUpdateFighterViaApiMutation({
  onSuccess,
}: {
  onSuccess?: (response: UpdateFighterResponse) => void;
} = {}) {
  return useMutation({
    mutationFn: updateFighterStats,
    onSuccess: response => {
      onSuccess?.(response);
    },
    onError: (error: UpdateFighterResponse) => {
      console.error('Error:', error);
    },
  });
}
