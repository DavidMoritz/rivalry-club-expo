/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

// import * as APITypes from "../API"; // Not needed with Gen 2
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateContest = /* GraphQL */ `subscription OnCreateContest($filter: ModelSubscriptionContestFilterInput) {
  onCreateContest(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateContestSubscriptionVariables,
  APITypes.OnCreateContestSubscription
>;
export const onUpdateContest = /* GraphQL */ `subscription OnUpdateContest($filter: ModelSubscriptionContestFilterInput) {
  onUpdateContest(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateContestSubscriptionVariables,
  APITypes.OnUpdateContestSubscription
>;
export const onDeleteContest = /* GraphQL */ `subscription OnDeleteContest($filter: ModelSubscriptionContestFilterInput) {
  onDeleteContest(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteContestSubscriptionVariables,
  APITypes.OnDeleteContestSubscription
>;
export const onCreateFighter = /* GraphQL */ `subscription OnCreateFighter($filter: ModelSubscriptionFighterFilterInput) {
  onCreateFighter(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateFighterSubscriptionVariables,
  APITypes.OnCreateFighterSubscription
>;
export const onUpdateFighter = /* GraphQL */ `subscription OnUpdateFighter($filter: ModelSubscriptionFighterFilterInput) {
  onUpdateFighter(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateFighterSubscriptionVariables,
  APITypes.OnUpdateFighterSubscription
>;
export const onDeleteFighter = /* GraphQL */ `subscription OnDeleteFighter($filter: ModelSubscriptionFighterFilterInput) {
  onDeleteFighter(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteFighterSubscriptionVariables,
  APITypes.OnDeleteFighterSubscription
>;
export const onCreateGame = /* GraphQL */ `subscription OnCreateGame($filter: ModelSubscriptionGameFilterInput) {
  onCreateGame(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateGameSubscriptionVariables,
  APITypes.OnCreateGameSubscription
>;
export const onUpdateGame = /* GraphQL */ `subscription OnUpdateGame($filter: ModelSubscriptionGameFilterInput) {
  onUpdateGame(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateGameSubscriptionVariables,
  APITypes.OnUpdateGameSubscription
>;
export const onDeleteGame = /* GraphQL */ `subscription OnDeleteGame($filter: ModelSubscriptionGameFilterInput) {
  onDeleteGame(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteGameSubscriptionVariables,
  APITypes.OnDeleteGameSubscription
>;
export const onCreateRivalry = /* GraphQL */ `subscription OnCreateRivalry($filter: ModelSubscriptionRivalryFilterInput) {
  onCreateRivalry(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateRivalrySubscriptionVariables,
  APITypes.OnCreateRivalrySubscription
>;
export const onUpdateRivalry = /* GraphQL */ `subscription OnUpdateRivalry($filter: ModelSubscriptionRivalryFilterInput) {
  onUpdateRivalry(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateRivalrySubscriptionVariables,
  APITypes.OnUpdateRivalrySubscription
>;
export const onDeleteRivalry = /* GraphQL */ `subscription OnDeleteRivalry($filter: ModelSubscriptionRivalryFilterInput) {
  onDeleteRivalry(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteRivalrySubscriptionVariables,
  APITypes.OnDeleteRivalrySubscription
>;
export const onCreateTierList = /* GraphQL */ `subscription OnCreateTierList($filter: ModelSubscriptionTierListFilterInput) {
  onCreateTierList(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateTierListSubscriptionVariables,
  APITypes.OnCreateTierListSubscription
>;
export const onUpdateTierList = /* GraphQL */ `subscription OnUpdateTierList($filter: ModelSubscriptionTierListFilterInput) {
  onUpdateTierList(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateTierListSubscriptionVariables,
  APITypes.OnUpdateTierListSubscription
>;
export const onDeleteTierList = /* GraphQL */ `subscription OnDeleteTierList($filter: ModelSubscriptionTierListFilterInput) {
  onDeleteTierList(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteTierListSubscriptionVariables,
  APITypes.OnDeleteTierListSubscription
>;
export const onCreateTierSlot = /* GraphQL */ `subscription OnCreateTierSlot($filter: ModelSubscriptionTierSlotFilterInput) {
  onCreateTierSlot(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateTierSlotSubscriptionVariables,
  APITypes.OnCreateTierSlotSubscription
>;
export const onUpdateTierSlot = /* GraphQL */ `subscription OnUpdateTierSlot($filter: ModelSubscriptionTierSlotFilterInput) {
  onUpdateTierSlot(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateTierSlotSubscriptionVariables,
  APITypes.OnUpdateTierSlotSubscription
>;
export const onDeleteTierSlot = /* GraphQL */ `subscription OnDeleteTierSlot($filter: ModelSubscriptionTierSlotFilterInput) {
  onDeleteTierSlot(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteTierSlotSubscriptionVariables,
  APITypes.OnDeleteTierSlotSubscription
>;
export const onCreateUser = /* GraphQL */ `subscription OnCreateUser($filter: ModelSubscriptionUserFilterInput) {
  onCreateUser(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser($filter: ModelSubscriptionUserFilterInput) {
  onUpdateUser(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser($filter: ModelSubscriptionUserFilterInput) {
  onDeleteUser(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
