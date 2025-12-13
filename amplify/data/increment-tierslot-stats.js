import { util } from '@aws-appsync/utils';

/**
 * Atomically increments TierSlot contestCount and optionally winCount
 * Uses DynamoDB's ADD operation for race-condition-free increments
 */
export function request(ctx) {
  const { tierSlotId, won } = ctx.arguments;

  // Build the update expression dynamically
  const expressionNames = {
    '#contestCount': 'contestCount',
  };

  const expressionValues = {
    ':contestIncrement': 1,
  };

  let updateExpression = 'ADD #contestCount :contestIncrement';

  // If the tier slot won, also increment winCount
  if (won) {
    expressionNames['#winCount'] = 'winCount';
    expressionValues[':winIncrement'] = 1;
    updateExpression += ', #winCount :winIncrement';
  }

  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues({ id: tierSlotId }),
    update: {
      expression: updateExpression,
      expressionNames,
      expressionValues: util.dynamodb.toMapValues(expressionValues),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
