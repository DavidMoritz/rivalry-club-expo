/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type ModelStringKeyConditionInput = {
  beginsWith?: string | null;
  between?: Array<string | null> | null;
  eq?: string | null;
  ge?: string | null;
  gt?: string | null;
  le?: string | null;
  lt?: string | null;
};

export type ModelContestFilterInput = {
  and?: Array<ModelContestFilterInput | null> | null;
  bias?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  id?: ModelIDInput | null;
  not?: ModelContestFilterInput | null;
  or?: Array<ModelContestFilterInput | null> | null;
  result?: ModelIntInput | null;
  rivalryId?: ModelIDInput | null;
  tierSlotAId?: ModelIDInput | null;
  tierSlotBId?: ModelIDInput | null;
  updatedAt?: ModelStringInput | null;
};

export type ModelIntInput = {
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  between?: Array<number | null> | null;
  eq?: number | null;
  ge?: number | null;
  gt?: number | null;
  le?: number | null;
  lt?: number | null;
  ne?: number | null;
};

export enum ModelAttributeTypes {
  _null = '_null',
  binary = 'binary',
  binarySet = 'binarySet',
  bool = 'bool',
  list = 'list',
  map = 'map',
  number = 'number',
  numberSet = 'numberSet',
  string = 'string',
  stringSet = 'stringSet',
}

export type ModelStringInput = {
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  beginsWith?: string | null;
  between?: Array<string | null> | null;
  contains?: string | null;
  eq?: string | null;
  ge?: string | null;
  gt?: string | null;
  le?: string | null;
  lt?: string | null;
  ne?: string | null;
  notContains?: string | null;
  size?: ModelSizeInput | null;
};

export type ModelSizeInput = {
  between?: Array<number | null> | null;
  eq?: number | null;
  ge?: number | null;
  gt?: number | null;
  le?: number | null;
  lt?: number | null;
  ne?: number | null;
};

export type ModelIDInput = {
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  beginsWith?: string | null;
  between?: Array<string | null> | null;
  contains?: string | null;
  eq?: string | null;
  ge?: string | null;
  gt?: string | null;
  le?: string | null;
  lt?: string | null;
  ne?: string | null;
  notContains?: string | null;
  size?: ModelSizeInput | null;
};

export enum ModelSortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type ModelContestConnection = {
  __typename: 'ModelContestConnection';
  items: Array<Contest | null>;
  nextToken?: string | null;
};

export type Contest = {
  __typename: 'Contest';
  bias?: number | null;
  createdAt?: string | null;
  deletedAt?: string | null;
  id: string;
  result?: number | null;
  rivalry?: Rivalry | null;
  rivalryId: string;
  tierSlotAId: string;
  tierSlotBId: string;
  updatedAt: string;
};

export type Rivalry = {
  __typename: 'Rivalry';
  accepted?: boolean | null;
  contestCount: number;
  contests?: ModelContestConnection | null;
  createdAt: string;
  currentContestId?: string | null;
  deletedAt?: string | null;
  game?: Game | null;
  gameId: string;
  hiddenByA?: boolean | null;
  hiddenByB?: boolean | null;
  id: string;
  tierLists?: ModelTierListConnection | null;
  updatedAt: string;
  userAId: string;
  userBId: string;
};

export type Game = {
  __typename: 'Game';
  createdAt: string;
  deletedAt?: string | null;
  fighters?: ModelFighterConnection | null;
  id: string;
  name: string;
  rivalries?: ModelRivalryConnection | null;
  snapshots?: ModelTierListSnapshotConnection | null;
  updatedAt: string;
};

export type ModelFighterConnection = {
  __typename: 'ModelFighterConnection';
  items: Array<Fighter | null>;
  nextToken?: string | null;
};

export type Fighter = {
  __typename: 'Fighter';
  contestCount?: number | null;
  createdAt: string;
  game?: Game | null;
  gameId: string;
  gamePosition?: number | null;
  id: string;
  name: string;
  tierBreakdown?: string | null;
  tierSlots?: ModelTierSlotConnection | null;
  updatedAt: string;
  winCount?: number | null;
};

export type ModelTierSlotConnection = {
  __typename: 'ModelTierSlotConnection';
  items: Array<TierSlot | null>;
  nextToken?: string | null;
};

export type TierSlot = {
  __typename: 'TierSlot';
  contestCount?: number | null;
  createdAt: string;
  deletedAt?: string | null;
  fighter?: Fighter | null;
  fighterId: string;
  id: string;
  position?: number | null;
  tierList?: TierList | null;
  tierListId: string;
  updatedAt: string;
  winCount?: number | null;
};

export type TierList = {
  __typename: 'TierList';
  createdAt?: string | null;
  deletedAt?: string | null;
  id: string;
  rivalry?: Rivalry | null;
  rivalryId: string;
  standing?: number | null;
  tierSlots?: ModelTierSlotConnection | null;
  updatedAt?: string | null;
  userId: string;
};

export type ModelRivalryConnection = {
  __typename: 'ModelRivalryConnection';
  items: Array<Rivalry | null>;
  nextToken?: string | null;
};

export type ModelTierListSnapshotConnection = {
  __typename: 'ModelTierListSnapshotConnection';
  items: Array<TierListSnapshot | null>;
  nextToken?: string | null;
};

export type TierListSnapshot = {
  __typename: 'TierListSnapshot';
  arrangement: string;
  createdAt?: string | null;
  deletedAt?: string | null;
  game?: Game | null;
  gameId: string;
  id: string;
  name: string;
  shareCode: string;
  updatedAt: string;
  userId: string;
};

export type ModelTierListConnection = {
  __typename: 'ModelTierListConnection';
  items: Array<TierList | null>;
  nextToken?: string | null;
};

export type User = {
  __typename: 'User';
  awsSub: string;
  createdAt: string;
  deletedAt?: string | null;
  email: string;
  firstName?: string | null;
  id: string;
  lastName?: string | null;
  role: number;
  updatedAt: string;
};

export type ModelFighterFilterInput = {
  and?: Array<ModelFighterFilterInput | null> | null;
  contestCount?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  gameId?: ModelIDInput | null;
  gamePosition?: ModelIntInput | null;
  id?: ModelIDInput | null;
  name?: ModelStringInput | null;
  not?: ModelFighterFilterInput | null;
  or?: Array<ModelFighterFilterInput | null> | null;
  tierBreakdown?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  winCount?: ModelIntInput | null;
};

export type ModelGameFilterInput = {
  and?: Array<ModelGameFilterInput | null> | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  id?: ModelIDInput | null;
  name?: ModelStringInput | null;
  not?: ModelGameFilterInput | null;
  or?: Array<ModelGameFilterInput | null> | null;
  updatedAt?: ModelStringInput | null;
};

export type ModelGameConnection = {
  __typename: 'ModelGameConnection';
  items: Array<Game | null>;
  nextToken?: string | null;
};

