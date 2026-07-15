const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { success, failure } = require('../lib/response');

const s3 = new S3Client({});
const BUCKET_NAME = process.env.EVIDENCE_BUCKET;
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const URL_EXPIRY_SECONDS = 300;

exports.handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return failure(400, 'Invalid JSON body');
  }

  const { fileName, contentType } = payload;
  if (!fileName || !contentType) {
    return failure(400, 'fileName and contentType are required');
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return failure(400, `contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}`);
  }

  const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `evidence/${uuidv4()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: URL_EXPIRY_SECONDS });

  return success(200, { uploadUrl, key, expiresIn: URL_EXPIRY_SECONDS });
};
