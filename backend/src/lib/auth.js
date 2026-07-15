const ADMIN_GROUP = 'Admin';
const SECURITY_GROUP = 'Security';
const REPORTER_GROUP = 'Reporter';

/**
 * Extracts the authenticated user's identity and role information from the
 * API Gateway REST API Cognito User Pool authorizer claims.
 */
function getUserContext(event) {
  const claims =
    (event.requestContext &&
      event.requestContext.authorizer &&
      event.requestContext.authorizer.claims) ||
    {};

  const rawGroups = claims['cognito:groups'] || '';
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : String(rawGroups)
        .replace(/[[\]]/g, '')
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);

  return {
    sub: claims.sub,
    email: claims.email,
    name: claims.name || claims.email,
    groups,
    isAdmin: groups.includes(ADMIN_GROUP),
    isSecurity: groups.includes(SECURITY_GROUP) || groups.includes(ADMIN_GROUP),
  };
}

module.exports = {
  getUserContext,
  ADMIN_GROUP,
  SECURITY_GROUP,
  REPORTER_GROUP,
};
