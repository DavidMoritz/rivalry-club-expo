import { upperFirst } from 'lodash';
import * as APITypes from '../API';
import {
  GetBasicUserQuery,
  ListGamesWithFightersQuery,
  RivalryWithAllInfoQuery,
  UpdateContestTierListsMutation,
  UpdateContestTierListsMutationInputs,
  UpdateMultipleTierSlotsMutation,
  UpdateMultipleTierSlotsMutationInputs,
  UsersWithRivalriesByAwsSubQuery,
} from '../custom-api';

type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getBasicUser = /* GraphQL */ `query GetBasicUser($id: ID!) {
  getUser(id: $id) {
    id
    email
    firstName
    lastName
    role
    awsSub
    createdAt
    updatedAt
    deletedAt
  }
}
` as GeneratedQuery<APITypes.GetUserQueryVariables, GetBasicUserQuery>;

export const listGamesWithFighters = /* GraphQL */ `query ListGamesWithFighters(
  $filter: ModelGameFilterInput
  $limit: Int
  $nextToken: String) {
  listGames(filter: $filter, limit: $limit, nextToken: $nextToken) {
    nextToken
    items {
      id
      name
      fighters(sortDirection: ASC) {
        nextToken
        items {
          id
          name
          gamePosition
          contestCount
          winCount
          tierBreakdown
        }
      }
    }
  }
}
` as GeneratedQuery<
  APITypes.ListGamesQueryVariables,
  ListGamesWithFightersQuery
>;

export const usersWithRivalriesByAwsSub =
  /* GraphQL */ `query UsersWithRivalriesByAwsSub($awsSub: String!) {
  usersByAwsSub(awsSub: $awsSub) {
    items {
      id
      email
      firstName
      lastName
      role
      awsSub
      createdAt
      updatedAt
      rivalriesA(limit: 100) {
        nextToken
        items {
          id
          userAId
          userBId
          gameId
          currentContestId
          contestCount
          createdAt
          updatedAt
        }
      }
      rivalriesB(limit: 100) {
        nextToken
        items {
          id
          userAId
          userBId
          gameId
          currentContestId
          contestCount
          createdAt
          updatedAt
        }
      }
    }
  }
}
` as GeneratedQuery<
    APITypes.UsersByAwsSubQueryVariables,
    UsersWithRivalriesByAwsSubQuery
  >;

export const getRivalryWithAllInfo =
  /* GraphQL */ `query GetRivalryWithContestsAndTierListsAndSlots($id: ID!) {
  getRivalry(id: $id) {
    id
    userAId
    userBId
    gameId
    contestCount
    currentContestId # to be determined
    createdAt
    updatedAt
    deletedAt
    contests(limit: 100, sortDirection: DESC) {
      items {
        id
        rivalryId
        tierSlotAId
        tierSlotBId
        result
        bias
        createdAt
        updatedAt
        deletedAt
      }
    }
    tierLists(sortDirection: DESC) {
      nextToken
      items {
        id
        rivalryId
        standing
        createdAt
        updatedAt
        deletedAt
        userId
        tierSlots(sortDirection: DESC) {
          nextToken
          items {
            id
            tierListId
            fighterId
            position
            contestCount
            winCount
            createdAt
            updatedAt
            deletedAt
          }
        }
      }
    }
  }
}
` as GeneratedQuery<APITypes.GetRivalryQueryVariables, RivalryWithAllInfoQuery>;

export const updateContestTierLists = /* GraphQL */ `
    mutation UpdateContestTierLists(
      $tierListA: UpdateTierListInput!,
      $tierListB: UpdateTierListInput!
    ) {
      tierListAResult: updateTierList(input: $tierListA) {
        id
        rivalryId
        userId
        standing
        createdAt
        updatedAt
        deletedAt
      }
      tierListBResult: updateTierList(input: $tierListB) {
        id
        rivalryId
        userId
        standing
        createdAt
        updatedAt
        deletedAt
      }
    }
  ` as GeneratedQuery<
  UpdateContestTierListsMutationInputs,
  UpdateContestTierListsMutation
>;

/**
 * Generate multi-query GraphQL string to look something like this:
 *
 * mutation UpdateMultipleTierSlots(
 *   $tierSlot1: UpdateTierSlotInput!,
 *   $tierSlot2: UpdateTierSlotInput!,
 * ) {
 *   q1: updateTierSlot(input: $tierSlot1) { id }
 *   q2: updateTierSlot(input: $tierSlot2) { id }
 * }
 */
const generateMultiQuery = ({
  graphQlVerb = 'get',
  itemCount,
  itemType, // camelCase
  returnProps = ['id'],
}: {
  graphQlVerb?: 'create' | 'delete' | 'get' | 'update';
  itemCount: number;
  itemType: string;
  returnProps?: string[];
}) => {
  const upperSectLines = [];
  const lowerSectLines = [];
  const mutationOrQuery = graphQlVerb === 'get' ? 'query' : 'mutation';
  const title = `${upperFirst(graphQlVerb)}Multiple${upperFirst(itemType)}`;
  const query = `${graphQlVerb}${upperFirst(itemType)}`;
  const inputTypeStr = `${upperFirst(graphQlVerb)}${upperFirst(itemType)}Input`;
  const varName = `$${itemType}`;

  for (let i = 0; i < itemCount; i++) {
    upperSectLines[i] = `${varName}${i}: ${inputTypeStr}!`;
    lowerSectLines[
      i
    ] = `q${i}: ${query}(input: ${varName}${i}) { ${returnProps.join(' ')} }`;
  }

  return `
    ${mutationOrQuery} ${title} (
      ${upperSectLines.join(',\n')}
    ) {
      ${lowerSectLines.join('\n')}
    }
  `;
};

export function generateUpdateMultipleTierSlotsQuery(tierSlotsCount: number) {
  return generateMultiQuery({
    graphQlVerb: 'update',
    itemCount: tierSlotsCount,
    itemType: 'tierSlot',
    returnProps: ['id', 'position'],
  }) as GeneratedQuery<
    UpdateMultipleTierSlotsMutationInputs,
    UpdateMultipleTierSlotsMutation
  >;
}
