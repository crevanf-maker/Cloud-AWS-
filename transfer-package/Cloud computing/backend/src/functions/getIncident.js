const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb, TABLE_NAME } = require('../lib/dynamo');
const { success, failure } = require('../lib/response');
const { getUserContext } = require('../lib/auth');

exports.handler = async (event) => {
  const incidentId = event.pathParameters && event.pathParameters.id;
  if (!incidentId) return failure(400, 'incident id is required');

  const user = getUserContext(event);

  const result = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { incidentId } }));
  if (!result.Item) return failure(404, 'Incident not found');

  if (!user.isSecurity && result.Item.reportedBy !== user.sub) {
    return failure(403, 'You do not have access to this incident');
  }

  return success(200, { incident: result.Item });
};
