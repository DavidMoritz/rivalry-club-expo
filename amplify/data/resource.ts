import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Rivalry Club Data Schema
 * Based on the rn-app schema with Amplify Gen 2 syntax
 */
const schema = a.schema({
  // Game type - represents a fighting game
  Game: a
    .model({
      name: a.string().required(),
      fighters: a.hasMany('Fighter', 'gameId'),
      rivalries: a.hasMany('Rivalry', 'gameId'),
      deletedAt: a.datetime()
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Fighter type - represents a character in a game
  Fighter: a
    .model({
      name: a.string().required(),
      gameId: a.id().required(),
      game: a.belongsTo('Game', 'gameId'),
      gamePosition: a.integer(),
      contestCount: a.integer(),
      winCount: a.integer(),
      tierBreakdown: a.string(),
      tierSlots: a.hasMany('TierSlot', 'fighterId')
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // User type - represents an app user
  User: a
    .model({
      email: a.string().required(),
      firstName: a.string(),
      lastName: a.string(),
      role: a.integer().required(),
      awsSub: a.string().required(),
      deletedAt: a.datetime()
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Rivalry type - represents a competition between two users
  Rivalry: a
    .model({
      userAId: a.id().required(),
      userBId: a.id().required(),
      gameId: a.id().required(),
      game: a.belongsTo('Game', 'gameId'),
      contestCount: a.integer().required(),
      currentContestId: a.id(),
      accepted: a.boolean(),
      hiddenByA: a.boolean(),
      hiddenByB: a.boolean(),
      contests: a.hasMany('Contest', 'rivalryId'),
      tierLists: a.hasMany('TierList', 'rivalryId'),
      deletedAt: a.datetime()
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Contest type - represents a single match between two tier lists
  Contest: a
    .model({
      rivalryId: a.id().required(),
      rivalry: a.belongsTo('Rivalry', 'rivalryId'),
      tierSlotAId: a.id().required(),
      tierSlotBId: a.id().required(),
      result: a.integer(),
      bias: a.integer(),
      createdAt: a.datetime(),
      deletedAt: a.datetime()
    })
    .secondaryIndexes((index) => [
      index('rivalryId').sortKeys(['createdAt']).queryField('contestsByRivalryIdAndCreatedAt')
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  // TierList type - represents a user's ranking of fighters
  TierList: a
    .model({
      rivalryId: a.id().required(),
      rivalry: a.belongsTo('Rivalry', 'rivalryId'),
      userId: a.id().required(),
      standing: a.integer(),
      tierSlots: a.hasMany('TierSlot', 'tierListId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      deletedAt: a.datetime()
    })
    .secondaryIndexes((index) => [
      index('userId').sortKeys(['updatedAt']).queryField('tierListsByUserIdAndUpdatedAt')
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  // TierSlot type - represents a fighter's position in a tier list
  TierSlot: a
    .model({
      tierListId: a.id().required(),
      tierList: a.belongsTo('TierList', 'tierListId'),
      fighterId: a.id().required(),
      fighter: a.belongsTo('Fighter', 'fighterId'),
      position: a.integer(),
      contestCount: a.integer(),
      winCount: a.integer(),
      deletedAt: a.datetime()
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Custom mutation for atomic increment of TierSlot stats
  incrementTierSlotStats: a
    .mutation()
    .arguments({
      tierSlotId: a.id().required(),
      won: a.boolean().required()
    })
    .returns(a.ref('TierSlot'))
    .handler(
      a.handler.custom({
        dataSource: a.ref('TierSlot'),
        entry: './increment-tierslot-stats.js'
      })
    )
    .authorization((allow) => [allow.publicApiKey()]),

  // Custom mutation for atomic increment of Fighter stats
  incrementFighterStats: a
    .mutation()
    .arguments({
      fighterId: a.id().required(),
      won: a.boolean().required()
    })
    .returns(a.ref('Fighter'))
    .handler(
      a.handler.custom({
        dataSource: a.ref('Fighter'),
        entry: './increment-fighter-stats.js'
      })
    )
    .authorization((allow) => [allow.publicApiKey()])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30
    }
  }
});