export type ModelRivalryFilterInput = {
  accepted?: ModelBooleanInput | null;
  and?: Array<ModelRivalryFilterInput | null> | null;
  contestCount?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  currentContestId?: ModelIDInput | null;
  deletedAt?: ModelStringInput | null;
  gameId?: ModelIDInput | null;
  hiddenByA?: ModelBooleanInput | null;
  hiddenByB?: ModelBooleanInput | null;
  id?: ModelIDInput | null;
  not?: ModelRivalryFilterInput | null;
  or?: Array<ModelRivalryFilterInput | null> | null;
  updatedAt?: ModelStringInput | null;
  userAId?: ModelIDInput | null;
  userBId?: ModelIDInput | null;
};

export type ModelBooleanInput = {
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  eq?: boolean | null;
  ne?: boolean | null;
};

export type ModelTierListSnapshotFilterInput = {
  and?: Array<ModelTierListSnapshotFilterInput | null> | null;
  arrangement?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  gameId?: ModelIDInput | null;
  id?: ModelIDInput | null;
  name?: ModelStringInput | null;
  not?: ModelTierListSnapshotFilterInput | null;
  or?: Array<ModelTierListSnapshotFilterInput | null> | null;
  shareCode?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  userId?: ModelIDInput | null;
};

export type ModelTierListFilterInput = {
  and?: Array<ModelTierListFilterInput | null> | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  id?: ModelIDInput | null;
  not?: ModelTierListFilterInput | null;
  or?: Array<ModelTierListFilterInput | null> | null;
  rivalryId?: ModelIDInput | null;
  standing?: ModelIntInput | null;
  updatedAt?: ModelStringInput | null;
  userId?: ModelIDInput | null;
};

export type ModelTierSlotFilterInput = {
  and?: Array<ModelTierSlotFilterInput | null> | null;
  contestCount?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  fighterId?: ModelIDInput | null;
  id?: ModelIDInput | null;
  not?: ModelTierSlotFilterInput | null;
  or?: Array<ModelTierSlotFilterInput | null> | null;
  position?: ModelIntInput | null;
  tierListId?: ModelIDInput | null;
  updatedAt?: ModelStringInput | null;
  winCount?: ModelIntInput | null;
};

export type ModelUserFilterInput = {
  and?: Array<ModelUserFilterInput | null> | null;
  awsSub?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  email?: ModelStringInput | null;
  firstName?: ModelStringInput | null;
  id?: ModelIDInput | null;
  lastName?: ModelStringInput | null;
  not?: ModelUserFilterInput | null;
  or?: Array<ModelUserFilterInput | null> | null;
  role?: ModelIntInput | null;
  updatedAt?: ModelStringInput | null;
};

export type ModelUserConnection = {
  __typename: 'ModelUserConnection';
  items: Array<User | null>;
  nextToken?: string | null;
};

export type ModelContestConditionInput = {
  and?: Array<ModelContestConditionInput | null> | null;
  bias?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  not?: ModelContestConditionInput | null;
  or?: Array<ModelContestConditionInput | null> | null;
  result?: ModelIntInput | null;
  rivalryId?: ModelIDInput | null;
  tierSlotAId?: ModelIDInput | null;
  tierSlotBId?: ModelIDInput | null;
  updatedAt?: ModelStringInput | null;
};

export type CreateContestInput = {
  bias?: number | null;
  createdAt?: string | null;
  deletedAt?: string | null;
  id?: string | null;
  result?: number | null;
  rivalryId: string;
  tierSlotAId: string;
  tierSlotBId: string;
};

export type ModelFighterConditionInput = {
  and?: Array<ModelFighterConditionInput | null> | null;
  contestCount?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  gameId?: ModelIDInput | null;
  gamePosition?: ModelIntInput | null;
  name?: ModelStringInput | null;
  not?: ModelFighterConditionInput | null;
  or?: Array<ModelFighterConditionInput | null> | null;
  tierBreakdown?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  winCount?: ModelIntInput | null;
};

export type CreateFighterInput = {
  contestCount?: number | null;
  gameId: string;
  gamePosition?: number | null;
  id?: string | null;
  name: string;
  tierBreakdown?: string | null;
  winCount?: number | null;
};

export type ModelGameConditionInput = {
  and?: Array<ModelGameConditionInput | null> | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  name?: ModelStringInput | null;
  not?: ModelGameConditionInput | null;
  or?: Array<ModelGameConditionInput | null> | null;
  updatedAt?: ModelStringInput | null;
};

export type CreateGameInput = {
  deletedAt?: string | null;
  id?: string | null;
  name: string;
};

export type ModelRivalryConditionInput = {
  accepted?: ModelBooleanInput | null;
  and?: Array<ModelRivalryConditionInput | null> | null;
  contestCount?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  currentContestId?: ModelIDInput | null;
  deletedAt?: ModelStringInput | null;
  gameId?: ModelIDInput | null;
  hiddenByA?: ModelBooleanInput | null;
  hiddenByB?: ModelBooleanInput | null;
  not?: ModelRivalryConditionInput | null;
  or?: Array<ModelRivalryConditionInput | null> | null;
  updatedAt?: ModelStringInput | null;
  userAId?: ModelIDInput | null;
  userBId?: ModelIDInput | null;
};

export type CreateRivalryInput = {
  accepted?: boolean | null;
  contestCount: number;
  currentContestId?: string | null;
  deletedAt?: string | null;
  gameId: string;
  hiddenByA?: boolean | null;
  hiddenByB?: boolean | null;
  id?: string | null;
  userAId: string;
  userBId: string;
};

export type ModelTierListConditionInput = {
  and?: Array<ModelTierListConditionInput | null> | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  not?: ModelTierListConditionInput | null;
  or?: Array<ModelTierListConditionInput | null> | null;
  rivalryId?: ModelIDInput | null;
  standing?: ModelIntInput | null;
  updatedAt?: ModelStringInput | null;
  userId?: ModelIDInput | null;
};

export type CreateTierListInput = {
  createdAt?: string | null;
  deletedAt?: string | null;
  id?: string | null;
  rivalryId: string;
  standing?: number | null;
  updatedAt?: string | null;
  userId: string;
};

export type ModelTierListSnapshotConditionInput = {
  and?: Array<ModelTierListSnapshotConditionInput | null> | null;
  arrangement?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  gameId?: ModelIDInput | null;
  name?: ModelStringInput | null;
  not?: ModelTierListSnapshotConditionInput | null;
  or?: Array<ModelTierListSnapshotConditionInput | null> | null;
  shareCode?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  userId?: ModelIDInput | null;
};

export type CreateTierListSnapshotInput = {
  arrangement: string;
  createdAt?: string | null;
  deletedAt?: string | null;
  gameId: string;
  id?: string | null;
  name: string;
  shareCode: string;
  userId: string;
};

export type ModelTierSlotConditionInput = {
  and?: Array<ModelTierSlotConditionInput | null> | null;
  contestCount?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  fighterId?: ModelIDInput | null;
  not?: ModelTierSlotConditionInput | null;
  or?: Array<ModelTierSlotConditionInput | null> | null;
  position?: ModelIntInput | null;
  tierListId?: ModelIDInput | null;
  updatedAt?: ModelStringInput | null;
  winCount?: ModelIntInput | null;
};

export type CreateTierSlotInput = {
  contestCount?: number | null;
  deletedAt?: string | null;
  fighterId: string;
  id?: string | null;
  position?: number | null;
  tierListId: string;
  winCount?: number | null;
};

