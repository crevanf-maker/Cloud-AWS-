const { v4: uuidv4 } = require('uuid');
const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb, TABLE_NAME, ALL_ITEMS_INDEX } = require('../lib/dynamo');
const { success, failure } = require('../lib/response');
const { getUserContext } = require('../lib/auth');
const { computeRiskScore } = require('../lib/riskScoring');

const VALID_CATEGORIES = ['medical', 'fire', 'security', 'infrastructure', 'harassment', 'other'];
const ALL_ITEMS_PK = 'INCIDENT';

/**
 * Counts incidents reported at the same building within the last 30 days.
 * Used as the "hotspot" factor for the risk score. Reads from the
 * time-ordered GSI so this stays a cheap bounded query even as the table
 * grows, rather than a full table scan.
 */
async function getHotspotCount(building) {
  if (!building) return 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: ALL_ITEMS_INDEX,
      KeyConditionExpression: 'gsi1pk = :pk AND createdAt >= :from',
      FilterExpression: '#loc.#bldg = :building',
      ExpressionAttributeNames: { '#loc': 'location', '#bldg': 'building' },
      ExpressionAttributeValues: {
        ':pk': ALL_ITEMS_PK,
        ':from': thirtyDaysAgo,
        ':building': building,
      },
    })
  );

  return result.Items ? result.Items.length : 0;
}

exports.handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return failure(400, 'Invalid JSON body');
  }

  const { title, description, category, severity, location, photoKey } = payload;

  if (!title || !description || !category || !severity || !location || !location.building) {
    return failure(400, 'title, description, category, severity and location.building are required');
  }

  if (!VALID_CATEGORIES.includes(String(category).toLowerCase())) {
    return failure(400, `category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  const severityNum = Number(severity);
  if (!Number.isInteger(severityNum) || severityNum < 1 || severityNum > 5) {
    return failure(400, 'severity must be an integer between 1 and 5');
  }

  const user = getUserContext(event);
  const now = new Date();
  const nowIso = now.toISOString();

  const historicalCount = await getHotspotCount(location.building);
  const risk = computeRiskScore({
    severity: severityNum,
    category,
    historicalCount,
    occurredAt: now,
  });

  const incidentId = uuidv4();
  const item = {
    incidentId,
    title,
    description,
    category: String(category).toLowerCase(),
    severity: severityNum,
    location: {
      building: location.building,
      lat: location.lat ?? null,
      lng: location.lng ?? null,
    },
    photoKey: photoKey || null,
    status: 'reported',
    riskScore: risk.score,
    priority: risk.priority,
    reportedBy: user.sub || 'anonymous',
    reportedByName: user.name || 'Unknown reporter',
    assignedTo: null,
    statusHistory: [{ status: 'reported', at: nowIso, by: user.name || 'Unknown reporter' }],
    createdAt: nowIso,
    updatedAt: nowIso,
    gsi1pk: ALL_ITEMS_PK,
  };

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  return success(201, { incident: item });
};
