const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});

// Document client makes it possible to work with plain JS objects instead of
// the low level {"S": "value"} AttributeValue format.
const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.INCIDENTS_TABLE;
const STATUS_INDEX = process.env.STATUS_INDEX_NAME || 'StatusCreatedAtIndex';
const ALL_ITEMS_INDEX = process.env.ALL_ITEMS_INDEX_NAME || 'AllItemsCreatedAtIndex';
const REPORTER_INDEX = process.env.REPORTER_INDEX_NAME || 'ReporterCreatedAtIndex';

module.exports = {
  ddb,
  TABLE_NAME,
  STATUS_INDEX,
  ALL_ITEMS_INDEX,
  REPORTER_INDEX,
};