export type ModelUserConditionInput = {
  and?: Array<ModelUserConditionInput | null> | null;
  awsSub?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  deletedAt?: ModelStringInput | null;
  email?: ModelStringInput | null;
  firstName?: ModelStringInput | null;
  lastName?: ModelStringInput | null;
  not?: ModelUserConditionInput | null;
  or?: Array<ModelUserConditionInput | null> | null;
  role?: ModelIntInput | null;
  updatedAt?: ModelStringInput | null;
};

export type CreateUserInput = {
  awsSub: string;
  deletedAt?: string | null;
  email: string;
  firstName?: string | null;
  id?: string | null;
  lastName?: string | null;
  role: number;
};

export type DeleteContestInput = {
  id: string;
};

export type DeleteFighterInput = {
  id: string;
};

export type DeleteGameInput = {
  id: string;
};

export type DeleteRivalryInput = {
  id: string;
};

export type DeleteTierListInput = {
  id: string;
};

export type DeleteTierListSnapshotInput = {
  id: string;
};

export type DeleteTierSlotInput = {
  id: string;
};

export type DeleteUserInput = {
  id: string;
};

export type UpdateContestInput = {
  bias?: number | null;
  createdAt?: string | null;
  deletedAt?: string | null;
  id: string;
  result?: number | null;
  rivalryId?: string | null;
  tierSlotAId?: string | null;
  tierSlotBId?: string | null;
};

export type UpdateFighterInput = {
  contestCount?: number | null;
  gameId?: string | null;
  gamePosition?: number | null;
  id: string;
  name?: string | null;
  tierBreakdown?: string | null;
  winCount?: number | null;
};

export type UpdateGameInput = {
  deletedAt?: string | null;
  id: string;
  name?: string | null;
};

export type UpdateRivalryInput = {
  accepted?: boolean | null;
  contestCount?: number | null;
  currentContestId?: string | null;
  deletedAt?: string | null;
  gameId?: string | null;
  hiddenByA?: boolean | null;
  hiddenByB?: boolean | null;
  id: string;
  userAId?: string | null;
  userBId?: string | null;
};

export type UpdateTierListInput = {
  createdAt?: string | null;
  deletedAt?: string | null;
  id: string;
  rivalryId?: string | null;
  standing?: number | null;
  updatedAt?: string | null;
  userId?: string | null;
};

export type UpdateTierListSnapshotInput = {
  arrangement?: string | null;
  createdAt?: string | null;
  deletedAt?: string | null;
  gameId?: string | null;
  id: string;
  name?: string | null;
  shareCode?: string | null;
  userId?: string | null;
};

export type UpdateTierSlotInput = {
  contestCount?: number | null;
  deletedAt?: string | null;
  fighterId?: string | null;
  id: string;
  position?: number | null;
  tierListId?: string | null;
  winCount?: number | null;
};

export type UpdateUserInput = {
  awsSub?: string | null;
  deletedAt?: string | null;
  email?: string | null;
  firstName?: string | null;
  id: string;
  lastName?: string | null;
  role?: number | null;
};

export type ModelSubscriptionContestFilterInput = {
  and?: Array<ModelSubscriptionContestFilterInput | null> | null;
  bias?: ModelSubscriptionIntInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  deletedAt?: ModelSubscriptionStringInput | null;
  id?: ModelSubscriptionIDInput | null;
  or?: Array<ModelSubscriptionContestFilterInput | null> | null;
  result?: ModelSubscriptionIntInput | null;
  rivalryId?: ModelSubscriptionIDInput | null;
  tierSlotAId?: ModelSubscriptionIDInput | null;
  tierSlotBId?: ModelSubscriptionIDInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
};

export type ModelSubscriptionIntInput = {
  between?: Array<number | null> | null;
  eq?: number | null;
  ge?: number | null;
  gt?: number | null;
  in?: Array<number | null> | null;
  le?: number | null;
  lt?: number | null;
  ne?: number | null;
  notIn?: Array<number | null> | null;
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null;
  between?: Array<string | null> | null;
  contains?: string | null;
  eq?: string | null;
  ge?: string | null;
  gt?: string | null;
  in?: Array<string | null> | null;
  le?: string | null;
  lt?: string | null;
  ne?: string | null;
  notContains?: string | null;
  notIn?: Array<string | null> | null;
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null;
  between?: Array<string | null> | null;
  contains?: string | null;
  eq?: string | null;
  ge?: string | null;
  gt?: string | null;
  in?: Array<string | null> | null;
  le?: string | null;
  lt?: string | null;
  ne?: string | null;
  notContains?: string | null;
  notIn?: Array<string | null> | null;
};

export type ModelSubscriptionFighterFilterInput = {
  and?: Array<ModelSubscriptionFighterFilterInput | null> | null;
  contestCount?: ModelSubscriptionIntInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  gameId?: ModelSubscriptionIDInput | null;
  gamePosition?: ModelSubscriptionIntInput | null;
  id?: ModelSubscriptionIDInput | null;
  name?: ModelSubscriptionStringInput | null;
  or?: Array<ModelSubscriptionFighterFilterInput | null> | null;
  tierBreakdown?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  winCount?: ModelSubscriptionIntInput | null;
};

export type ModelSubscriptionGameFilterInput = {
  and?: Array<ModelSubscriptionGameFilterInput | null> | null;
  createdAt?: ModelSubscriptionStringInput | null;
  deletedAt?: ModelSubscriptionStringInput | null;
  id?: ModelSubscriptionIDInput | null;
  name?: ModelSubscriptionStringInput | null;
  or?: Array<ModelSubscriptionGameFilterInput | null> | null;
  updatedAt?: ModelSubscriptionStringInput | null;
};

export type ModelSubscriptionRivalryFilterInput = {
  accepted?: ModelSubscriptionBooleanInput | null;
  and?: Array<ModelSubscriptionRivalryFilterInput | null> | null;
  contestCount?: ModelSubscriptionIntInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  currentContestId?: ModelSubscriptionIDInput | null;
  deletedAt?: ModelSubscriptionStringInput | null;
  gameId?: ModelSubscriptionIDInput | null;
  hiddenByA?: ModelSubscriptionBooleanInput | null;
  hiddenByB?: ModelSubscriptionBooleanInput | null;
  id?: ModelSubscriptionIDInput | null;
  or?: Array<ModelSubscriptionRivalryFilterInput | null> | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  userAId?: ModelSubscriptionIDInput | null;
  userBId?: ModelSubscriptionIDInput | null;
};

export type ModelSubscriptionBooleanInput = {
  eq?: boolean | null;
  ne?: boolean | null;
};

export type ModelSubscriptionTierListFilterInput = {
  and?: Array<ModelSubscriptionTierListFilterInput | null> | null;
  createdAt?: ModelSubscriptionStringInput | null;
  deletedAt?: ModelSubscriptionStringInput | null;
  id?: ModelSubscriptionIDInput | null;
  or?: Array<ModelSubscriptionTierListFilterInput | null> | null;
  rivalryId?: ModelSubscriptionIDInput | null;
  standing?: ModelSubscriptionIntInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  userId?: ModelSubscriptionIDInput | null;
};

