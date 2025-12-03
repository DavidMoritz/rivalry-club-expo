import api from './api';

interface UpdateFighterViaApiProps {
  fighterId: string;
  didWin: boolean;
  tier: string;
}

export interface UpdateFighterResponse {
  body: string;
  statusCode: string;
  // You can add other fields based on the actual response format
}

export const updateFighterStats = async ({
  fighterId,
  didWin,
  tier,
}: UpdateFighterViaApiProps): Promise<UpdateFighterResponse> => {
  const response = await api.post('/update-fighter-stats', {
    fighterId,
    didWin,
    tier,
  });

  return response.data; // This will be returned by the mutation
};
