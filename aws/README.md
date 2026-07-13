# AWS Microservices

This folder contains all AWS-related infrastructure and utilities for the Complaint App.

## Folder Structure

```
aws/
├── infrastructure/          # Serverless Framework configurations
│   ├── serverless.yaml      # CloudFormation + Cognito User Pool definition
│   ├── .env.dev             # Development environment variables
│   ├── .env.prod            # Production environment variables
│   └── package.json         # Infrastructure dependencies
│
└── cognito/                 # AWS Lambda functions and utilities
    ├── lib/
    │   ├── cognito-client.js    # AWS SDK Cognito client wrapper
    │   ├── token-mapper.js       # JWT decoding and mapping utilities
    │   └── error-handler.js      # Cognito error normalization
    ├── functions/               # Lambda trigger functions (future)
    │   ├── pre-signup.js
    │   ├── post-confirmation.js
    │   └── custom-message.js
    └── package.json             # Lambda dependencies
```

## Quick Start

### Deploy Cognito Infrastructure

```bash
cd infrastructure
npm install
npm run deploy:dev
```

### Install Lambda Dependencies

```bash
cd cognito
npm install
```

## Environment Variables

### Development (`infrastructure/.env.dev`)
- `AWS_REGION=us-east-2`
- `AWS_PROFILE=default`
- `COGNITO_USER_POOL_NAME=complaint-app-user-pool-dev`
- `STAGE=dev`

### Production (`infrastructure/.env.prod`)
- `AWS_REGION=us-east-2`
- `AWS_PROFILE=default`
- `COGNITO_USER_POOL_NAME=complaint-app-user-pool-prod`
- `STAGE=prod`

## Components

### 1. Infrastructure (`infrastructure/serverless.yaml`)

Defines AWS Cognito User Pool with:
- User attributes (email, name, student_number, staff_number, role)
- App Client configuration (auth flows, token validity)
- Password policies
- Email configuration
- Auto-verification for development

**Deploy:**
```bash
npm run deploy:dev      # Deploy to dev
npm run deploy:prod     # Deploy to prod
```

**Remove:**
```bash
npm run remove:dev      # Remove dev stack
npm run remove:prod     # Remove prod stack
```

### 2. Cognito Client Library (`cognito/lib/cognito-client.js`)

AWS SDK wrapper providing methods:
- `signup(email, password, attributes)` - Register new user
- `signin(email, password)` - Authenticate user
- `confirmSignup(email, code)` - Verify email
- `refreshTokens(refreshToken)` - Refresh tokens
- `resendConfirmationCode(email)` - Resend verification code
- `adminConfirmSignup(email)` - Admin confirm user
- `getUserInfo(accessToken)` - Get user attributes
- `adminUpdateUserAttributes(email, attrs)` - Update user

**Usage in Backend:**
```javascript
const CognitoAuthClient = require('aws-cognito/lib/cognito-client');
const cognito = new CognitoAuthClient();

const result = await cognito.signin(email, password);
console.log(result.idToken);        // ID token (user identity)
console.log(result.accessToken);    // Access token (authorization)
console.log(result.refreshToken);   // Refresh token (long-lived)
```

### 3. Token Mapper (`cognito/lib/token-mapper.js`)

Utilities for JWT handling:
- `decodeToken(token)` - Decode JWT (client-safe)
- `mapIdTokenToUser(idToken)` - Extract user object from token
- `mapAccessTokenToAuthz(accessToken)` - Extract authorization info
- `isTokenExpired(token)` - Check expiry
- `getTimeUntilExpiry(token)` - Get remaining time
- `normalizeAuthResponse(response)` - Standard response format
- `normalizeErrorResponse(error)` - Standard error format

**Usage:**
```javascript
const TokenMapper = require('aws-cognito/lib/token-mapper');

const user = TokenMapper.mapIdTokenToUser(idToken);
console.log(user.id);           // Cognito sub
console.log(user.firstName);    // given_name
console.log(user.studentNumber); // custom:student_number
```

### 4. Error Handler (`cognito/lib/error-handler.js`)