export type ModelSubscriptionTierListSnapshotFilterInput = {
  and?: Array<ModelSubscriptionTierListSnapshotFilterInput | null> | null;
  arrangement?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  deletedAt?: ModelSubscriptionStringInput | null;
  gameId?: ModelSubscriptionIDInput | null;
  id?: ModelSubscriptionIDInput | null;
  name?: ModelSubscriptionStringInput | null;
  or?: Array<ModelSubscriptionTierListSnapshotFilterInput | null> | null;
  shareCode?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  userId?: ModelSubscriptionIDInput | null;
};

export type ModelSubscriptionTierSlotFilterInput = {
  and?: Array<ModelSubscriptionTierSlotFilterInput | null> | null;
  contestCount?: ModelSubscriptionIntInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  deletedAt?: ModelSubscriptionStringInput | null;
  fighterId?: ModelSubscriptionIDInput | null;
  id?: ModelSubscriptionIDInput | null;
  or?: Array<ModelSubscriptionTierSlotFilterInput | null> | null;
  position?: ModelSubscriptionIntInput | null;
  tierListId?: ModelSubscriptionIDInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  winCount?: ModelSubscriptionIntInput | null;
};

export type ModelSubscriptionUserFilterInput = {
  and?: Array<ModelSubscriptionUserFilterInput | null> | null;
  awsSub?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  deletedAt?: ModelSubscriptionStringInput | null;
  email?: ModelSubscriptionStringInput | null;
  firstName?: ModelSubscriptionStringInput | null;
  id?: ModelSubscriptionIDInput | null;
  lastName?: ModelSubscriptionStringInput | null;
  or?: Array<ModelSubscriptionUserFilterInput | null> | null;
  role?: ModelSubscriptionIntInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
};

export type ContestsByRivalryIdAndCreatedAtQueryVariables = {
  createdAt?: ModelStringKeyConditionInput | null;
  filter?: ModelContestFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
  rivalryId: string;
  sortDirection?: ModelSortDirection | null;
};

