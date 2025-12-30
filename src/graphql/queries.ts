/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const contestsByRivalryIdAndCreatedAt = /* GraphQL */ `query ContestsByRivalryIdAndCreatedAt(
  $createdAt: ModelStringKeyConditionInput
  $filter: ModelContestFilterInput
  $limit: Int
  $nextToken: String
  $rivalryId: ID!
  $sortDirection: ModelSortDirection
) {
  contestsByRivalryIdAndCreatedAt(
    createdAt: $createdAt
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    rivalryId: $rivalryId
    sortDirection: $sortDirection
  ) {
    items {
      bias
      createdAt
      deletedAt
      id
      result
      rivalryId
      tierSlotAId
      tierSlotBId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ContestsByRivalryIdAndCreatedAtQueryVariables,
  APITypes.ContestsByRivalryIdAndCreatedAtQuery
>;
export const getContest = /* GraphQL */ `query GetContest($id: ID!) {
  getContest(id: $id) {
    bias
    createdAt
    deletedAt
    id
    result
    rivalry {
      accepted
      contestCount
      createdAt
      currentContestId
      deletedAt
      gameId
      hiddenByA
      hiddenByB
      id
      updatedAt
      userAId
      userBId
      __typename
    }
    rivalryId
    tierSlotAId
    tierSlotBId
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetContestQueryVariables,
  APITypes.GetContestQuery
>;
export const getFighter = /* GraphQL */ `query GetFighter($id: ID!) {
  getFighter(id: $id) {
    contestCount
    createdAt
    game {
      createdAt
      deletedAt
      id
      name
      updatedAt
      __typename
    }
    gameId
    gamePosition
    id
    name
    tierBreakdown
    tierSlots {
      nextToken
      __typename
    }
    updatedAt
    winCount
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetFighterQueryVariables,
  APITypes.GetFighterQuery
>;
export const getGame = /* GraphQL */ `query GetGame($id: ID!) {
  getGame(id: $id) {
    createdAt
    deletedAt
    fighters {
      nextToken
      __typename
    }
    id
    name
    rivalries {
      nextToken
      __typename
    }
    snapshots {
      nextToken
      __typename
    }
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetGameQueryVariables, APITypes.GetGameQuery>;
export const getRivalry = /* GraphQL */ `query GetRivalry($id: ID!) {
  getRivalry(id: $id) {
    accepted
    contestCount
    contests {
      nextToken
      __typename
    }
    createdAt
    currentContestId
    deletedAt
    game {
      createdAt
      deletedAt
      id
      name
      updatedAt
      __typename
    }
    gameId
    hiddenByA
    hiddenByB
    id
    tierLists {
      nextToken
      __typename
    }
    updatedAt
    userAId
    userBId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetRivalryQueryVariables,
  APITypes.GetRivalryQuery
>;
export const getTierList = /* GraphQL */ `query GetTierList($id: ID!) {
  getTierList(id: $id) {
    createdAt
    deletedAt
    id
    rivalry {
      accepted
      contestCount
      createdAt
      currentContestId
      deletedAt
      gameId
      hiddenByA
      hiddenByB
      id
      updatedAt
      userAId
      userBId
      __typename
    }
    rivalryId
    standing
    tierSlots {
      nextToken
      __typename
    }
    updatedAt
    userId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTierListQueryVariables,
  APITypes.GetTierListQuery
>;
export const getTierListSnapshot = /* GraphQL */ `query GetTierListSnapshot($id: ID!) {
  getTierListSnapshot(id: $id) {
    arrangement
    createdAt
    deletedAt
    game {
      createdAt
      deletedAt
      id
      name
      updatedAt
      __typename
    }
    gameId
    id
    name
    shareCode
    updatedAt
    userId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTierListSnapshotQueryVariables,
  APITypes.GetTierListSnapshotQuery
>;
export const getTierSlot = /* GraphQL */ `query GetTierSlot($id: ID!) {
  getTierSlot(id: $id) {
    contestCount
    createdAt
    deletedAt
    fighter {
      contestCount
      createdAt
      gameId
      gamePosition
      id
      name
      tierBreakdown
      updatedAt
      winCount
      __typename
    }
    fighterId
    id
    position
    tierList {
      createdAt
      deletedAt
      id
      rivalryId
      standing
      updatedAt
      userId
      __typename
    }
    tierListId
    updatedAt
    winCount
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTierSlotQueryVariables,
  APITypes.GetTierSlotQuery
>;
export const getUser = /* GraphQL */ `query GetUser($id: ID!) {
  getUser(id: $id) {
    awsSub
    createdAt
    deletedAt
    email
    firstName
    id
    lastName
    role
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listContests = /* GraphQL */ `query ListContests(
  $filter: ModelContestFilterInput
  $limit: Int
  $nextToken: String
) {
  listContests(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      bias
      createdAt
      deletedAt
      id
      result
      rivalryId
      tierSlotAId
      tierSlotBId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListContestsQueryVariables,
  APITypes.ListContestsQuery
>;
export const listFighters = /* GraphQL */ `query ListFighters(
  $filter: ModelFighterFilterInput
  $limit: Int
  $nextToken: String
) {
  listFighters(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      contestCount
      createdAt
      gameId
      gamePosition
      id
      name
      tierBreakdown
      updatedAt
      winCount
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListFightersQueryVariables,
  APITypes.ListFightersQuery
>;
export const listGames = /* GraphQL */ `query ListGames(
  $filter: ModelGameFilterInput
  $limit: Int
  $nextToken: String
) {
  listGames(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      deletedAt
      id
      name
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListGamesQueryVariables, APITypes.ListGamesQuery>;
export const listRivalries = /* GraphQL */ `query ListRivalries(
  $filter: ModelRivalryFilterInput
  $limit: Int
  $nextToken: String
) {
  listRivalries(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      accepted
      contestCount
      createdAt
      currentContestId
      deletedAt
      gameId
      hiddenByA
      hiddenByB
      id
      updatedAt
      userAId
      userBId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListRivalriesQueryVariables,
  APITypes.ListRivalriesQuery
>;
export const listTierListSnapshots = /* GraphQL */ `query ListTierListSnapshots(
  $filter: ModelTierListSnapshotFilterInput
  $limit: Int
  $nextToken: String
) {
  listTierListSnapshots(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      arrangement
      createdAt
      deletedAt
      gameId
      id
      name
      shareCode
      updatedAt
      userId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListTierListSnapshotsQueryVariables,
  APITypes.ListTierListSnapshotsQuery
>;
export const listTierLists = /* GraphQL */ `query ListTierLists(
  $filter: ModelTierListFilterInput
  $limit: Int
  $nextToken: String
) {
  listTierLists(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      deletedAt
      id
      rivalryId
      standing
      updatedAt
      userId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListTierListsQueryVariables,
  APITypes.ListTierListsQuery
>;
export const listTierSlots = /* GraphQL */ `query ListTierSlots(
  $filter: ModelTierSlotFilterInput
  $limit: Int
  $nextToken: String
) {
  listTierSlots(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      contestCount
      createdAt
      deletedAt
      fighterId
      id
      position
      tierListId
      updatedAt
      winCount
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListTierSlotsQueryVariables,
  APITypes.ListTierSlotsQuery
>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
) {
  listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      awsSub
      createdAt
      deletedAt
      email
      firstName
      id
      lastName
      role
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
export const snapshotByShareCode = /* GraphQL */ `query SnapshotByShareCode(
  $filter: ModelTierListSnapshotFilterInput
  $limit: Int
  $nextToken: String
  $shareCode: String!
  $sortDirection: ModelSortDirection
) {
  snapshotByShareCode(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    shareCode: $shareCode
    sortDirection: $sortDirection
  ) {
    items {
      arrangement
      createdAt
      deletedAt
      gameId
      id
      name
      shareCode
      updatedAt
      userId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SnapshotByShareCodeQueryVariables,
  APITypes.SnapshotByShareCodeQuery
>;
export const snapshotsByUserIdAndCreatedAt = /* GraphQL */ `query SnapshotsByUserIdAndCreatedAt(
  $createdAt: ModelStringKeyConditionInput
  $filter: ModelTierListSnapshotFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
  $userId: ID!
) {
  snapshotsByUserIdAndCreatedAt(
    createdAt: $createdAt
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
    userId: $userId
  ) {
    items {
      arrangement
      createdAt
      deletedAt
      gameId
      id
      name
      shareCode
      updatedAt
      userId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SnapshotsByUserIdAndCreatedAtQueryVariables,
  APITypes.SnapshotsByUserIdAndCreatedAtQuery
>;
export const tierListsByUserIdAndUpdatedAt = /* GraphQL */ `query TierListsByUserIdAndUpdatedAt(
  $filter: ModelTierListFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
  $updatedAt: ModelStringKeyConditionInput
  $userId: ID!
) {
  tierListsByUserIdAndUpdatedAt(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
    updatedAt: $updatedAt
    userId: $userId
  ) {
    items {
      createdAt
      deletedAt
      id
      rivalryId
      standing
      updatedAt
      userId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TierListsByUserIdAndUpdatedAtQueryVariables,
  APITypes.TierListsByUserIdAndUpdatedAtQuery
>;
