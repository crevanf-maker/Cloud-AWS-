const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const cognito = new CognitoIdentityProviderClient({});
const DEFAULT_GROUP = process.env.DEFAULT_USER_GROUP || 'Reporter';

/**
 * Cognito Post Confirmation Lambda trigger.
 * Every newly confirmed user is placed in the "Reporter" group by default;
 * Admins can later move trusted staff into the "Security"/"Admin" groups
 * via the Cognito console or an admin API.
 */
exports.handler = async (event) => {
  try {
    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: event.userPoolId,
        Username: event.userName,
        GroupName: DEFAULT_GROUP,
      })
    );
  } catch (err) {
    console.error('Failed to assign default group to new user', err);
  }

  return event;
};
