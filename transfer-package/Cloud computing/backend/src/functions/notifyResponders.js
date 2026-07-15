const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const sns = new SNSClient({});
const TOPIC_ARN = process.env.ALERTS_TOPIC_ARN;
const HIGH_PRIORITY = new Set(['High', 'Critical']);

/**
 * Reacts to the Incidents DynamoDB Stream so alerting stays decoupled from
 * the write path (createIncident/updateIncidentStatus just persist data).
 *  - INSERT with High/Critical priority -> alert responders immediately.
 *  - MODIFY where status changed -> notify on progress/closure.
 */
exports.handler = async (event) => {
  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (err) {
      // Log and continue so one bad record doesn't block the rest of the batch.
      console.error('Failed to process stream record', err);
    }
  }
};

async function processRecord(record) {
  if (record.eventName === 'INSERT') {
    const incident = unmarshall(record.dynamodb.NewImage);
    if (HIGH_PRIORITY.has(incident.priority)) {
      await publish(
        `[${incident.priority} PRIORITY] New incident reported`,
        `${incident.title}\nCategory: ${incident.category}\nLocation: ${incident.location.building}\nRisk score: ${incident.riskScore}\n\n${incident.description}`
      );
    }
    return;
  }

  if (record.eventName === 'MODIFY') {
    const before = unmarshall(record.dynamodb.OldImage);
    const after = unmarshall(record.dynamodb.NewImage);
    if (before.status !== after.status) {
      await publish(
        `Incident status updated: ${after.status}`,
        `Incident "${after.title}" (${after.incidentId}) moved from "${before.status}" to "${after.status}".`
      );
    }
  }
}

async function publish(subject, message) {
  if (!TOPIC_ARN) return;
  await sns.send(
    new PublishCommand({
      TopicArn: TOPIC_ARN,
      Subject: subject.slice(0, 100),
      Message: message,
    })
  );
}
