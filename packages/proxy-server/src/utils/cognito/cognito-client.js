/**
 * AWS Cognito Client Wrapper
 * Handles all AWS Cognito Identity Provider API calls
 */

const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminInitiateAuthCommand,
  ConfirmSignUpCommand,
  AdminConfirmSignUpCommand,
  InitiateAuthCommand,
  GetUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  ResendConfirmationCodeCommand,
  GlobalSignOutCommand,
  ChangePasswordCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

class CognitoAuthClient {
  constructor(config = {}) {
    this.region = config.region || process.env.COGNITO_REGION || 'us-east-2';
    this.userPoolId = config.userPoolId || process.env.COGNITO_USER_POOL_ID;
    this.clientId = config.clientId || process.env.COGNITO_CLIENT_ID;

    if (!this.userPoolId || !this.clientId) {
      throw new Error(
        'Missing COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID environment variables'
      );
    }

    this.client = new CognitoIdentityProviderClient({ region: this.region });
  }

  /**
   * Sign up a new user (unauthenticated endpoint)
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} userAttributes - Additional user attributes
   * @returns {Promise<Object>} User Sub and code delivery details
   */
  async signup(email, password, userAttributes = {}) {
    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          ...Object.entries(userAttributes).map(([key, value]) => ({
            Name: key,
            Value: String(value),
          })),
        ],
      });

      const response = await this.client.send(command);

      return {
        success: true,
        userSub: response.UserSub,
        codeDeliveryDetails: response.CodeDeliveryDetails,
      };
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Confirm user sign-up (verify email code)
   * @param {string} email - User email
   * @param {string} confirmationCode - Confirmation code from email
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmSignup(email, confirmationCode) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
      });

      await this.client.send(command);

      return { success: true, message: 'Email confirmed successfully' };
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Admin confirm user sign-up (no verification code required)
   * @param {string} email - User email
   * @returns {Promise<Object>} Confirmation result
   */
  async adminConfirmSignup(email) {
    try {
      const command = new AdminConfirmSignUpCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      });

      await this.client.send(command);

      return { success: true, message: 'User confirmed successfully' };
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Initiate authentication (sign-in)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Tokens (idToken, accessToken, refreshToken)
   */
  async signin(email, password) {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed: No tokens returned');
      }

      return {
        success: true,
        idToken: response.AuthenticationResult.IdToken,
        accessToken: response.AuthenticationResult.AccessToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
      };
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Refresh tokens using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshTokens(refreshToken) {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Token refresh failed: No tokens returned');
      }

      return {
        success: true,
        idToken: response.AuthenticationResult.IdToken,
        accessToken: response.AuthenticationResult.AccessToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
      };
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Get user information using access token
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} User attributes
   */
  async getUserInfo(accessToken) {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.client.send(command);

      // Convert attribute array to object
      const attributes = {};
      (response.UserAttributes || []).forEach((attr) => {
        attributes[attr.Name] = attr.Value;
      });

      return {
        success: true,
        username: response.Username,
        userStatus: response.UserStatus,
        mfaOptions: response.MFAOptions || [],
        attributes,
      };
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Get user information using admin access
   * @param {string} email - User email
   * @returns {Promise<Object>} User attributes
   */
  async adminGetUser(email) {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      });

      const response = await this.client.send(command);

      // Convert attribute array to object
      const attributes = {};
      (response.UserAttributes || []).forEach((attr) => {
        attributes[attr.Name] = attr.Value;
      });

      return {
        success: true,
        username: response.Username,
        userStatus: response.UserStatus,
        attributes,
      };
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Admin confirm user (auto-verify user without code)
   * @param {string} email - User email
   * @returns {Promise<Object>} Confirmation result
   */
  async adminConfirmSignup(email) {
    try {
      const command = new AdminConfirmSignUpCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      });

      await this.client.send(command);

      return { success: true, message: 'User confirmed successfully' };
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Resend confirmation code
   * @param {string} email - User email
   * @returns {Promise<Object>} Code delivery details
   */
  async resendConfirmationCode(email) {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: email,
      });

      const response = await this.client.send(command);

      return {
        success: true,
        codeDeliveryDetails: response.CodeDeliveryDetails,
      };
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Update user attributes (admin)
   * @param {string} email - User email
   * @param {Object} attributes - Attributes to update
   * @returns {Promise<Object>} Update result
   */
  async adminUpdateUserAttributes(email, attributes) {
    try {
      const userAttributes = Object.entries(attributes).map(([key, value]) => ({
        Name: key,
        Value: String(value),
      }));

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: userAttributes,
      });

      await this.client.send(command);

      return { success: true, message: 'User attributes updated' };
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Normalize Cognito errors to consistent format
   * @private
   * @param {Error} error - AWS SDK error
   * @returns {Error} Normalized error
   */
  _normalizeError(error) {
    const normalizedError = new Error(error.message);
    normalizedError.code = error.__type || error.name;

    // Map Cognito error codes to user-friendly messages
    const errorMessages = {
      UsernameExistsException: 'Email already registered',
      InvalidPasswordException: 'Password does not meet requirements',
      UserNotConfirmedException: 'User is not confirmed',
      UserNotFoundException: 'User does not exist',
      NotAuthorizedException: 'Invalid credentials',
      UserDisabledException: 'Account is disabled',
      InvalidParameterException: 'Invalid parameter',
      CodeMismatchException: 'Invalid confirmation code',
      ExpiredCodeException: 'Confirmation code has expired',
      LimitExceededException: 'Too many attempts, try again later',
      TokenRefreshException: 'Unable to refresh token',
    };

    normalizedError.userMessage = errorMessages[error.__type] || error.message;
    normalizedError.originalError = error;

    return normalizedError;
  }
}

module.exports = CognitoAuthClient;
