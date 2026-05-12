/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import type * as APITypes from './API';

type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createContest = /* GraphQL */ `mutation CreateContest(
  $condition: ModelContestConditionInput
  $input: CreateContestInput!
) {
  createContest(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateContestMutationVariables,
  APITypes.CreateContestMutation
>;
export const createFighter = /* GraphQL */ `mutation CreateFighter(
  $condition: ModelFighterConditionInput
  $input: CreateFighterInput!
) {
  createFighter(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateFighterMutationVariables,
  APITypes.CreateFighterMutation
>;
export const createGame = /* GraphQL */ `mutation CreateGame(
  $condition: ModelGameConditionInput
  $input: CreateGameInput!
) {
  createGame(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateGameMutationVariables,
  APITypes.CreateGameMutation
>;
export const createRivalry = /* GraphQL */ `mutation CreateRivalry(
  $condition: ModelRivalryConditionInput
  $input: CreateRivalryInput!
) {
  createRivalry(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateRivalryMutationVariables,
  APITypes.CreateRivalryMutation
>;
export const createTierList = /* GraphQL */ `mutation CreateTierList(
  $condition: ModelTierListConditionInput
  $input: CreateTierListInput!
) {
  createTierList(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateTierListMutationVariables,
  APITypes.CreateTierListMutation
>;
export const createTierListSnapshot =
  /* GraphQL */ `mutation CreateTierListSnapshot(
  $condition: ModelTierListSnapshotConditionInput
  $input: CreateTierListSnapshotInput!
) {
  createTierListSnapshot(condition: $condition, input: $input) {
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
` as GeneratedMutation<
    APITypes.CreateTierListSnapshotMutationVariables,
    APITypes.CreateTierListSnapshotMutation
  >;
export const createTierSlot = /* GraphQL */ `mutation CreateTierSlot(
  $condition: ModelTierSlotConditionInput
  $input: CreateTierSlotInput!
) {
  createTierSlot(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateTierSlotMutationVariables,
  APITypes.CreateTierSlotMutation
>;
export const createUser = /* GraphQL */ `mutation CreateUser(
  $condition: ModelUserConditionInput
  $input: CreateUserInput!
) {
  createUser(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const deleteContest = /* GraphQL */ `mutation DeleteContest(
  $condition: ModelContestConditionInput
  $input: DeleteContestInput!
) {
  deleteContest(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteContestMutationVariables,
  APITypes.DeleteContestMutation
>;
export const deleteFighter = /* GraphQL */ `mutation DeleteFighter(
  $condition: ModelFighterConditionInput
  $input: DeleteFighterInput!
) {
  deleteFighter(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteFighterMutationVariables,
  APITypes.DeleteFighterMutation
>;
export const deleteGame = /* GraphQL */ `mutation DeleteGame(
  $condition: ModelGameConditionInput
  $input: DeleteGameInput!
) {
  deleteGame(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteGameMutationVariables,
  APITypes.DeleteGameMutation
>;
export const deleteRivalry = /* GraphQL */ `mutation DeleteRivalry(
  $condition: ModelRivalryConditionInput
  $input: DeleteRivalryInput!
) {
  deleteRivalry(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteRivalryMutationVariables,
  APITypes.DeleteRivalryMutation
>;
export const deleteTierList = /* GraphQL */ `mutation DeleteTierList(
  $condition: ModelTierListConditionInput
  $input: DeleteTierListInput!
) {
  deleteTierList(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteTierListMutationVariables,
  APITypes.DeleteTierListMutation
>;
export const deleteTierListSnapshot =
  /* GraphQL */ `mutation DeleteTierListSnapshot(
  $condition: ModelTierListSnapshotConditionInput
  $input: DeleteTierListSnapshotInput!
) {
  deleteTierListSnapshot(condition: $condition, input: $input) {
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
` as GeneratedMutation<
    APITypes.DeleteTierListSnapshotMutationVariables,
    APITypes.DeleteTierListSnapshotMutation
  >;
export const deleteTierSlot = /* GraphQL */ `mutation DeleteTierSlot(
  $condition: ModelTierSlotConditionInput
  $input: DeleteTierSlotInput!
) {
  deleteTierSlot(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteTierSlotMutationVariables,
  APITypes.DeleteTierSlotMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $condition: ModelUserConditionInput
  $input: DeleteUserInput!
) {
  deleteUser(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const incrementFighterStats =
  /* GraphQL */ `mutation IncrementFighterStats($fighterId: ID!, $won: Boolean!) {
  incrementFighterStats(fighterId: $fighterId, won: $won) {
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
` as GeneratedMutation<
    APITypes.IncrementFighterStatsMutationVariables,
    APITypes.IncrementFighterStatsMutation
  >;
export const incrementTierSlotStats =
  /* GraphQL */ `mutation IncrementTierSlotStats($tierSlotId: ID!, $won: Boolean!) {
  incrementTierSlotStats(tierSlotId: $tierSlotId, won: $won) {
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
` as GeneratedMutation<
    APITypes.IncrementTierSlotStatsMutationVariables,
    APITypes.IncrementTierSlotStatsMutation
  >;
export const updateContest = /* GraphQL */ `mutation UpdateContest(
  $condition: ModelContestConditionInput
  $input: UpdateContestInput!
) {
  updateContest(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateContestMutationVariables,
  APITypes.UpdateContestMutation
>;
export const updateFighter = /* GraphQL */ `mutation UpdateFighter(
  $condition: ModelFighterConditionInput
  $input: UpdateFighterInput!
) {
  updateFighter(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateFighterMutationVariables,
  APITypes.UpdateFighterMutation
>;
export const updateGame = /* GraphQL */ `mutation UpdateGame(
  $condition: ModelGameConditionInput
  $input: UpdateGameInput!
) {
  updateGame(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateGameMutationVariables,
  APITypes.UpdateGameMutation
>;
export const updateRivalry = /* GraphQL */ `mutation UpdateRivalry(
  $condition: ModelRivalryConditionInput
  $input: UpdateRivalryInput!
) {
  updateRivalry(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateRivalryMutationVariables,
  APITypes.UpdateRivalryMutation
>;
export const updateTierList = /* GraphQL */ `mutation UpdateTierList(
  $condition: ModelTierListConditionInput
  $input: UpdateTierListInput!
) {
  updateTierList(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateTierListMutationVariables,
  APITypes.UpdateTierListMutation
>;
export const updateTierListSnapshot =
  /* GraphQL */ `mutation UpdateTierListSnapshot(
  $condition: ModelTierListSnapshotConditionInput
  $input: UpdateTierListSnapshotInput!
) {
  updateTierListSnapshot(condition: $condition, input: $input) {
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
` as GeneratedMutation<
    APITypes.UpdateTierListSnapshotMutationVariables,
    APITypes.UpdateTierListSnapshotMutation
  >;
export const updateTierSlot = /* GraphQL */ `mutation UpdateTierSlot(
  $condition: ModelTierSlotConditionInput
  $input: UpdateTierSlotInput!
) {
  updateTierSlot(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateTierSlotMutationVariables,
  APITypes.UpdateTierSlotMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $condition: ModelUserConditionInput
  $input: UpdateUserInput!
) {
  updateUser(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