Standardizes Cognito errors:
- `normalize(error)` - Convert to standard format
- `getStatusCode(error)` - Get HTTP status code
- `log(error, context)` - Log with context
- `validateSignupInput(data)` - Validate signup fields
- `validateSigninInput(data)` - Validate signin fields

**Usage:**
```javascript
const ErrorHandler = require('aws-cognito/lib/error-handler');

try {
  await cognito.signin(email, password);
} catch (error) {
  const status = ErrorHandler.getStatusCode(error);  // 401
  const response = ErrorHandler.normalize(error);     // Formatted error
  ErrorHandler.log(error, 'signin');                  // Log
  res.status(status).json(response);
}
```

## Integration with Proxy Server

The Cognito libraries are used by the proxy server backend:

**Location:** `packages/proxy-server/src/controllers/cognitoAuthController.js`

**Routes:** `packages/proxy-server/src/routes/cognitoAuth.js`

**Endpoints:**
- `POST /api/auth/cognito/signup` - Register user
- `POST /api/auth/cognito/signin` - Authenticate
- `POST /api/auth/cognito/confirm` - Confirm email
- `POST /api/auth/cognito/refresh` - Refresh tokens
- `POST /api/auth/cognito/resend-code` - Resend code
- `POST /api/auth/cognito/logout` - Sign out

## Lambda Functions (Future)

### Pre-Sign-Up Trigger
Auto-confirms user email in development:
```javascript
// functions/pre-signup.js
exports.handler = async (event) => {
  event.response.autoConfirmUser = true;
  event.response.autoVerifiedAttributes = ['email'];
  return event;
};
```

### Post-Confirmation Trigger
Set up user after email verification:
```javascript
// functions/post-confirmation.js
exports.handler = async (event) => {
  // Custom user setup logic
  return event;
};
```

### Custom Message Trigger
Send branded emails:
```javascript
// functions/custom-message.js
exports.handler = async (event) => {
  // Custom email templates
  return event;
};
```

## Deployment Workflow

### Development
```bash
# 1. Deploy infrastructure
cd aws/infrastructure
npm install
npm run deploy:dev

# 2. Copy output values
# Note the User Pool ID and Client ID

# 3. Update proxy-server .env.local
# COGNITO_USER_POOL_ID=...
# COGNITO_CLIENT_ID=...

# 4. Start backend
cd packages/proxy-server
npm run dev:backend

# 5. Test endpoints
curl -X POST http://localhost:8080/api/auth/cognito/signup ...
```

### Production
```bash
# 1. Deploy infrastructure to prod
cd aws/infrastructure
npm run deploy:prod

# 2. Configure custom domain (if needed)
# 3. Update frontend environment variables
# 4. Deploy frontend
# 5. Monitor logs and metrics
```

## Monitoring & Logs

### View Deployment Status
```bash
npm run info:dev     # Dev stack info
npm run info:prod    # Prod stack info
```

### View Logs
```bash
npm run logs:dev --filter pattern  # Dev logs with filter
npm run logs:prod                  # Prod logs
```

### CloudWatch Dashboard (AWS Console)
- Cognito sign-in/sign-up metrics
- Lambda function execution times
- Error rates and failures

## Security

- **Passwords:** Hashed by AWS Cognito (bcrypt-like)
- **Tokens:** JWT signed by Cognito (RS256)
- **HTTPS:** Required in production
- **Rate Limiting:** Applied at proxy-server layer
- **CORS:** Restricted to known origins
- **Refresh Tokens:** Can be stored in httpOnly cookies

## Troubleshooting

**Deployment fails:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check region
aws configure get region

# Verbose logging
serverless deploy:dev --verbose
```

**User can't sign in:**
- Verify user is confirmed (check Cognito console)
- Check password requirements
- Review error message and logs

**Tokens invalid:**
- Verify User Pool ID matches
- Check token expiry time
- Refresh token if expired

## Documentation

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Serverless Framework](https://www.serverless.com/)
- [Integration Plan](../AWS_COGNITO_INTEGRATION_PLAN.md)
- [Setup Instructions](../AWS_COGNITO_SETUP.md)

---

**Created:** March 11, 2026  
**Status:** Implementation in progress
