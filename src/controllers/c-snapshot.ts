import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

import { getMTierListSnapshot, type MTierListSnapshot, type SnapshotArrangement } from '../models/m-tier-list-snapshot';

// Lazy client initialization to avoid crashes when Amplify isn't configured (e.g., Expo Go)
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }

  return client;
}

// Reusable selection set
const SNAPSHOT_SELECTION_SET = [
  'id',
  'userId',
  'gameId',
  'name',
  'arrangement',
  'shareCode',
  'createdAt',
  'deletedAt',
] as const;

// Error constants
const ERROR_FAILED_TO_FETCH_SNAPSHOTS = 'Failed to fetch snapshots';
const ERROR_FAILED_TO_CREATE_SNAPSHOT = 'Failed to create snapshot';
const ERROR_SNAPSHOT_NOT_FOUND = 'Snapshot not found';
const ERROR_SHARE_CODE_UNAVAILABLE = 'Share code is already in use';
const ERROR_GAME_MISMATCH = 'Snapshot is for a different game';

/** Interfaces */

interface UserSnapshotsQueryProps {
  userId?: string;
  gameId?: string;
}

interface SnapshotByShareCodeQueryProps {
  shareCode: string;
  gameId: string;
}

interface CreateSnapshotMutationProps {
  onSuccess?: (snapshot: MTierListSnapshot) => void;
  onError?: (error: Error) => void;
}

interface CreateSnapshotParams {
  userId: string;
  gameId: string;
  name: string;
  arrangement: SnapshotArrangement[];
  shareCode: string;
}

interface CloneSnapshotParams {
  userId: string;
  sourceSnapshot: MTierListSnapshot;
}

/** Helper Functions */

/**
 * Generates a share code based on userId.
 * First snapshot: first 5 characters of userId
 * Subsequent: first 3 chars of userId + 2 random alphanumeric
 */
export function generateShareCode(userId: string, isFirstSnapshot: boolean = false): string {
  if (isFirstSnapshot) {
    return userId.substring(0, 5).toUpperCase();
  }

  const prefix = userId.substring(0, 3).toUpperCase();
  const suffix = generateRandomAlphanumeric(2);
  return prefix + suffix;
}

/**
 * Generates random alphanumeric string of specified length
 */
function generateRandomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Checks if a share code is available (not in use)
 */
export async function isShareCodeAvailable(shareCode: string): Promise<boolean> {
  const { data } = await getClient().models.TierListSnapshot.snapshotByShareCode({
    shareCode: shareCode.toUpperCase(),
  });

  return !data || data.length === 0;
}

/** Queries */

/**
 * Fetches all snapshots for a user in a specific game
 */
export const useUserSnapshotsQuery = ({ userId, gameId }: UserSnapshotsQueryProps) =>
  useQuery({
    queryKey: ['userSnapshots', userId, gameId],
    queryFn: async () => {
      if (!userId || !gameId) return [];

      const { data: snapshots, errors } = await getClient().models.TierListSnapshot.snapshotsByUserIdAndCreatedAt(
        {
          userId,
        },
        {
          selectionSet: SNAPSHOT_SELECTION_SET,
        }
      );

      if (errors) {
        console.error('[useUserSnapshotsQuery] Errors:', errors);
        throw new Error(errors[0]?.message || ERROR_FAILED_TO_FETCH_SNAPSHOTS);
      }

      // Filter by gameId on client side (GSI is userId+createdAt)
      const gameSnapshots = (snapshots?.data || [])
        .filter(snapshot => snapshot && snapshot.gameId === gameId && !snapshot.deletedAt)
        .map(snapshot => getMTierListSnapshot(snapshot as Schema['TierListSnapshot']['type']));

      return gameSnapshots;
    },
    enabled: Boolean(userId && gameId),
  });

/**
 * Fetches a snapshot by share code
 */
export const useSnapshotByShareCodeQuery = ({ shareCode, gameId }: SnapshotByShareCodeQueryProps) =>
  useQuery({
    queryKey: ['snapshotByShareCode', shareCode, gameId],
    queryFn: async () => {
      const { data, errors } = await getClient().models.TierListSnapshot.snapshotByShareCode(
        {
          shareCode: shareCode.toUpperCase(),
        },
        {
          selectionSet: SNAPSHOT_SELECTION_SET,
        }
      );

      if (errors) {
        console.error('[useSnapshotByShareCodeQuery] Errors:', errors);
        throw new Error(errors[0]?.message || ERROR_FAILED_TO_FETCH_SNAPSHOTS);
      }

      if (!data || data.length === 0) {
        throw new Error(ERROR_SNAPSHOT_NOT_FOUND);
      }

      const snapshot = data[0];

      // Validate game match
      if (snapshot.gameId !== gameId) {
        throw new Error(ERROR_GAME_MISMATCH);
      }

      return getMTierListSnapshot(snapshot as Schema['TierListSnapshot']['type']);
    },
    enabled: Boolean(shareCode && shareCode.length >= 5),
  });

/** Mutations */

/**
 * Creates a new tier list snapshot
 */
export const useCreateSnapshotMutation = ({ onSuccess, onError }: CreateSnapshotMutationProps = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, gameId, name, arrangement, shareCode }: CreateSnapshotParams) => {
      // Verify share code is available
      const isAvailable = await isShareCodeAvailable(shareCode);
      if (!isAvailable) {
        throw new Error(ERROR_SHARE_CODE_UNAVAILABLE);
      }

      const { data: snapshot, errors } = await getClient().models.TierListSnapshot.create({
        userId,
        gameId,
        name,
        arrangement: JSON.stringify(arrangement),
        shareCode: shareCode.toUpperCase(),
      });

      if (errors || !snapshot) {
        console.error('[useCreateSnapshotMutation] Errors:', errors);
        throw new Error(errors?.[0]?.message || ERROR_FAILED_TO_CREATE_SNAPSHOT);
      }

      return getMTierListSnapshot(snapshot as Schema['TierListSnapshot']['type']);
    },
    onSuccess: (snapshot, variables) => {
      // Invalidate user snapshots query
      queryClient.invalidateQueries({ queryKey: ['userSnapshots', variables.userId, variables.gameId] });
      onSuccess?.(snapshot);
    },
    onError: (error: Error) => {
      console.error('[useCreateSnapshotMutation] Error:', error);
      onError?.(error);
    },
  });
};

/**
 * Clones an existing snapshot for the current user (used when importing)
 */
export const useCloneSnapshotMutation = ({ onSuccess, onError }: CreateSnapshotMutationProps = {}) => {
  const createMutation = useCreateSnapshotMutation({ onSuccess, onError });

  return useMutation({
    mutationFn: async ({ userId, sourceSnapshot }: CloneSnapshotParams) => {
      // Parse arrangement from source
      const arrangement = JSON.parse(sourceSnapshot.arrangement as string) as SnapshotArrangement[];

      // Generate new share code for the cloned snapshot
      let shareCode = generateShareCode(userId, false);
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure unique share code
      while (!(await isShareCodeAvailable(shareCode)) && attempts < maxAttempts) {
        shareCode = generateShareCode(userId, false);
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error(ERROR_SHARE_CODE_UNAVAILABLE);
      }

      // Create the cloned snapshot
      return createMutation.mutateAsync({
        userId,
        gameId: sourceSnapshot.gameId,
        name: sourceSnapshot.name,
        arrangement,
        shareCode,
      });
    },
  });
};
