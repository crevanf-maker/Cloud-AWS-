const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb, TABLE_NAME, ALL_ITEMS_INDEX } = require('../lib/dynamo');
const { success, failure } = require('../lib/response');
const { getUserContext } = require('../lib/auth');

const ALL_ITEMS_PK = 'INCIDENT';

function monthBucket(isoDate) {
  return isoDate.slice(0, 7); // yyyy-mm
}

async function queryAll(fromIso, toIso) {
  const items = [];
  let ExclusiveStartKey;

  do {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: ALL_ITEMS_INDEX,
        KeyConditionExpression: 'gsi1pk = :pk AND createdAt BETWEEN :from AND :to',
        ExpressionAttributeValues: { ':pk': ALL_ITEMS_PK, ':from': fromIso, ':to': toIso },
        ExclusiveStartKey,
      })
    );
    items.push(...(result.Items || []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

exports.handler = async (event) => {
  const user = getUserContext(event);
  if (!user.isSecurity) {
    return failure(403, 'Only Security or Admin users can view analytics');
  }

  const qs = event.queryStringParameters || {};
  const to = qs.to ? new Date(qs.to) : new Date();
  const from = qs.from ? new Date(qs.from) : new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);

  let incidents;
  try {
    incidents = await queryAll(from.toISOString(), to.toISOString());
  } catch (err) {
    console.error('analyticsSummary query failed', err);
    return failure(500, 'Failed to compute analytics');
  }

  const byCategory = {};
  const byStatus = {};
  const byPriority = {};
  const byMonth = {};
  const byBuilding = {};

  for (const incident of incidents) {
    byCategory[incident.category] = (byCategory[incident.category] || 0) + 1;
    byStatus[incident.status] = (byStatus[incident.status] || 0) + 1;
    byPriority[incident.priority] = (byPriority[incident.priority] || 0) + 1;

    const month = monthBucket(incident.createdAt);
    byMonth[month] = (byMonth[month] || 0) + 1;

    const building = (incident.location && incident.location.building) || 'Unknown';
    if (!byBuilding[building]) byBuilding[building] = { count: 0, totalRisk: 0 };
    byBuilding[building].count += 1;
    byBuilding[building].totalRisk += incident.riskScore || 0;
  }

  const hotspots = Object.entries(byBuilding)
    .map(([building, stats]) => ({
      building,
      count: stats.count,
      avgRiskScore: Math.round(stats.totalRisk / stats.count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const monthlyTrend = Object.entries(byMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return success(200, {
    range: { from: from.toISOString(), to: to.toISOString() },
    totalIncidents: incidents.length,
    byCategory,
    byStatus,
    byPriority,
    monthlyTrend,
    hotspots,
  });
};
