import { useMutation } from '@tanstack/react-query';

import { UpdateFighterResponse, updateFighterStats } from '../axios/mutations';

/** Queries */

/** Mutations */

export function useUpdateFighterViaApiMutation({
  onSuccess,
}: {
  onSuccess?: (response: UpdateFighterResponse) => void;
} = {}) {
  return useMutation({
    mutationFn: updateFighterStats,
    onSuccess: response => {
      console.log('Success:', response);
      onSuccess?.(response);
    },
    onError: (error: UpdateFighterResponse) => {
      console.error('Error:', error);
    },
  });
}
