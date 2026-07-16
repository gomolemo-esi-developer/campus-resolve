/**
 * Cognito Authentication Controller
 * Handles all AWS Cognito authentication endpoints
 */

// AWS Cognito utilities (local copy for monorepo compatibility)
const CognitoAuthClient = require('../utils/cognito/cognito-client');
const TokenMapper = require('../utils/cognito/token-mapper');
const ErrorHandler = require('../utils/cognito/error-handler');
const preRegistrationService = require('../services/preRegistrationService');
const communicationDataService = require('../services/communicationDataService');

// Portals whose signup must be matched against an admin-created record
const PRE_REGISTERED_PORTALS = ['voice', 'resolve'];

class CognitoAuthController {
  constructor() {
    this.cognito = new CognitoAuthClient();
  }

  /**
   * POST /api/auth/cognito/signup
   * Register a new user with AWS Cognito
   */
  async signup(req, res) {
    try {
      const { email, password, student_number, staff_number, role, portal } = req.body;

      console.log('[Signup] Request body:', JSON.stringify(req.body, null, 2));

      // Validate input
      const validation = ErrorHandler.validateSignupInput({
        email,
        password,
      });

      console.log('[Signup] Validation result:', validation);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Validation failed',
          details: validation.errors,
        });
      }

      // campus-voice/campus-resolve signups must match an admin-created
      // students/staff record before any Cognito account is created.
      let claim = null;

      if (PRE_REGISTERED_PORTALS.includes(portal)) {
        const number = portal === 'voice' ? student_number : staff_number;

        if (!number) {
          return res.status(400).json({
            success: false,
            error: 'ValidationError',
            message: portal === 'voice' ? 'Student number is required' : 'Staff number is required',
          });
        }

        const lookup = await preRegistrationService.findRecord({ email, number, portal });

        if (lookup.status === 'not_found') {
          return res.status(404).json({
            success: false,
            error: 'NoRecordFound',
            message: 'No record found — contact your administrator.',
          });
        }

        if (lookup.status === 'ambiguous') {
          return res.status(409).json({
            success: false,
            error: 'AmbiguousMatch',
            message: 'Multiple records match this email and number — contact your administrator.',
          });
        }

        if (lookup.status === 'already_claimed') {
          return res.status(409).json({
            success: false,
            error: 'AlreadyClaimed',
            message: 'This record has already been registered. Try signing in instead.',
          });
        }

        claim = lookup; // { status: 'matched', record, table, role }
      }

      const derivedRole = claim ? claim.role : role;

      // Prepare custom user attributes for Cognito
      const userAttributes = {};

      if (student_number) {
        userAttributes['custom:student_number'] = student_number;
      }

      if (staff_number) {
        userAttributes['custom:staff_number'] = staff_number;
      }

      if (derivedRole) {
        userAttributes['custom:role'] = derivedRole;
      }

      console.log('[Signup] User attributes being sent to Cognito:', JSON.stringify(userAttributes, null, 2));

      // Call Cognito SignUp API
      const signupResult = await this.cognito.signup(
        email,
        password,
        userAttributes
      );

      // Auto-confirm the user (skip email verification for staff)
      try {
        await this.cognito.adminConfirmSignup(email);
        console.log('[Signup] User auto-confirmed:', email);
      } catch (confirmError) {
        console.warn('[Signup] Auto-confirm failed:', confirmError.message);
        // Don't fail signup if auto-confirm fails
      }

      // Link the new Cognito account to the matched admin-created record,
      // and populate `profiles` with that record's data so the profile page
      // renders real data immediately after first login.
      if (claim) {
        try {
          await preRegistrationService.claimRecord(claim.table, claim.record.id, signupResult.userSub);
          await communicationDataService.createProfileFromClaim({
            cognitoSub: signupResult.userSub,
            role: claim.role,
            email,
            portal,
            record: claim.record,
          });
        } catch (claimError) {
          console.error('[CognitoAuth] Failed to link Cognito account to pre-registered record:', claimError.message);
          // Don't fail the signup response since the Cognito account already exists;
          // the profile will fall back to a blank auto-created row on first login.
        }
      }

      return res.status(201).json({
        success: true,
        userSub: signupResult.userSub,
        codeDeliveryDetails: signupResult.codeDeliveryDetails,
        message: 'Sign-up successful. Please check your email for verification code.',
      });
    } catch (error) {
      ErrorHandler.log(error, 'cognito-signup');
      const status = ErrorHandler.getStatusCode(error);
      const normalized = ErrorHandler.normalize(error);

      return res.status(status).json(normalized);
    }
  }

  /**
   * POST /api/auth/cognito/confirm
   * Confirm user email with verification code
   */
  async confirmSignup(req, res) {
    try {
      const { email, confirmationCode } = req.body;

      if (!email || !confirmationCode) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Email and confirmation code are required',
        });
      }

      // Call Cognito ConfirmSignUp API
      const result = await this.cognito.confirmSignup(email, confirmationCode);

      return res.status(200).json({
        success: true,
        message: 'Email confirmed successfully. You can now sign in.',
      });
    } catch (error) {
      ErrorHandler.log(error, 'cognito-confirm');
      const status = ErrorHandler.getStatusCode(error);
      const normalized = ErrorHandler.normalize(error);

      return res.status(status).json(normalized);
    }
  }

  /**
   * POST /api/auth/cognito/signin
   * Sign in user with email and password
   */
  async signin(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      const validation = ErrorHandler.validateSigninInput({
        email,
        password,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Validation failed',
          details: validation.errors,
        });
      }

      // Call Cognito InitiateAuth API
      const authResult = await this.cognito.signin(email, password);

      // Return normalized response
      const response = TokenMapper.normalizeAuthResponse(authResult);

      // Set secure refresh token cookie (optional, for enhanced security)
      if (authResult.refreshToken) {
        res.cookie('refreshToken', authResult.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }

      return res.status(200).json(response);
    } catch (error) {
      ErrorHandler.log(error, 'cognito-signin');
      const status = ErrorHandler.getStatusCode(error);
      const normalized = ErrorHandler.normalize(error);

      return res.status(status).json(normalized);
    }
  }

  /**
   * POST /api/auth/cognito/refresh
   * Refresh access tokens using refresh token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken: bodyRefreshToken } = req.body;

      // Get refresh token from body, cookie, or request object
      const refreshToken =
        bodyRefreshToken ||
        req.cookies?.refreshToken ||
        req.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'MissingRefreshToken',
          message: 'Refresh token is required',
        });
      }

      // Call Cognito RefreshToken API
      const tokenResult = await this.cognito.refreshTokens(refreshToken);

      // Return normalized response
      const response = TokenMapper.normalizeAuthResponse({
        idToken: tokenResult.idToken,
        accessToken: tokenResult.accessToken,
        refreshToken: refreshToken, // Keep original refresh token
        expiresIn: tokenResult.expiresIn,
      });

      return res.status(200).json(response);
    } catch (error) {
      ErrorHandler.log(error, 'cognito-refresh');
      const status = ErrorHandler.getStatusCode(error);
      const normalized = ErrorHandler.normalize(error);

      return res.status(status).json(normalized);
    }
  }

  /**
   * POST /api/auth/cognito/logout
   * Logout user (client-side token removal)
   */
  async logout(req, res) {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('[CognitoAuth] Logout error:', error);
      return res.status(500).json({
        success: false,
        error: 'LogoutError',
        message: 'Logout failed',
      });
    }
  }

  /**
   * POST /api/auth/cognito/resend-code
   * Resend verification code to email
   */
  async resendConfirmationCode(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Email is required',
        });
      }

      // Call Cognito ResendConfirmationCode API
      const result = await this.cognito.resendConfirmationCode(email);

      return res.status(200).json({
        success: true,
        codeDeliveryDetails: result.codeDeliveryDetails,
        message: 'Verification code resent. Please check your email.',
      });
    } catch (error) {
      ErrorHandler.log(error, 'cognito-resend-code');
      const status = ErrorHandler.getStatusCode(error);
      const normalized = ErrorHandler.normalize(error);

      return res.status(status).json(normalized);
    }
  }
}

module.exports = CognitoAuthController;
