import {
  UpdateTierListMutationVariables,
  UpdateTierSlotMutationVariables,
} from './API';

export type GetBasicUserQuery = {
  getUser?: {
    __typename: 'User';
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: number;
    awsSub: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  } | null;
};

export type ListGamesWithFightersQuery = {
  listGames?: {
    __typename: 'ModelGameConnection';
    items: Array<{
      __typename: 'Game';
      id: string;
      name: string;
      fighters: {
        __typename: 'ModelFighterConnection';
        items: Array<{
          __typename: 'Fighter';
          id: string;
          name: string;
          gamePosition?: number | null;
          contestCount?: number | null;
          winCount?: number | null;
          tierBreakdown?: string | null;
        } | null>;
        nextToken?: string | null;
      } | null;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type UsersWithRivalriesByAwsSubQuery = {
  usersByAwsSub?: {
    __typename: 'ModelUserConnection';
    items: Array<{
      __typename: 'User';
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      role: number;
      awsSub: string;
      createdAt: string;
      updatedAt: string;
      rivalriesA: {
        __typename: 'ModelRivalryConnection';
        items: Array<{
          __typename: 'Rivalry';
          id: string;
          userAId: string;
          userBId: string;
          createdAt: string;
          updatedAt: string;
          gameId: string;
          contestCount: number;
        } | null>;
        nextToken?: string | null;
      } | null;
      rivalriesB: {
        __typename: 'ModelRivalryConnection';
        items: Array<{
          __typename: 'Rivalry';
          id: string;
          userAId: string;
          userBId: string;
          createdAt: string;
          updatedAt: string;
          gameId: string;
          contestCount: number;
        } | null>;
        nextToken?: string | null;
      } | null;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type RivalryWithAllInfoQuery = {
  getRivalry?: {
    __typename: 'Rivalry';
    id: string;
    userAId: string;
    userBId: string;
    gameId: string;
    currentContestId?: string | null;
    contestCount: number;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    contests: {
      __typename: 'ModelContestConnection';
      items: Array<{
        getContest?: {
          __typename: 'Contest';
          id: string;
          rivalryId: string;
          tierSlotAId: string;
          tierSlotBId: string;
          result?: number | null;
          bias?: number | null;
          createdAt: string;
          updatedAt: string;
          deletedAt?: string | null;
        } | null;
      } | null>;
      nextToken?: string | null;
    } | null;
    tierLists?: {
      __typename: 'ModelTierListConnection';
      items: Array<{
        getTierList?: {
          __typename: 'TierList';
          id: string;
          rivalryId: string;
          userId: string;
          standing?: number | null;
          createdAt: string;
          updatedAt: string;
          deletedAt?: string | null;
          tierSlots?: {
            __typename: 'ModelTierSlotConnection';
            items: Array<{
              getTierSlot?: {
                __typename: 'TierSlot';
                id: string;
                tierListId: string;
                fighterId: string;
                position?: number | null;
                contestCount?: number | null;
                winCount?: number | null;
                createdAt: string;
                updatedAt: string;
                deletedAt?: string | null;
              } | null;
            } | null>;
            nextToken?: string | null;
          } | null;
        } | null;
      } | null>;
      nextToken?: string | null;
    } | null;
  } | null;
};

export type UpdateContestTierListsMutationInputs = {
  tierListA: UpdateTierListMutationVariables;
  tierListB: UpdateTierListMutationVariables;
};

export type UpdateMultipleTierSlotsMutationInputs = Record<
  string,
  UpdateTierSlotMutationVariables
>;

export type UpdateContestTierListsMutation = {
  tierListAResult: {
    __typename: 'TierList';
    id: string;
    rivalryId: string;
    userId: string;
    standing?: number | null;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  } | null;
  tierListBResult: {
    __typename: 'TierList';
    id: string;
    rivalryId: string;
    userId: string;
    standing?: number | null;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  } | null;
};

export type UpdateMultipleTierSlotsMutation = Record<
  string,
  {
    contestCount: number;
    id: string;
    position: number;
    winCount: number;
  }
>;
