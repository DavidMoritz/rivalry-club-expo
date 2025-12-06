import { generateClient } from 'aws-amplify/data';
import { useEffect, useState } from 'react';

import type { Schema } from '../../amplify/data/resource';

interface RivalryWithUsers {
  id: string;
  userAId: string;
  userBId: string;
  gameId: string;
  contestCount: number;
  updatedAt: string;
  userAName?: string;
  userBName?: string;
}

interface UseUserRivalriesResult {
  rivalries: RivalryWithUsers[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch all rivalries for the current user and populate user names
 */
export function useUserRivalries(userId: string | undefined): UseUserRivalriesResult {
  const [rivalries, setRivalries] = useState<RivalryWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function fetchRivalries() {
    if (!userId) {
      setIsLoading(false);

      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const client = generateClient<Schema>();

      // Fetch all rivalries
      const { data: allRivalries, errors } = await client.models.Rivalry.list();

      if (errors && errors.length > 0) {
        throw new Error(`Failed to fetch rivalries: ${errors[0].message}`);
      }

      // Filter rivalries where the user is either userA or userB and rivalry is accepted
      const userRivalries = (allRivalries || []).filter(
        (rivalry) => (rivalry.userAId === userId || rivalry.userBId === userId) && rivalry.accepted === true
      );

      // Get unique user IDs we need to fetch
      const userIds = new Set<string>();

      userRivalries.forEach((rivalry) => {
        userIds.add(rivalry.userAId);
        userIds.add(rivalry.userBId);
      });

      // Fetch all users in parallel
      const userPromises = Array.from(userIds).map((id) =>
        client.models.User.get({ id })
      );

      const userResults = await Promise.all(userPromises);

      // Create a map of userId -> firstName
      const userMap = new Map<string, string>();

      userResults.forEach((result) => {
        if (result.data) {
          userMap.set(result.data.id, result.data.firstName || result.data.email);
        }
      });

      // Map rivalries with user names
      const rivalriesWithUsers: RivalryWithUsers[] = userRivalries.map((rivalry) => ({
        id: rivalry.id,
        userAId: rivalry.userAId,
        userBId: rivalry.userBId,
        gameId: rivalry.gameId,
        contestCount: rivalry.contestCount || 0,
        updatedAt: rivalry.updatedAt,
        userAName: userMap.get(rivalry.userAId),
        userBName: userMap.get(rivalry.userBId)
      }));

      // Sort by most recently updated
      rivalriesWithUsers.sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      setRivalries(rivalriesWithUsers);
    } catch (err) {
      console.error('[useUserRivalries] Error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRivalries();
  }, [userId]);

  return {
    rivalries,
    isLoading,
    error,
    refetch: fetchRivalries
  };
}
