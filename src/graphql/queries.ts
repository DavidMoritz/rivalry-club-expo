/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

// import * as APITypes from "../API"; // Not needed with Gen 2
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getContest = /* GraphQL */ `query GetContest($id: ID!) {
  getContest(id: $id) {
    id
    rivalryId
    tierSlotAId
    tierSlotBId
    result
    bias
    createdAt
    updatedAt
    deletedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetContestQueryVariables,
  APITypes.GetContestQuery
>;
export const listContests = /* GraphQL */ `query ListContests(
  $filter: ModelContestFilterInput
  $limit: Int
  $nextToken: String
) {
  listContests(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
export const getFighter = /* GraphQL */ `query GetFighter($id: ID!) {
  getFighter(id: $id) {
    id
    name
    gameId
    gamePosition
    contestCount
    winCount
    tierBreakdown
    createdAt
    updatedAt
    tierSlots {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetFighterQueryVariables,
  APITypes.GetFighterQuery
>;
export const listFighters = /* GraphQL */ `query ListFighters(
  $filter: ModelFighterFilterInput
  $limit: Int
  $nextToken: String
) {
  listFighters(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      gameId
      gamePosition
      contestCount
      winCount
      tierBreakdown
      createdAt
      updatedAt
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
export const getGame = /* GraphQL */ `query GetGame($id: ID!) {
  getGame(id: $id) {
    id
    name
    createdAt
    updatedAt
    deletedAt
    fighters {
      nextToken
      __typename
    }
    rivalries {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<APITypes.GetGameQueryVariables, APITypes.GetGameQuery>;
export const listGames = /* GraphQL */ `query ListGames(
  $filter: ModelGameFilterInput
  $limit: Int
  $nextToken: String
) {
  listGames(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      createdAt
      updatedAt
      deletedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListGamesQueryVariables, APITypes.ListGamesQuery>;
export const getRivalry = /* GraphQL */ `query GetRivalry($id: ID!) {
  getRivalry(id: $id) {
    id
    userAId
    userBId
    gameId
    contestCount
    currentContestId
    createdAt
    updatedAt
    deletedAt
    contests {
      nextToken
      __typename
    }
    tierLists {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetRivalryQueryVariables,
  APITypes.GetRivalryQuery
>;
export const listRivalries = /* GraphQL */ `query ListRivalries(
  $filter: ModelRivalryFilterInput
  $limit: Int
  $nextToken: String
) {
  listRivalries(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userAId
      userBId
      gameId
      contestCount
      currentContestId
      createdAt
      updatedAt
      deletedAt
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
export const getTierList = /* GraphQL */ `query GetTierList($id: ID!) {
  getTierList(id: $id) {
    id
    rivalryId
    userId
    standing
    createdAt
    updatedAt
    deletedAt
    tierSlots {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTierListQueryVariables,
  APITypes.GetTierListQuery
>;
export const listTierLists = /* GraphQL */ `query ListTierLists(
  $filter: ModelTierListFilterInput
  $limit: Int
  $nextToken: String
) {
  listTierLists(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      rivalryId
      userId
      standing
      createdAt
      updatedAt
      deletedAt
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
export const getTierSlot = /* GraphQL */ `query GetTierSlot($id: ID!) {
  getTierSlot(id: $id) {
    id
    tierListId
    fighterId
    position
    contestCount
    winCount
    createdAt
    updatedAt
    deletedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTierSlotQueryVariables,
  APITypes.GetTierSlotQuery
>;
export const listTierSlots = /* GraphQL */ `query ListTierSlots(
  $filter: ModelTierSlotFilterInput
  $limit: Int
  $nextToken: String
) {
  listTierSlots(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
export const getUser = /* GraphQL */ `query GetUser($id: ID!) {
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
    rivalriesA {
      nextToken
      __typename
    }
    rivalriesB {
      nextToken
      __typename
    }
    tierLists {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $id: ID
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listUsers(
    id: $id
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      id
      email
      firstName
      lastName
      role
      awsSub
      createdAt
      updatedAt
      deletedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
export const contestsByRivalryIdAndCreatedAt = /* GraphQL */ `query ContestsByRivalryIdAndCreatedAt(
  $rivalryId: ID!
  $createdAt: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelContestFilterInput
  $limit: Int
  $nextToken: String
) {
  contestsByRivalryIdAndCreatedAt(
    rivalryId: $rivalryId
    createdAt: $createdAt
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
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
export const fightersByGameIdAndGamePosition = /* GraphQL */ `query FightersByGameIdAndGamePosition(
  $gameId: ID!
  $gamePosition: ModelIntKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelFighterFilterInput
  $limit: Int
  $nextToken: String
) {
  fightersByGameIdAndGamePosition(
    gameId: $gameId
    gamePosition: $gamePosition
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      name
      gameId
      gamePosition
      contestCount
      winCount
      tierBreakdown
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.FightersByGameIdAndGamePositionQueryVariables,
  APITypes.FightersByGameIdAndGamePositionQuery
>;
export const rivalriesByUserAIdAndUpdatedAt = /* GraphQL */ `query RivalriesByUserAIdAndUpdatedAt(
  $userAId: ID!
  $updatedAt: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelRivalryFilterInput
  $limit: Int
  $nextToken: String
) {
  rivalriesByUserAIdAndUpdatedAt(
    userAId: $userAId
    updatedAt: $updatedAt
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      userAId
      userBId
      gameId
      contestCount
      currentContestId
      createdAt
      updatedAt
      deletedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.RivalriesByUserAIdAndUpdatedAtQueryVariables,
  APITypes.RivalriesByUserAIdAndUpdatedAtQuery
>;
export const rivalriesByUserBIdAndUpdatedAt = /* GraphQL */ `query RivalriesByUserBIdAndUpdatedAt(
  $userBId: ID!
  $updatedAt: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelRivalryFilterInput
  $limit: Int
  $nextToken: String
) {
  rivalriesByUserBIdAndUpdatedAt(
    userBId: $userBId
    updatedAt: $updatedAt
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      userAId
      userBId
      gameId
      contestCount
      currentContestId
      createdAt
      updatedAt
      deletedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.RivalriesByUserBIdAndUpdatedAtQueryVariables,
  APITypes.RivalriesByUserBIdAndUpdatedAtQuery
>;
export const rivalriesByGameIdAndUpdatedAt = /* GraphQL */ `query RivalriesByGameIdAndUpdatedAt(
  $gameId: ID!
  $updatedAt: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelRivalryFilterInput
  $limit: Int
  $nextToken: String
) {
  rivalriesByGameIdAndUpdatedAt(
    gameId: $gameId
    updatedAt: $updatedAt
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      userAId
      userBId
      gameId
      contestCount
      currentContestId
      createdAt
      updatedAt
      deletedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.RivalriesByGameIdAndUpdatedAtQueryVariables,
  APITypes.RivalriesByGameIdAndUpdatedAtQuery
>;
export const tierListsByRivalryIdAndCreatedAt = /* GraphQL */ `query TierListsByRivalryIdAndCreatedAt(
  $rivalryId: ID!
  $createdAt: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelTierListFilterInput
  $limit: Int
  $nextToken: String
) {
  tierListsByRivalryIdAndCreatedAt(
    rivalryId: $rivalryId
    createdAt: $createdAt
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      rivalryId
      userId
      standing
      createdAt
      updatedAt
      deletedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TierListsByRivalryIdAndCreatedAtQueryVariables,
  APITypes.TierListsByRivalryIdAndCreatedAtQuery
>;
export const tierListsByUserIdAndCreatedAt = /* GraphQL */ `query TierListsByUserIdAndCreatedAt(
  $userId: ID!
  $createdAt: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelTierListFilterInput
  $limit: Int
  $nextToken: String
) {
  tierListsByUserIdAndCreatedAt(
    userId: $userId
    createdAt: $createdAt
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      rivalryId
      userId
      standing
      createdAt
      updatedAt
      deletedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TierListsByUserIdAndCreatedAtQueryVariables,
  APITypes.TierListsByUserIdAndCreatedAtQuery
>;
export const tierSlotsByTierListIdAndPosition = /* GraphQL */ `query TierSlotsByTierListIdAndPosition(
  $tierListId: ID!
  $position: ModelIntKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelTierSlotFilterInput
  $limit: Int
  $nextToken: String
) {
  tierSlotsByTierListIdAndPosition(
    tierListId: $tierListId
    position: $position
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
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
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TierSlotsByTierListIdAndPositionQueryVariables,
  APITypes.TierSlotsByTierListIdAndPositionQuery
>;
export const tierSlotsByFighterIdAndPosition = /* GraphQL */ `query TierSlotsByFighterIdAndPosition(
  $fighterId: ID!
  $position: ModelIntKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelTierSlotFilterInput
  $limit: Int
  $nextToken: String
) {
  tierSlotsByFighterIdAndPosition(
    fighterId: $fighterId
    position: $position
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
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
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TierSlotsByFighterIdAndPositionQueryVariables,
  APITypes.TierSlotsByFighterIdAndPositionQuery
>;
export const usersByAwsSub = /* GraphQL */ `query UsersByAwsSub(
  $awsSub: String!
  $sortDirection: ModelSortDirection
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
) {
  usersByAwsSub(
    awsSub: $awsSub
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      email
      firstName
      lastName
      role
      awsSub
      createdAt
      updatedAt
      deletedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.UsersByAwsSubQueryVariables,
  APITypes.UsersByAwsSubQuery
>;
