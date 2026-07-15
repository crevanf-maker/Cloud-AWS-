const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb, TABLE_NAME, STATUS_INDEX, ALL_ITEMS_INDEX, REPORTER_INDEX } = require('../lib/dynamo');
const { success, failure } = require('../lib/response');
const { getUserContext } = require('../lib/auth');

const ALL_ITEMS_PK = 'INCIDENT';

exports.handler = async (event) => {
  const user = getUserContext(event);
  const qs = event.queryStringParameters || {};
  const limit = Math.min(Number(qs.limit) || 50, 100);

  let queryParams;

  if (!user.isSecurity) {
    // Reporters only ever see their own submissions.
    queryParams = {
      TableName: TABLE_NAME,
      IndexName: REPORTER_INDEX,
      KeyConditionExpression: 'reportedBy = :sub',
      ExpressionAttributeValues: { ':sub': user.sub },
      ScanIndexForward: false,
      Limit: limit,
    };
  } else if (qs.status) {
    queryParams = {
      TableName: TABLE_NAME,
      IndexName: STATUS_INDEX,
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': qs.status },
      ScanIndexForward: false,
      Limit: limit,
    };
  } else {
    queryParams = {
      TableName: TABLE_NAME,
      IndexName: ALL_ITEMS_INDEX,
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': ALL_ITEMS_PK },
      ScanIndexForward: false,
      Limit: limit,
    };
  }

  if (qs.category) {
    queryParams.FilterExpression = queryParams.FilterExpression
      ? `${queryParams.FilterExpression} AND category = :category`
      : 'category = :category';
    queryParams.ExpressionAttributeValues[':category'] = qs.category;
  }

  try {
    const result = await ddb.send(new QueryCommand(queryParams));
    return success(200, { incidents: result.Items || [], count: result.Count || 0 });
  } catch (err) {
    console.error('listIncidents failed', err);
    return failure(500, 'Failed to list incidents');
  }
};