export type ContestsByRivalryIdAndCreatedAtQuery = {
  contestsByRivalryIdAndCreatedAt?: {
    __typename: 'ModelContestConnection';
    items: Array<{
      __typename: 'Contest';
      bias?: number | null;
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      result?: number | null;
      rivalryId: string;
      tierSlotAId: string;
      tierSlotBId: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetContestQueryVariables = {
  id: string;
};

export type GetContestQuery = {
  getContest?: {
    __typename: 'Contest';
    bias?: number | null;
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    result?: number | null;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    tierSlotAId: string;
    tierSlotBId: string;
    updatedAt: string;
  } | null;
};

export type GetFighterQueryVariables = {
  id: string;
};

export type GetFighterQuery = {
  getFighter?: {
    __typename: 'Fighter';
    contestCount?: number | null;
    createdAt: string;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    gamePosition?: number | null;
    id: string;
    name: string;
    tierBreakdown?: string | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type GetGameQueryVariables = {
  id: string;
};

export type GetGameQuery = {
  getGame?: {
    __typename: 'Game';
    createdAt: string;
    deletedAt?: string | null;
    fighters?: {
      __typename: 'ModelFighterConnection';
      nextToken?: string | null;
    } | null;
    id: string;
    name: string;
    rivalries?: {
      __typename: 'ModelRivalryConnection';
      nextToken?: string | null;
    } | null;
    snapshots?: {
      __typename: 'ModelTierListSnapshotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
  } | null;
};

export type GetRivalryQueryVariables = {
  id: string;
};

export type GetRivalryQuery = {
  getRivalry?: {
    __typename: 'Rivalry';
    accepted?: boolean | null;
    contestCount: number;
    contests?: {
      __typename: 'ModelContestConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    currentContestId?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    hiddenByA?: boolean | null;
    hiddenByB?: boolean | null;
    id: string;
    tierLists?: {
      __typename: 'ModelTierListConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    userAId: string;
    userBId: string;
  } | null;
};

export type GetTierListQueryVariables = {
  id: string;
};

export type GetTierListQuery = {
  getTierList?: {
    __typename: 'TierList';
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    standing?: number | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt?: string | null;
    userId: string;
  } | null;
};

export type GetTierListSnapshotQueryVariables = {
  id: string;
};

export type GetTierListSnapshotQuery = {
  getTierListSnapshot?: {
    __typename: 'TierListSnapshot';
    arrangement: string;
    createdAt?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    id: string;
    name: string;
    shareCode: string;
    updatedAt: string;
    userId: string;
  } | null;
};

export type GetTierSlotQueryVariables = {
  id: string;
};

export type GetTierSlotQuery = {
  getTierSlot?: {
    __typename: 'TierSlot';
    contestCount?: number | null;
    createdAt: string;
    deletedAt?: string | null;
    fighter?: {
      __typename: 'Fighter';
      contestCount?: number | null;
      createdAt: string;
      gameId: string;
      gamePosition?: number | null;
      id: string;
      name: string;
      tierBreakdown?: string | null;
      updatedAt: string;
      winCount?: number | null;
    } | null;
    fighterId: string;
    id: string;
    position?: number | null;
    tierList?: {
      __typename: 'TierList';
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      rivalryId: string;
      standing?: number | null;
      updatedAt?: string | null;
      userId: string;
    } | null;
    tierListId: string;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type GetUserQueryVariables = {
  id: string;
};

export type GetUserQuery = {
  getUser?: {
    __typename: 'User';
    awsSub: string;
    createdAt: string;
    deletedAt?: string | null;
    email: string;
    firstName?: string | null;
    id: string;
    lastName?: string | null;
    role: number;
    updatedAt: string;
  } | null;
};

export type ListContestsQueryVariables = {
  filter?: ModelContestFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListContestsQuery = {
  listContests?: {
    __typename: 'ModelContestConnection';
    items: Array<{
      __typename: 'Contest';
      bias?: number | null;
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      result?: number | null;
      rivalryId: string;
      tierSlotAId: string;
      tierSlotBId: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type ListFightersQueryVariables = {
  filter?: ModelFighterFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListFightersQuery = {
  listFighters?: {
    __typename: 'ModelFighterConnection';
    items: Array<{
      __typename: 'Fighter';
      contestCount?: number | null;
      createdAt: string;
      gameId: string;
      gamePosition?: number | null;
      id: string;
      name: string;
      tierBreakdown?: string | null;
      updatedAt: string;
      winCount?: number | null;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type ListGamesQueryVariables = {
  filter?: ModelGameFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListGamesQuery = {
  listGames?: {
    __typename: 'ModelGameConnection';
    items: Array<{
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type ListRivalriesQueryVariables = {
  filter?: ModelRivalryFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListRivalriesQuery = {
  listRivalries?: {
    __typename: 'ModelRivalryConnection';
    items: Array<{
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type ListTierListSnapshotsQueryVariables = {
  filter?: ModelTierListSnapshotFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListTierListSnapshotsQuery = {
  listTierListSnapshots?: {
    __typename: 'ModelTierListSnapshotConnection';
    items: Array<{
      __typename: 'TierListSnapshot';
      arrangement: string;
      createdAt?: string | null;
      deletedAt?: string | null;
      gameId: string;
      id: string;
      name: string;
      shareCode: string;
      updatedAt: string;
      userId: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type ListTierListsQueryVariables = {
  filter?: ModelTierListFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListTierListsQuery = {
  listTierLists?: {
    __typename: 'ModelTierListConnection';
    items: Array<{
      __typename: 'TierList';
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      rivalryId: string;
      standing?: number | null;
      updatedAt?: string | null;
      userId: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type ListTierSlotsQueryVariables = {
  filter?: ModelTierSlotFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListTierSlotsQuery = {
  listTierSlots?: {
    __typename: 'ModelTierSlotConnection';
    items: Array<{
      __typename: 'TierSlot';
      contestCount?: number | null;
      createdAt: string;
      deletedAt?: string | null;
      fighterId: string;
      id: string;
      position?: number | null;
      tierListId: string;
      updatedAt: string;
      winCount?: number | null;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListUsersQuery = {
  listUsers?: {
    __typename: 'ModelUserConnection';
    items: Array<{
      __typename: 'User';
      awsSub: string;
      createdAt: string;
      deletedAt?: string | null;
      email: string;
      firstName?: string | null;
      id: string;
      lastName?: string | null;
      role: number;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type SnapshotByShareCodeQueryVariables = {
  filter?: ModelTierListSnapshotFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
  shareCode: string;
  sortDirection?: ModelSortDirection | null;
};

export type SnapshotByShareCodeQuery = {
  snapshotByShareCode?: {
    __typename: 'ModelTierListSnapshotConnection';
    items: Array<{
      __typename: 'TierListSnapshot';
      arrangement: string;
      createdAt?: string | null;
      deletedAt?: string | null;
      gameId: string;
      id: string;
      name: string;
      shareCode: string;
      updatedAt: string;
      userId: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type SnapshotsByUserIdAndCreatedAtQueryVariables = {
  createdAt?: ModelStringKeyConditionInput | null;
  filter?: ModelTierListSnapshotFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
  sortDirection?: ModelSortDirection | null;
  userId: string;
};

export type SnapshotsByUserIdAndCreatedAtQuery = {
  snapshotsByUserIdAndCreatedAt?: {
    __typename: 'ModelTierListSnapshotConnection';
    items: Array<{
      __typename: 'TierListSnapshot';
      arrangement: string;
      createdAt?: string | null;
      deletedAt?: string | null;
      gameId: string;
      id: string;
      name: string;
      shareCode: string;
      updatedAt: string;
      userId: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type TierListsByUserIdAndUpdatedAtQueryVariables = {
  filter?: ModelTierListFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
  sortDirection?: ModelSortDirection | null;
  updatedAt?: ModelStringKeyConditionInput | null;
  userId: string;
};

export type TierListsByUserIdAndUpdatedAtQuery = {
  tierListsByUserIdAndUpdatedAt?: {
    __typename: 'ModelTierListConnection';
    items: Array<{
      __typename: 'TierList';
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      rivalryId: string;
      standing?: number | null;
      updatedAt?: string | null;
      userId: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type CreateContestMutationVariables = {
  condition?: ModelContestConditionInput | null;
  input: CreateContestInput;
};

export type CreateContestMutation = {
  createContest?: {
    __typename: 'Contest';
    bias?: number | null;
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    result?: number | null;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    tierSlotAId: string;
    tierSlotBId: string;
    updatedAt: string;
  } | null;
};

export type CreateFighterMutationVariables = {
  condition?: ModelFighterConditionInput | null;
  input: CreateFighterInput;
};

export type CreateFighterMutation = {
  createFighter?: {
    __typename: 'Fighter';
    contestCount?: number | null;
    createdAt: string;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    gamePosition?: number | null;
    id: string;
    name: string;
    tierBreakdown?: string | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type CreateGameMutationVariables = {
  condition?: ModelGameConditionInput | null;
  input: CreateGameInput;
};

export type CreateGameMutation = {
  createGame?: {
    __typename: 'Game';
    createdAt: string;
    deletedAt?: string | null;
    fighters?: {
      __typename: 'ModelFighterConnection';
      nextToken?: string | null;
    } | null;
    id: string;
    name: string;
    rivalries?: {
      __typename: 'ModelRivalryConnection';
      nextToken?: string | null;
    } | null;
    snapshots?: {
      __typename: 'ModelTierListSnapshotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
  } | null;
};

export type CreateRivalryMutationVariables = {
  condition?: ModelRivalryConditionInput | null;
  input: CreateRivalryInput;
};

export type CreateRivalryMutation = {
  createRivalry?: {
    __typename: 'Rivalry';
    accepted?: boolean | null;
    contestCount: number;
    contests?: {
      __typename: 'ModelContestConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    currentContestId?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    hiddenByA?: boolean | null;
    hiddenByB?: boolean | null;
    id: string;
    tierLists?: {
      __typename: 'ModelTierListConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    userAId: string;
    userBId: string;
  } | null;
};

export type CreateTierListMutationVariables = {
  condition?: ModelTierListConditionInput | null;
  input: CreateTierListInput;
};

export type CreateTierListMutation = {
  createTierList?: {
    __typename: 'TierList';
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    standing?: number | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt?: string | null;
    userId: string;
  } | null;
};

export type CreateTierListSnapshotMutationVariables = {
  condition?: ModelTierListSnapshotConditionInput | null;
  input: CreateTierListSnapshotInput;
};

export type CreateTierListSnapshotMutation = {
  createTierListSnapshot?: {
    __typename: 'TierListSnapshot';
    arrangement: string;
    createdAt?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    id: string;
    name: string;
    shareCode: string;
    updatedAt: string;
    userId: string;
  } | null;
};

export type CreateTierSlotMutationVariables = {
  condition?: ModelTierSlotConditionInput | null;
  input: CreateTierSlotInput;
};

export type CreateTierSlotMutation = {
  createTierSlot?: {
    __typename: 'TierSlot';
    contestCount?: number | null;
    createdAt: string;
    deletedAt?: string | null;
    fighter?: {
      __typename: 'Fighter';
      contestCount?: number | null;
      createdAt: string;
      gameId: string;
      gamePosition?: number | null;
      id: string;
      name: string;
      tierBreakdown?: string | null;
      updatedAt: string;
      winCount?: number | null;
    } | null;
    fighterId: string;
    id: string;
    position?: number | null;
    tierList?: {
      __typename: 'TierList';
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      rivalryId: string;
      standing?: number | null;
      updatedAt?: string | null;
      userId: string;
    } | null;
    tierListId: string;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type CreateUserMutationVariables = {
  condition?: ModelUserConditionInput | null;
  input: CreateUserInput;
};

export type CreateUserMutation = {
  createUser?: {
    __typename: 'User';
    awsSub: string;
    createdAt: string;
    deletedAt?: string | null;
    email: string;
    firstName?: string | null;
    id: string;
    lastName?: string | null;
    role: number;
    updatedAt: string;
  } | null;
};

export type DeleteContestMutationVariables = {
  condition?: ModelContestConditionInput | null;
  input: DeleteContestInput;
};

export type DeleteContestMutation = {
  deleteContest?: {
    __typename: 'Contest';
    bias?: number | null;
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    result?: number | null;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    tierSlotAId: string;
    tierSlotBId: string;
    updatedAt: string;
  } | null;
};

export type DeleteFighterMutationVariables = {
  condition?: ModelFighterConditionInput | null;
  input: DeleteFighterInput;
};

export type DeleteFighterMutation = {
  deleteFighter?: {
    __typename: 'Fighter';
    contestCount?: number | null;
    createdAt: string;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    gamePosition?: number | null;
    id: string;
    name: string;
    tierBreakdown?: string | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type DeleteGameMutationVariables = {
  condition?: ModelGameConditionInput | null;
  input: DeleteGameInput;
};

export type DeleteGameMutation = {
  deleteGame?: {
    __typename: 'Game';
    createdAt: string;
    deletedAt?: string | null;
    fighters?: {
      __typename: 'ModelFighterConnection';
      nextToken?: string | null;
    } | null;
    id: string;
    name: string;
    rivalries?: {
      __typename: 'ModelRivalryConnection';
      nextToken?: string | null;
    } | null;
    snapshots?: {
      __typename: 'ModelTierListSnapshotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
  } | null;
};

export type DeleteRivalryMutationVariables = {
  condition?: ModelRivalryConditionInput | null;
  input: DeleteRivalryInput;
};

export type DeleteRivalryMutation = {
  deleteRivalry?: {
    __typename: 'Rivalry';
    accepted?: boolean | null;
    contestCount: number;
    contests?: {
      __typename: 'ModelContestConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    currentContestId?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    hiddenByA?: boolean | null;
    hiddenByB?: boolean | null;
    id: string;
    tierLists?: {
      __typename: 'ModelTierListConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    userAId: string;
    userBId: string;
  } | null;
};

export type DeleteTierListMutationVariables = {
  condition?: ModelTierListConditionInput | null;
  input: DeleteTierListInput;
};

export type DeleteTierListMutation = {
  deleteTierList?: {
    __typename: 'TierList';
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    standing?: number | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt?: string | null;
    userId: string;
  } | null;
};

export type DeleteTierListSnapshotMutationVariables = {
  condition?: ModelTierListSnapshotConditionInput | null;
  input: DeleteTierListSnapshotInput;
};

export type DeleteTierListSnapshotMutation = {
  deleteTierListSnapshot?: {
    __typename: 'TierListSnapshot';
    arrangement: string;
    createdAt?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    id: string;
    name: string;
    shareCode: string;
    updatedAt: string;
    userId: string;
  } | null;
};

export type DeleteTierSlotMutationVariables = {
  condition?: ModelTierSlotConditionInput | null;
  input: DeleteTierSlotInput;
};

export type DeleteTierSlotMutation = {
  deleteTierSlot?: {
    __typename: 'TierSlot';
    contestCount?: number | null;
    createdAt: string;
    deletedAt?: string | null;
    fighter?: {
      __typename: 'Fighter';
      contestCount?: number | null;
      createdAt: string;
      gameId: string;
      gamePosition?: number | null;
      id: string;
      name: string;
      tierBreakdown?: string | null;
      updatedAt: string;
      winCount?: number | null;
    } | null;
    fighterId: string;
    id: string;
    position?: number | null;
    tierList?: {
      __typename: 'TierList';
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      rivalryId: string;
      standing?: number | null;
      updatedAt?: string | null;
      userId: string;
    } | null;
    tierListId: string;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type DeleteUserMutationVariables = {
  condition?: ModelUserConditionInput | null;
  input: DeleteUserInput;
};

export type DeleteUserMutation = {
  deleteUser?: {
    __typename: 'User';
    awsSub: string;
    createdAt: string;
    deletedAt?: string | null;
    email: string;
    firstName?: string | null;
    id: string;
    lastName?: string | null;
    role: number;
    updatedAt: string;
  } | null;
};

export type IncrementFighterStatsMutationVariables = {
  fighterId: string;
  won: boolean;
};

export type IncrementFighterStatsMutation = {
  incrementFighterStats?: {
    __typename: 'Fighter';
    contestCount?: number | null;
    createdAt: string;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    gamePosition?: number | null;
    id: string;
    name: string;
    tierBreakdown?: string | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type IncrementTierSlotStatsMutationVariables = {
  tierSlotId: string;
  won: boolean;
};

export type IncrementTierSlotStatsMutation = {
  incrementTierSlotStats?: {
    __typename: 'TierSlot';
    contestCount?: number | null;
    createdAt: string;
    deletedAt?: string | null;
    fighter?: {
      __typename: 'Fighter';
      contestCount?: number | null;
      createdAt: string;
      gameId: string;
      gamePosition?: number | null;
      id: string;
      name: string;
      tierBreakdown?: string | null;
      updatedAt: string;
      winCount?: number | null;
    } | null;
    fighterId: string;
    id: string;
    position?: number | null;
    tierList?: {
      __typename: 'TierList';
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      rivalryId: string;
      standing?: number | null;
      updatedAt?: string | null;
      userId: string;
    } | null;
    tierListId: string;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type UpdateContestMutationVariables = {
  condition?: ModelContestConditionInput | null;
  input: UpdateContestInput;
};

export type UpdateContestMutation = {
  updateContest?: {
    __typename: 'Contest';
    bias?: number | null;
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    result?: number | null;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    tierSlotAId: string;
    tierSlotBId: string;
    updatedAt: string;
  } | null;
};

export type UpdateFighterMutationVariables = {
  condition?: ModelFighterConditionInput | null;
  input: UpdateFighterInput;
};

export type UpdateFighterMutation = {
  updateFighter?: {
    __typename: 'Fighter';
    contestCount?: number | null;
    createdAt: string;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    gamePosition?: number | null;
    id: string;
    name: string;
    tierBreakdown?: string | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type UpdateGameMutationVariables = {
  condition?: ModelGameConditionInput | null;
  input: UpdateGameInput;
};

export type UpdateGameMutation = {
  updateGame?: {
    __typename: 'Game';
    createdAt: string;
    deletedAt?: string | null;
    fighters?: {
      __typename: 'ModelFighterConnection';
      nextToken?: string | null;
    } | null;
    id: string;
    name: string;
    rivalries?: {
      __typename: 'ModelRivalryConnection';
      nextToken?: string | null;
    } | null;
    snapshots?: {
      __typename: 'ModelTierListSnapshotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
  } | null;
};

export type UpdateRivalryMutationVariables = {
  condition?: ModelRivalryConditionInput | null;
  input: UpdateRivalryInput;
};

export type UpdateRivalryMutation = {
  updateRivalry?: {
    __typename: 'Rivalry';
    accepted?: boolean | null;
    contestCount: number;
    contests?: {
      __typename: 'ModelContestConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    currentContestId?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    hiddenByA?: boolean | null;
    hiddenByB?: boolean | null;
    id: string;
    tierLists?: {
      __typename: 'ModelTierListConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    userAId: string;
    userBId: string;
  } | null;
};

export type UpdateTierListMutationVariables = {
  condition?: ModelTierListConditionInput | null;
  input: UpdateTierListInput;
};

export type UpdateTierListMutation = {
  updateTierList?: {
    __typename: 'TierList';
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    standing?: number | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt?: string | null;
    userId: string;
  } | null;
};

export type UpdateTierListSnapshotMutationVariables = {
  condition?: ModelTierListSnapshotConditionInput | null;
  input: UpdateTierListSnapshotInput;
};

export type UpdateTierListSnapshotMutation = {
  updateTierListSnapshot?: {
    __typename: 'TierListSnapshot';
    arrangement: string;
    createdAt?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    id: string;
    name: string;
    shareCode: string;
    updatedAt: string;
    userId: string;
  } | null;
};

export type UpdateTierSlotMutationVariables = {
  condition?: ModelTierSlotConditionInput | null;
  input: UpdateTierSlotInput;
};

export type UpdateTierSlotMutation = {
  updateTierSlot?: {
    __typename: 'TierSlot';
    contestCount?: number | null;
    createdAt: string;
    deletedAt?: string | null;
    fighter?: {
      __typename: 'Fighter';
      contestCount?: number | null;
      createdAt: string;
      gameId: string;
      gamePosition?: number | null;
      id: string;
      name: string;
      tierBreakdown?: string | null;
      updatedAt: string;
      winCount?: number | null;
    } | null;
    fighterId: string;
    id: string;
    position?: number | null;
    tierList?: {
      __typename: 'TierList';
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      rivalryId: string;
      standing?: number | null;
      updatedAt?: string | null;
      userId: string;
    } | null;
    tierListId: string;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type UpdateUserMutationVariables = {
  condition?: ModelUserConditionInput | null;
  input: UpdateUserInput;
};

export type UpdateUserMutation = {
  updateUser?: {
    __typename: 'User';
    awsSub: string;
    createdAt: string;
    deletedAt?: string | null;
    email: string;
    firstName?: string | null;
    id: string;
    lastName?: string | null;
    role: number;
    updatedAt: string;
  } | null;
};

export type OnCreateContestSubscriptionVariables = {
  filter?: ModelSubscriptionContestFilterInput | null;
};

export type OnCreateContestSubscription = {
  onCreateContest?: {
    __typename: 'Contest';
    bias?: number | null;
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    result?: number | null;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    tierSlotAId: string;
    tierSlotBId: string;
    updatedAt: string;
  } | null;
};

export type OnCreateFighterSubscriptionVariables = {
  filter?: ModelSubscriptionFighterFilterInput | null;
};

export type OnCreateFighterSubscription = {
  onCreateFighter?: {
    __typename: 'Fighter';
    contestCount?: number | null;
    createdAt: string;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    gamePosition?: number | null;
    id: string;
    name: string;
    tierBreakdown?: string | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type OnCreateGameSubscriptionVariables = {
  filter?: ModelSubscriptionGameFilterInput | null;
};

export type OnCreateGameSubscription = {
  onCreateGame?: {
    __typename: 'Game';
    createdAt: string;
    deletedAt?: string | null;
    fighters?: {
      __typename: 'ModelFighterConnection';
      nextToken?: string | null;
    } | null;
    id: string;
    name: string;
    rivalries?: {
      __typename: 'ModelRivalryConnection';
      nextToken?: string | null;
    } | null;
    snapshots?: {
      __typename: 'ModelTierListSnapshotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
  } | null;
};

export type OnCreateRivalrySubscriptionVariables = {
  filter?: ModelSubscriptionRivalryFilterInput | null;
};

export type OnCreateRivalrySubscription = {
  onCreateRivalry?: {
    __typename: 'Rivalry';
    accepted?: boolean | null;
    contestCount: number;
    contests?: {
      __typename: 'ModelContestConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    currentContestId?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    hiddenByA?: boolean | null;
    hiddenByB?: boolean | null;
    id: string;
    tierLists?: {
      __typename: 'ModelTierListConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    userAId: string;
    userBId: string;
  } | null;
};

export type OnCreateTierListSubscriptionVariables = {
  filter?: ModelSubscriptionTierListFilterInput | null;
};

export type OnCreateTierListSubscription = {
  onCreateTierList?: {
    __typename: 'TierList';
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    standing?: number | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt?: string | null;
    userId: string;
  } | null;
};

export type OnCreateTierListSnapshotSubscriptionVariables = {
  filter?: ModelSubscriptionTierListSnapshotFilterInput | null;
};

export type OnCreateTierListSnapshotSubscription = {
  onCreateTierListSnapshot?: {
    __typename: 'TierListSnapshot';
    arrangement: string;
    createdAt?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    id: string;
    name: string;
    shareCode: string;
    updatedAt: string;
    userId: string;
  } | null;
};

export type OnCreateTierSlotSubscriptionVariables = {
  filter?: ModelSubscriptionTierSlotFilterInput | null;
};

export type OnCreateTierSlotSubscription = {
  onCreateTierSlot?: {
    __typename: 'TierSlot';
    contestCount?: number | null;
    createdAt: string;
    deletedAt?: string | null;
    fighter?: {
      __typename: 'Fighter';
      contestCount?: number | null;
      createdAt: string;
      gameId: string;
      gamePosition?: number | null;
      id: string;
      name: string;
      tierBreakdown?: string | null;
      updatedAt: string;
      winCount?: number | null;
    } | null;
    fighterId: string;
    id: string;
    position?: number | null;
    tierList?: {
      __typename: 'TierList';
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      rivalryId: string;
      standing?: number | null;
      updatedAt?: string | null;
      userId: string;
    } | null;
    tierListId: string;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null;
};

export type OnCreateUserSubscription = {
  onCreateUser?: {
    __typename: 'User';
    awsSub: string;
    createdAt: string;
    deletedAt?: string | null;
    email: string;
    firstName?: string | null;
    id: string;
    lastName?: string | null;
    role: number;
    updatedAt: string;
  } | null;
};

export type OnDeleteContestSubscriptionVariables = {
  filter?: ModelSubscriptionContestFilterInput | null;
};

export type OnDeleteContestSubscription = {
  onDeleteContest?: {
    __typename: 'Contest';
    bias?: number | null;
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    result?: number | null;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    tierSlotAId: string;
    tierSlotBId: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteFighterSubscriptionVariables = {
  filter?: ModelSubscriptionFighterFilterInput | null;
};

export type OnDeleteFighterSubscription = {
  onDeleteFighter?: {
    __typename: 'Fighter';
    contestCount?: number | null;
    createdAt: string;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    gamePosition?: number | null;
    id: string;
    name: string;
    tierBreakdown?: string | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type OnDeleteGameSubscriptionVariables = {
  filter?: ModelSubscriptionGameFilterInput | null;
};

export type OnDeleteGameSubscription = {
  onDeleteGame?: {
    __typename: 'Game';
    createdAt: string;
    deletedAt?: string | null;
    fighters?: {
      __typename: 'ModelFighterConnection';
      nextToken?: string | null;
    } | null;
    id: string;
    name: string;
    rivalries?: {
      __typename: 'ModelRivalryConnection';
      nextToken?: string | null;
    } | null;
    snapshots?: {
      __typename: 'ModelTierListSnapshotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
  } | null;
};

export type OnDeleteRivalrySubscriptionVariables = {
  filter?: ModelSubscriptionRivalryFilterInput | null;
};

export type OnDeleteRivalrySubscription = {
  onDeleteRivalry?: {
    __typename: 'Rivalry';
    accepted?: boolean | null;
    contestCount: number;
    contests?: {
      __typename: 'ModelContestConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    currentContestId?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    hiddenByA?: boolean | null;
    hiddenByB?: boolean | null;
    id: string;
    tierLists?: {
      __typename: 'ModelTierListConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    userAId: string;
    userBId: string;
  } | null;
};

export type OnDeleteTierListSubscriptionVariables = {
  filter?: ModelSubscriptionTierListFilterInput | null;
};

export type OnDeleteTierListSubscription = {
  onDeleteTierList?: {
    __typename: 'TierList';
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    standing?: number | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt?: string | null;
    userId: string;
  } | null;
};

export type OnDeleteTierListSnapshotSubscriptionVariables = {
  filter?: ModelSubscriptionTierListSnapshotFilterInput | null;
};

export type OnDeleteTierListSnapshotSubscription = {
  onDeleteTierListSnapshot?: {
    __typename: 'TierListSnapshot';
    arrangement: string;
    createdAt?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    id: string;
    name: string;
    shareCode: string;
    updatedAt: string;
    userId: string;
  } | null;
};

export type OnDeleteTierSlotSubscriptionVariables = {
  filter?: ModelSubscriptionTierSlotFilterInput | null;
};

export type OnDeleteTierSlotSubscription = {
  onDeleteTierSlot?: {
    __typename: 'TierSlot';
    contestCount?: number | null;
    createdAt: string;
    deletedAt?: string | null;
    fighter?: {
      __typename: 'Fighter';
      contestCount?: number | null;
      createdAt: string;
      gameId: string;
      gamePosition?: number | null;
      id: string;
      name: string;
      tierBreakdown?: string | null;
      updatedAt: string;
      winCount?: number | null;
    } | null;
    fighterId: string;
    id: string;
    position?: number | null;
    tierList?: {
      __typename: 'TierList';
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      rivalryId: string;
      standing?: number | null;
      updatedAt?: string | null;
      userId: string;
    } | null;
    tierListId: string;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null;
};

export type OnDeleteUserSubscription = {
  onDeleteUser?: {
    __typename: 'User';
    awsSub: string;
    createdAt: string;
    deletedAt?: string | null;
    email: string;
    firstName?: string | null;
    id: string;
    lastName?: string | null;
    role: number;
    updatedAt: string;
  } | null;
};

export type OnUpdateContestSubscriptionVariables = {
  filter?: ModelSubscriptionContestFilterInput | null;
};

export type OnUpdateContestSubscription = {
  onUpdateContest?: {
    __typename: 'Contest';
    bias?: number | null;
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    result?: number | null;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    tierSlotAId: string;
    tierSlotBId: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateFighterSubscriptionVariables = {
  filter?: ModelSubscriptionFighterFilterInput | null;
};

export type OnUpdateFighterSubscription = {
  onUpdateFighter?: {
    __typename: 'Fighter';
    contestCount?: number | null;
    createdAt: string;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    gamePosition?: number | null;
    id: string;
    name: string;
    tierBreakdown?: string | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type OnUpdateGameSubscriptionVariables = {
  filter?: ModelSubscriptionGameFilterInput | null;
};

export type OnUpdateGameSubscription = {
  onUpdateGame?: {
    __typename: 'Game';
    createdAt: string;
    deletedAt?: string | null;
    fighters?: {
      __typename: 'ModelFighterConnection';
      nextToken?: string | null;
    } | null;
    id: string;
    name: string;
    rivalries?: {
      __typename: 'ModelRivalryConnection';
      nextToken?: string | null;
    } | null;
    snapshots?: {
      __typename: 'ModelTierListSnapshotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
  } | null;
};

export type OnUpdateRivalrySubscriptionVariables = {
  filter?: ModelSubscriptionRivalryFilterInput | null;
};

export type OnUpdateRivalrySubscription = {
  onUpdateRivalry?: {
    __typename: 'Rivalry';
    accepted?: boolean | null;
    contestCount: number;
    contests?: {
      __typename: 'ModelContestConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    currentContestId?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    hiddenByA?: boolean | null;
    hiddenByB?: boolean | null;
    id: string;
    tierLists?: {
      __typename: 'ModelTierListConnection';
      nextToken?: string | null;
    } | null;
    updatedAt: string;
    userAId: string;
    userBId: string;
  } | null;
};

export type OnUpdateTierListSubscriptionVariables = {
  filter?: ModelSubscriptionTierListFilterInput | null;
};

export type OnUpdateTierListSubscription = {
  onUpdateTierList?: {
    __typename: 'TierList';
    createdAt?: string | null;
    deletedAt?: string | null;
    id: string;
    rivalry?: {
      __typename: 'Rivalry';
      accepted?: boolean | null;
      contestCount: number;
      createdAt: string;
      currentContestId?: string | null;
      deletedAt?: string | null;
      gameId: string;
      hiddenByA?: boolean | null;
      hiddenByB?: boolean | null;
      id: string;
      updatedAt: string;
      userAId: string;
      userBId: string;
    } | null;
    rivalryId: string;
    standing?: number | null;
    tierSlots?: {
      __typename: 'ModelTierSlotConnection';
      nextToken?: string | null;
    } | null;
    updatedAt?: string | null;
    userId: string;
  } | null;
};

export type OnUpdateTierListSnapshotSubscriptionVariables = {
  filter?: ModelSubscriptionTierListSnapshotFilterInput | null;
};

export type OnUpdateTierListSnapshotSubscription = {
  onUpdateTierListSnapshot?: {
    __typename: 'TierListSnapshot';
    arrangement: string;
    createdAt?: string | null;
    deletedAt?: string | null;
    game?: {
      __typename: 'Game';
      createdAt: string;
      deletedAt?: string | null;
      id: string;
      name: string;
      updatedAt: string;
    } | null;
    gameId: string;
    id: string;
    name: string;
    shareCode: string;
    updatedAt: string;
    userId: string;
  } | null;
};

export type OnUpdateTierSlotSubscriptionVariables = {
  filter?: ModelSubscriptionTierSlotFilterInput | null;
};

export type OnUpdateTierSlotSubscription = {
  onUpdateTierSlot?: {
    __typename: 'TierSlot';
    contestCount?: number | null;
    createdAt: string;
    deletedAt?: string | null;
    fighter?: {
      __typename: 'Fighter';
      contestCount?: number | null;
      createdAt: string;
      gameId: string;
      gamePosition?: number | null;
      id: string;
      name: string;
      tierBreakdown?: string | null;
      updatedAt: string;
      winCount?: number | null;
    } | null;
    fighterId: string;
    id: string;
    position?: number | null;
    tierList?: {
      __typename: 'TierList';
      createdAt?: string | null;
      deletedAt?: string | null;
      id: string;
      rivalryId: string;
      standing?: number | null;
      updatedAt?: string | null;
      userId: string;
    } | null;
    tierListId: string;
    updatedAt: string;
    winCount?: number | null;
  } | null;
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null;
};

export type OnUpdateUserSubscription = {
  onUpdateUser?: {
    __typename: 'User';
    awsSub: string;
    createdAt: string;
    deletedAt?: string | null;
    email: string;
    firstName?: string | null;
    id: string;
    lastName?: string | null;
    role: number;
    updatedAt: string;
  } | null;
};
