/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import type * as APITypes from './API';

type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateContest =
  /* GraphQL */ `subscription OnCreateContest($filter: ModelSubscriptionContestFilterInput) {
  onCreateContest(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnCreateContestSubscriptionVariables,
    APITypes.OnCreateContestSubscription
  >;
export const onCreateFighter =
  /* GraphQL */ `subscription OnCreateFighter($filter: ModelSubscriptionFighterFilterInput) {
  onCreateFighter(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnCreateFighterSubscriptionVariables,
    APITypes.OnCreateFighterSubscription
  >;
export const onCreateGame =
  /* GraphQL */ `subscription OnCreateGame($filter: ModelSubscriptionGameFilterInput) {
  onCreateGame(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnCreateGameSubscriptionVariables,
    APITypes.OnCreateGameSubscription
  >;
export const onCreateRivalry =
  /* GraphQL */ `subscription OnCreateRivalry($filter: ModelSubscriptionRivalryFilterInput) {
  onCreateRivalry(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnCreateRivalrySubscriptionVariables,
    APITypes.OnCreateRivalrySubscription
  >;
export const onCreateTierList =
  /* GraphQL */ `subscription OnCreateTierList($filter: ModelSubscriptionTierListFilterInput) {
  onCreateTierList(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnCreateTierListSubscriptionVariables,
    APITypes.OnCreateTierListSubscription
  >;
export const onCreateTierListSnapshot =
  /* GraphQL */ `subscription OnCreateTierListSnapshot(
  $filter: ModelSubscriptionTierListSnapshotFilterInput
) {
  onCreateTierListSnapshot(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnCreateTierListSnapshotSubscriptionVariables,
    APITypes.OnCreateTierListSnapshotSubscription
  >;
export const onCreateTierSlot =
  /* GraphQL */ `subscription OnCreateTierSlot($filter: ModelSubscriptionTierSlotFilterInput) {
  onCreateTierSlot(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnCreateTierSlotSubscriptionVariables,
    APITypes.OnCreateTierSlotSubscription
  >;
export const onCreateUser =
  /* GraphQL */ `subscription OnCreateUser($filter: ModelSubscriptionUserFilterInput) {
  onCreateUser(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnCreateUserSubscriptionVariables,
    APITypes.OnCreateUserSubscription
  >;
export const onDeleteContest =
  /* GraphQL */ `subscription OnDeleteContest($filter: ModelSubscriptionContestFilterInput) {
  onDeleteContest(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnDeleteContestSubscriptionVariables,
    APITypes.OnDeleteContestSubscription
  >;
export const onDeleteFighter =
  /* GraphQL */ `subscription OnDeleteFighter($filter: ModelSubscriptionFighterFilterInput) {
  onDeleteFighter(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnDeleteFighterSubscriptionVariables,
    APITypes.OnDeleteFighterSubscription
  >;
export const onDeleteGame =
  /* GraphQL */ `subscription OnDeleteGame($filter: ModelSubscriptionGameFilterInput) {
  onDeleteGame(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnDeleteGameSubscriptionVariables,
    APITypes.OnDeleteGameSubscription
  >;
export const onDeleteRivalry =
  /* GraphQL */ `subscription OnDeleteRivalry($filter: ModelSubscriptionRivalryFilterInput) {
  onDeleteRivalry(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnDeleteRivalrySubscriptionVariables,
    APITypes.OnDeleteRivalrySubscription
  >;
export const onDeleteTierList =
  /* GraphQL */ `subscription OnDeleteTierList($filter: ModelSubscriptionTierListFilterInput) {
  onDeleteTierList(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnDeleteTierListSubscriptionVariables,
    APITypes.OnDeleteTierListSubscription
  >;
export const onDeleteTierListSnapshot =
  /* GraphQL */ `subscription OnDeleteTierListSnapshot(
  $filter: ModelSubscriptionTierListSnapshotFilterInput
) {
  onDeleteTierListSnapshot(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnDeleteTierListSnapshotSubscriptionVariables,
    APITypes.OnDeleteTierListSnapshotSubscription
  >;
export const onDeleteTierSlot =
  /* GraphQL */ `subscription OnDeleteTierSlot($filter: ModelSubscriptionTierSlotFilterInput) {
  onDeleteTierSlot(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnDeleteTierSlotSubscriptionVariables,
    APITypes.OnDeleteTierSlotSubscription
  >;
export const onDeleteUser =
  /* GraphQL */ `subscription OnDeleteUser($filter: ModelSubscriptionUserFilterInput) {
  onDeleteUser(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnDeleteUserSubscriptionVariables,
    APITypes.OnDeleteUserSubscription
  >;
export const onUpdateContest =
  /* GraphQL */ `subscription OnUpdateContest($filter: ModelSubscriptionContestFilterInput) {
  onUpdateContest(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnUpdateContestSubscriptionVariables,
    APITypes.OnUpdateContestSubscription
  >;
export const onUpdateFighter =
  /* GraphQL */ `subscription OnUpdateFighter($filter: ModelSubscriptionFighterFilterInput) {
  onUpdateFighter(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnUpdateFighterSubscriptionVariables,
    APITypes.OnUpdateFighterSubscription
  >;
export const onUpdateGame =
  /* GraphQL */ `subscription OnUpdateGame($filter: ModelSubscriptionGameFilterInput) {
  onUpdateGame(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnUpdateGameSubscriptionVariables,
    APITypes.OnUpdateGameSubscription
  >;
export const onUpdateRivalry =
  /* GraphQL */ `subscription OnUpdateRivalry($filter: ModelSubscriptionRivalryFilterInput) {
  onUpdateRivalry(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnUpdateRivalrySubscriptionVariables,
    APITypes.OnUpdateRivalrySubscription
  >;
export const onUpdateTierList =
  /* GraphQL */ `subscription OnUpdateTierList($filter: ModelSubscriptionTierListFilterInput) {
  onUpdateTierList(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnUpdateTierListSubscriptionVariables,
    APITypes.OnUpdateTierListSubscription
  >;
export const onUpdateTierListSnapshot =
  /* GraphQL */ `subscription OnUpdateTierListSnapshot(
  $filter: ModelSubscriptionTierListSnapshotFilterInput
) {
  onUpdateTierListSnapshot(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnUpdateTierListSnapshotSubscriptionVariables,
    APITypes.OnUpdateTierListSnapshotSubscription
  >;
export const onUpdateTierSlot =
  /* GraphQL */ `subscription OnUpdateTierSlot($filter: ModelSubscriptionTierSlotFilterInput) {
  onUpdateTierSlot(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnUpdateTierSlotSubscriptionVariables,
    APITypes.OnUpdateTierSlotSubscription
  >;
export const onUpdateUser =
  /* GraphQL */ `subscription OnUpdateUser($filter: ModelSubscriptionUserFilterInput) {
  onUpdateUser(filter: $filter) {
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
` as GeneratedSubscription<
    APITypes.OnUpdateUserSubscriptionVariables,
    APITypes.OnUpdateUserSubscription
  >;
