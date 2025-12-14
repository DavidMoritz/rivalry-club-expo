import { generateClient } from 'aws-amplify/data';
import { useCallback, useEffect, useState } from 'react';

import type { Schema } from '../../amplify/data/resource';

interface RivalryWithUsers {
  id: string;
  userAId: string;
  userBId: string;
  gameId: string;
  contestCount: number;
  updatedAt: string;
  accepted?: boolean | null;
  hiddenByA?: boolean | null;
  hiddenByB?: boolean | null;
  userAName?: string;
  userBName?: string;
}

interface UseUserRivalriesResult {
  rivalries: RivalryWithUsers[];
  allRivalries: RivalryWithUsers[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UserData {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

function buildUserFullName(user: UserData): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  return user.firstName || user.email;
}

interface RivalryData {
  id: string;
  userAId: string;
  userBId: string;
  gameId: string;
  contestCount?: number | null;
  updatedAt: string;
  accepted?: boolean | null;
  hiddenByA?: boolean | null;
  hiddenByB?: boolean | null;
}

function mapRivalryWithUsers(
  rivalry: RivalryData,
  userMap: Map<string, string>
): RivalryWithUsers {
  return {
    id: rivalry.id,
    userAId: rivalry.userAId,
    userBId: rivalry.userBId,
    gameId: rivalry.gameId,
    contestCount: rivalry.contestCount || 0,
    updatedAt: rivalry.updatedAt,
    accepted: rivalry.accepted,
    hiddenByA: rivalry.hiddenByA,
    hiddenByB: rivalry.hiddenByB,
    userAName: userMap.get(rivalry.userAId),
    userBName: userMap.get(rivalry.userBId),
  };
}

function sortByUpdatedAtDesc(a: RivalryWithUsers, b: RivalryWithUsers): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function collectUserIds(rivalries: RivalryData[]): Set<string> {
  const userIds = new Set<string>();

  for (const rivalry of rivalries) {
    userIds.add(rivalry.userAId);
    userIds.add(rivalry.userBId);
  }

  return userIds;
}

function buildUserMap(
  userResults: { data: UserData | null }[]
): Map<string, string> {
  const userMap = new Map<string, string>();

  for (const result of userResults) {
    if (result.data) {
      userMap.set(result.data.id, buildUserFullName(result.data));
    }
  }

  return userMap;
}

/**
 * Hook to fetch all rivalries for the current user and populate user names
 */
export function useUserRivalries(
  userId: string | undefined
): UseUserRivalriesResult {
  const [rivalries, setRivalries] = useState<RivalryWithUsers[]>([]);
  const [allRivalries, setAllRivalries] = useState<RivalryWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRivalries = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);

      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const client = generateClient<Schema>();

      // Fetch all rivalries
      const { data: fetchedRivalries, errors } =
        await client.models.Rivalry.list();

      if (errors && errors.length > 0) {
        throw new Error(`Failed to fetch rivalries: ${errors[0].message}`);
      }

      // Filter rivalries where the user is either userA or userB (both accepted and pending)
      const userRivalries = (fetchedRivalries || []).filter(
        rivalry => rivalry.userAId === userId || rivalry.userBId === userId
      );

      // Separate accepted rivalries for the return value (backwards compatibility)
      const acceptedRivalries = userRivalries.filter(
        rivalry => rivalry.accepted === true
      );

      // Get unique user IDs and fetch users in parallel
      const userIds = collectUserIds(userRivalries);
      const userPromises = Array.from(userIds).map(id =>
        client.models.User.get({ id })
      );
      const userResults = await Promise.all(userPromises);
      const userMap = buildUserMap(userResults);

      // Map ALL rivalries (accepted and pending) with user names
      const allRivalriesWithUsers = userRivalries.map(rivalry =>
        mapRivalryWithUsers(rivalry, userMap)
      );

      // Map only accepted rivalries for backwards compatibility
      const acceptedRivalriesWithUsers = acceptedRivalries
        .map(rivalry => mapRivalryWithUsers(rivalry, userMap))
        .sort(sortByUpdatedAtDesc);

      setRivalries(acceptedRivalriesWithUsers);
      setAllRivalries(allRivalriesWithUsers);
    } catch (err) {
      console.error('[useUserRivalries] Error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRivalries();
  }, [fetchRivalries]);

  return {
    rivalries,
    allRivalries,
    isLoading,
    error,
    refetch: fetchRivalries,
  };
}
