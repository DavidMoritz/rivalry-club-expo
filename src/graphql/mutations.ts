/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

// import * as APITypes from "../API"; // Not needed with Gen 2
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createContest = /* GraphQL */ `mutation CreateContest(
  $input: CreateContestInput!
  $condition: ModelContestConditionInput
) {
  createContest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateContestMutationVariables,
  APITypes.CreateContestMutation
>;
export const updateContest = /* GraphQL */ `mutation UpdateContest(
  $input: UpdateContestInput!
  $condition: ModelContestConditionInput
) {
  updateContest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateContestMutationVariables,
  APITypes.UpdateContestMutation
>;
export const deleteContest = /* GraphQL */ `mutation DeleteContest(
  $input: DeleteContestInput!
  $condition: ModelContestConditionInput
) {
  deleteContest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteContestMutationVariables,
  APITypes.DeleteContestMutation
>;
export const createFighter = /* GraphQL */ `mutation CreateFighter(
  $input: CreateFighterInput!
  $condition: ModelFighterConditionInput
) {
  createFighter(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateFighterMutationVariables,
  APITypes.CreateFighterMutation
>;
export const updateFighter = /* GraphQL */ `mutation UpdateFighter(
  $input: UpdateFighterInput!
  $condition: ModelFighterConditionInput
) {
  updateFighter(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateFighterMutationVariables,
  APITypes.UpdateFighterMutation
>;
export const deleteFighter = /* GraphQL */ `mutation DeleteFighter(
  $input: DeleteFighterInput!
  $condition: ModelFighterConditionInput
) {
  deleteFighter(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteFighterMutationVariables,
  APITypes.DeleteFighterMutation
>;
export const createGame = /* GraphQL */ `mutation CreateGame(
  $input: CreateGameInput!
  $condition: ModelGameConditionInput
) {
  createGame(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateGameMutationVariables,
  APITypes.CreateGameMutation
>;
export const updateGame = /* GraphQL */ `mutation UpdateGame(
  $input: UpdateGameInput!
  $condition: ModelGameConditionInput
) {
  updateGame(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateGameMutationVariables,
  APITypes.UpdateGameMutation
>;
export const deleteGame = /* GraphQL */ `mutation DeleteGame(
  $input: DeleteGameInput!
  $condition: ModelGameConditionInput
) {
  deleteGame(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteGameMutationVariables,
  APITypes.DeleteGameMutation
>;
export const createRivalry = /* GraphQL */ `mutation CreateRivalry(
  $input: CreateRivalryInput!
  $condition: ModelRivalryConditionInput
) {
  createRivalry(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateRivalryMutationVariables,
  APITypes.CreateRivalryMutation
>;
export const updateRivalry = /* GraphQL */ `mutation UpdateRivalry(
  $input: UpdateRivalryInput!
  $condition: ModelRivalryConditionInput
) {
  updateRivalry(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateRivalryMutationVariables,
  APITypes.UpdateRivalryMutation
>;
export const deleteRivalry = /* GraphQL */ `mutation DeleteRivalry(
  $input: DeleteRivalryInput!
  $condition: ModelRivalryConditionInput
) {
  deleteRivalry(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteRivalryMutationVariables,
  APITypes.DeleteRivalryMutation
>;
export const createTierList = /* GraphQL */ `mutation CreateTierList(
  $input: CreateTierListInput!
  $condition: ModelTierListConditionInput
) {
  createTierList(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateTierListMutationVariables,
  APITypes.CreateTierListMutation
>;
export const updateTierList = /* GraphQL */ `mutation UpdateTierList(
  $input: UpdateTierListInput!
  $condition: ModelTierListConditionInput
) {
  updateTierList(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateTierListMutationVariables,
  APITypes.UpdateTierListMutation
>;
export const deleteTierList = /* GraphQL */ `mutation DeleteTierList(
  $input: DeleteTierListInput!
  $condition: ModelTierListConditionInput
) {
  deleteTierList(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteTierListMutationVariables,
  APITypes.DeleteTierListMutation
>;
export const createTierSlot = /* GraphQL */ `mutation CreateTierSlot(
  $input: CreateTierSlotInput!
  $condition: ModelTierSlotConditionInput
) {
  createTierSlot(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateTierSlotMutationVariables,
  APITypes.CreateTierSlotMutation
>;
export const updateTierSlot = /* GraphQL */ `mutation UpdateTierSlot(
  $input: UpdateTierSlotInput!
  $condition: ModelTierSlotConditionInput
) {
  updateTierSlot(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateTierSlotMutationVariables,
  APITypes.UpdateTierSlotMutation
>;
export const deleteTierSlot = /* GraphQL */ `mutation DeleteTierSlot(
  $input: DeleteTierSlotInput!
  $condition: ModelTierSlotConditionInput
) {
  deleteTierSlot(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteTierSlotMutationVariables,
  APITypes.DeleteTierSlotMutation
>;
export const createUser = /* GraphQL */ `mutation CreateUser(
  $input: CreateUserInput!
  $condition: ModelUserConditionInput
) {
  createUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $input: UpdateUserInput!
  $condition: ModelUserConditionInput
) {
  updateUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $input: DeleteUserInput!
  $condition: ModelUserConditionInput
) {
  deleteUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
