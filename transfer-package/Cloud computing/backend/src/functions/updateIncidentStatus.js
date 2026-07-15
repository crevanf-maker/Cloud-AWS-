const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb, TABLE_NAME } = require('../lib/dynamo');
const { success, failure } = require('../lib/response');
const { getUserContext } = require('../lib/auth');

const VALID_STATUSES = ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'];

exports.handler = async (event) => {
  const user = getUserContext(event);
  if (!user.isSecurity) {
    return failure(403, 'Only Security or Admin users can update incident status');
  }

  const incidentId = event.pathParameters && event.pathParameters.id;
  if (!incidentId) return failure(400, 'incident id is required');

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return failure(400, 'Invalid JSON body');
  }

  const { status, note, assignedTo } = payload;
  if (!status || !VALID_STATUSES.includes(status)) {
    return failure(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const existing = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { incidentId } }));
  if (!existing.Item) return failure(404, 'Incident not found');

  const nowIso = new Date().toISOString();
  const historyEntry = { status, at: nowIso, by: user.name || user.sub, note: note || null };
  const statusHistory = [...(existing.Item.statusHistory || []), historyEntry];

  const result = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { incidentId },
      UpdateExpression:
        'SET #status = :status, updatedAt = :updatedAt, statusHistory = :history, assignedTo = :assignedTo',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': nowIso,
        ':history': statusHistory,
        ':assignedTo': assignedTo ?? existing.Item.assignedTo ?? null,
      },
      ConditionExpression: 'attribute_exists(incidentId)',
      ReturnValues: 'ALL_NEW',
    })
  );

  return success(200, { incident: result.Attributes });
};
