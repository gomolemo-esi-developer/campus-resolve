/**
 * Cognito Error Handler
 * Normalizes AWS Cognito errors to consistent format
 */

class CognitoErrorHandler {
  /**
   * Normalize Cognito error to HTTP response
   * @param {Error} error - AWS SDK error or custom error
   * @returns {Object} Normalized error response
   */
  static normalize(error) {
    const errorResponse = {
      success: false,
      error: error.code || error.name || 'UnknownError',
      message: this._getUserMessage(error),
    };

    // Add details if available
    if (error.details) {
      errorResponse.details = error.details;
    }

    return errorResponse;
  }

  /**
   * Get HTTP status code from error
   * @param {Error} error - Error object
   * @returns {number} HTTP status code
   */
  static getStatusCode(error) {
    const codeToStatus = {
      // 400 Bad Request
      InvalidParameterException: 400,
      InvalidPasswordException: 400,
      CodeMismatchException: 400,
      ExpiredCodeException: 400,
      InvalidClientIdException: 400,
      ValidationError: 400,

      // 401 Unauthorized
      NotAuthorizedException: 401,
      UserNotFoundException: 401,
      UserNotConfirmedException: 401,
      InvalidClientException: 401,

      // 403 Forbidden
      UserDisabledException: 403,
      UserLambdaValidationException: 403,

      // 404 Not Found
      ResourceNotFoundException: 404,

      // 409 Conflict
      UsernameExistsException: 409,
      AliasExistsException: 409,

      // 429 Too Many Requests
      TooManyRequestsException: 429,
      LimitExceededException: 429,
      TooManyAttemptsException: 429,

      // 500 Internal Server Error
      InternalErrorException: 500,
      ServiceUnavailableException: 503,
    };

    return codeToStatus[error.code || error.name] || 500;
  }

  /**
   * Get user-friendly error message
   * @private
   * @param {Error} error - Error object
   * @returns {string} User-friendly message
   */
  static _getUserMessage(error) {
    const messageMap = {
      UsernameExistsException: 'Email already registered. Please sign in or use a different email.',
      UserNotFoundException: 'Email or password is incorrect.',
      NotAuthorizedException: 'Email or password is incorrect.',
      UserNotConfirmedException: 'Your account is not yet confirmed. Please check your email for verification code.',
      UserDisabledException: 'Your account has been disabled. Please contact support.',
      InvalidPasswordException: 'Password must contain uppercase, lowercase, numbers, and be at least 8 characters.',
      CodeMismatchException: 'The verification code is incorrect.',
      ExpiredCodeException: 'The verification code has expired. Please request a new code.',
      InvalidParameterException: 'Invalid input. Please check your information and try again.',
      TooManyRequestsException: 'Too many attempts. Please try again later.',
      LimitExceededException: 'Too many requests. Please try again in a moment.',
      TooManyAttemptsException: 'Too many failed attempts. Please try again later.',
      InternalErrorException: 'An error occurred. Please try again later.',
      ServiceUnavailableException: 'Service is temporarily unavailable. Please try again later.',
      TokenRefreshException: 'Session expired. Please sign in again.',
      AliasExistsException: 'This email is already associated with another account.',
      ValidationError: 'Invalid input. Please check your information.',
    };

    return messageMap[error.code || error.name] || error.message || 'An unexpected error occurred.';
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} True if error is retryable
   */
  static isRetryable(error) {
    const retryableErrors = [
      'TooManyRequestsException',
      'LimitExceededException',
      'ServiceUnavailableException',
      'RequestTimeout',
      'NetworkError',
    ];

    return retryableErrors.includes(error.code || error.name);
  }

  /**
   * Log error for debugging
   * @param {Error} error - Error object
   * @param {string} context - Error context (e.g., 'signup', 'signin')
   */
  static log(error, context = 'unknown') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      error: error.code || error.name,
      message: error.message,
      retryable: this.isRetryable(error),
    };

    // Log full error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[CognitoError]', logEntry);
      if (error.originalError) {
        console.error('[CognitoError:Original]', error.originalError);
      }
    } else {
      // Log sanitized error in production
      console.error('[CognitoError]', {
        timestamp: logEntry.timestamp,
        context: logEntry.context,
        error: logEntry.error,
      });
    }
  }

  /**
   * Validate signup input
   * @param {Object} data - Signup form data
   * @returns {Object} Validation result with errors array
   */
  static validateSignupInput(data) {
    const errors = [];

    // Email validation
    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required');
    } else if (!this._isValidEmail(data.email)) {
      errors.push('Email format is invalid');
    }

    // Password validation
    if (!data.password || typeof data.password !== 'string') {
      errors.push('Password is required');
    } else if (data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    } else if (!this._isValidPassword(data.password)) {
      errors.push('Password must contain uppercase, lowercase, and numbers');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate signin input
   * @param {Object} data - Signin form data
   * @returns {Object} Validation result with errors array
   */
  static validateSigninInput(data) {
    const errors = [];

    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required');
    } else if (!this._isValidEmail(data.email)) {
      errors.push('Email format is invalid');
    }

    if (!data.password || typeof data.password !== 'string') {
      errors.push('Password is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   * @private
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   */
  static _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @private
   * @param {string} password - Password to validate
   * @returns {boolean} True if meets requirements
   */
  static _isValidPassword(password) {
    // Must contain: uppercase, lowercase, number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasUppercase && hasLowercase && hasNumber;
  }
}

module.exports = CognitoErrorHandler;
