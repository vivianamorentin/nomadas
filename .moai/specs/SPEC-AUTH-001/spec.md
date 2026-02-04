# SPEC-AUTH-001: User Authentication & Onboarding

---

## YAML Frontmatter

```yaml
spec_id: SPEC-AUTH-001
spec_title: User Authentication & Onboarding
version: 1.0
status: Draft
date: 2026-02-03
author: NomadShift Product Team
dependencies:
  - SPEC-INFRA-001
related_specs:
  - SPEC-BIZ-001
  - SPEC-WKR-001
```

---

## Table of Contents

1. [Document Information](#document-information)
2. [History](#history)
3. [Introduction](#introduction)
4. [Requirements](#requirements)
   - [User Registration](#user-registration)
   - [Email Verification](#email-verification)
   - [Role Selection](#role-selection)
   - [Password Management](#password-management)
   - [Authentication Methods](#authentication-methods)
   - [Session Management](#session-management)
   - [Terms and Legal Acceptance](#terms-and-legal-acceptance)
   - [Multi-Language Onboarding](#multi-language-onboarding)
5. [Dependencies](#dependencies)
6. [Glossary](#glossary)

---

## 1. Document Information

| Field | Value |
|-------|-------|
| Specification ID | SPEC-AUTH-001 |
| Specification Title | User Authentication & Onboarding |
| Version | 1.0 |
| Status | Draft |
| Date | February 3, 2026 |
| Author | NomadShift Product Team |
| Requirements Format | EARS (Easy Approach to Requirements Syntax) |
| Parent Specification | NomadShift-SPEC.md |

---

## 2. History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-03 | Product Team | Initial specification creation based on REQ-AUTH-001 to REQ-AUTH-010 |

---

## 3. Introduction

### 3.1 Purpose

This specification defines the complete requirements for the user authentication and onboarding system of the NomadShift platform. It covers user registration, email verification, role selection, authentication methods (email/password and OAuth), session management, and the initial onboarding flow including language selection and Terms of Service acceptance.

### 3.2 Scope

**IN SCOPE:**
- User registration via email and password
- User registration via OAuth providers (Google, Apple)
- Email verification workflow
- User role selection (Business Owner vs Nomad Worker)
- Password reset functionality
- Biometric authentication on mobile devices
- Session management and timeout
- Terms of Service and Privacy Policy acceptance
- Multi-language selection during onboarding
- Role switching between Business Owner and Nomad Worker profiles

**OUT OF SCOPE:**
- Two-factor authentication (2FA) - planned for future version
- Social login via other providers (Facebook, LinkedIn, etc.)
- Identity verification (government ID, passport)
- Background checks
- Phone number verification (SMS-based)
- Enterprise/single sign-on (SSO) integration

### 3.3 User Roles Affected

This specification applies to all primary user roles:
- **Business Owner** (Employer)
- **Nomad Worker** (Worker)
- **Platform Administrator** (System admin)

---

## 4. Requirements

### 4.1 User Registration

#### REQ-AUTH-001: Email/Password Registration

**WHEN** a new user initiates registration,
**THE SYSTEM SHALL** allow the user to register using an email address and a password.

**Requirements:**

1. **WHEN** a user submits registration via email/password,
   **THE SYSTEM SHALL**:
   - Validate that the email address is in a valid format (RFC 5322 compliant)
   - Validate that the password meets minimum security requirements:
     - Minimum 8 characters length
     - Contains at least one uppercase letter (A-Z)
     - Contains at least one lowercase letter (a-z)
     - Contains at least one number (0-9)
     - Contains at least one special character (!@#$%^&*)
   - Check that the email address is not already registered in the system
   - Create a new user account in "unverified" status
   - Generate and send a verification email to the provided email address
   - Store the password hashed using bcrypt (minimum 12 rounds)
   - Return a success response indicating that verification email was sent

2. **WHEN** the email address is already registered,
   **THE SYSTEM SHALL**:
   - Return an error response with HTTP status 409 (Conflict)
   - Display a message: "This email is already registered. Please log in or reset your password."

3. **WHEN** the password does not meet security requirements,
   **THE SYSTEM SHALL**:
   - Return an error response with HTTP status 400 (Bad Request)
   - Display specific messages indicating which password requirements are not met

4. **WHEN** the email format is invalid,
   **THE SYSTEM SHALL**:
   - Return an error response with HTTP status 400 (Bad Request)
   - Display a message: "Please enter a valid email address."

---

#### REQ-AUTH-002: Google OAuth Registration

**WHEN** a new user initiates registration,
**THE SYSTEM SHALL** allow the user to register using Google OAuth 2.0.

**Requirements:**

1. **WHEN** a user selects "Sign up with Google",
   **THE SYSTEM SHALL**:
   - Redirect the user to Google's OAuth 2.0 consent screen
   - Request the following scopes from Google:
     - `openid`: For user identification
     - `email`: For user's email address
     - `profile`: For user's basic profile information (name, profile picture)
   - Use the OAuth 2.0 authorization code flow

2. **WHEN** the user successfully authenticates with Google and grants permission,
   **THE SYSTEM SHALL**:
   - Receive the authorization code from Google
   - Exchange the authorization code for an ID token and access token
   - Validate the ID token signature and expiration
   - Extract the user's email, name, and profile picture from the ID token
   - Check if the email already exists in the system:
     - **IF** the email exists: Log the user in (link Google account to existing user)
     - **IF** the email does not exist: Create a new user account with "verified" status
   - Create or update the user's profile with the information from Google
   - Generate a JWT session token for the user
   - Redirect the user to the role selection screen (for new users) or main dashboard (for existing users)

3. **WHEN** the user denies permission or authentication fails,
   **THE SYSTEM SHALL**:
   - Redirect the user back to the registration/login page
   - Display an error message: "Unable to sign in with Google. Please try again or use email registration."

4. **WHEN** the ID token validation fails,
   **THE SYSTEM SHALL**:
   - Log the error with details for debugging
   - Redirect the user to the registration/login page
   - Display an error message: "Authentication failed. Please try again."

---

#### REQ-AUTH-003: Apple Sign-In Registration

**WHEN** a new user initiates registration,
**THE SYSTEM SHALL** allow the user to register using Apple Sign-In.

**Requirements:**

1. **WHEN** a user selects "Sign up with Apple" on an iOS device,
   **THE SYSTEM SHALL**:
   - Invoke Apple's Sign In with JS framework (for web) or native SDK (for mobile app)
   - Request the following scopes from Apple:
     - `email`: For user's email address
     - `fullName`: For user's first and last name
   - Handle Apple's authentication flow

2. **WHEN** the user successfully authenticates with Apple,
   **THE SYSTEM SHALL**:
   - Receive the authorization code and ID token from Apple
   - Validate the ID token signature and expiration using Apple's public keys
   - Extract the user's email and name from the ID token
   - **IF** the user chose to hide their email (Apple relay email):
     - Use the relay email provided by Apple as the user's email
     - Store the original email (if provided) for future reference
   - Check if the email already exists in the system:
     - **IF** the email exists: Log the user in (link Apple account to existing user)
     - **IF** the email does not exist: Create a new user account with "verified" status
   - Create or update the user's profile with the information from Apple
   - Generate a JWT session token for the user
   - Redirect the user to the role selection screen (for new users) or main dashboard (for existing users)

3. **WHEN** the user cancels the authentication or it fails,
   **THE SYSTEM SHALL**:
   - Return to the registration/login page
   - Display an error message: "Unable to sign in with Apple. Please try again or use email registration."

4. **WHEN** Apple Sign-In is used on a web browser,
   **THE SYSTEM SHALL**:
   - Render the Apple Sign-In button using Apple's JS SDK
   - Support both popup-based and redirect-based authentication flows
   - Handle the callback from Apple's authentication service

---

### 4.2 Email Verification

#### REQ-AUTH-004: Email Verification Workflow

**WHEN** a user registers via email/password,
**THE SYSTEM SHALL** require email verification before account activation.

**Requirements:**

1. **WHEN** a new user account is created via email/password,
   **THE SYSTEM SHALL**:
   - Generate a unique verification token (UUID v4)
   - Store the verification token with an expiration time (24 hours from creation)
   - Store the token in the database, associated with the user account
   - Send a verification email to the user's email address containing:
     - A verification link with the token (e.g., `https://nomadshift.app/verify-email?token=<UUID>`)
     - Instructions to click the link to verify the email
     - Information that the link expires in 24 hours
     - Support contact information if the link doesn't work
   - Set the user account status to "unverified"

2. **WHEN** the user clicks the verification link within 24 hours,
   **THE SYSTEM SHALL**:
   - Validate the verification token:
     - Check if the token exists in the database
     - Check if the token has not expired
     - Check if the token has not already been used
   - **IF** the token is valid:
     - Mark the user account status as "verified"
     - Mark the token as used
     - Log the verification timestamp
     - Send a welcome email to the user
     - Redirect the user to a "Email Verified Successfully" page
     - Allow the user to proceed to the next onboarding step (role selection)
   - **IF** the token is invalid, expired, or already used:
     - Redirect the user to an error page
     - Display an appropriate message:
       - Invalid token: "This verification link is invalid."
       - Expired token: "This verification link has expired. Please request a new verification email."
       - Already used: "This email has already been verified."
     - Provide an option to request a new verification email

3. **WHEN** the user requests a new verification email,
   **THE SYSTEM SHALL**:
   - Check if the user account is still in "unverified" status
   - **IF** the account is unverified:
     - Generate a new verification token
     - Invalidate any previous verification tokens for this user
     - Send a new verification email
     - Display a success message: "A new verification email has been sent. Please check your inbox."
   - **IF** the account is already verified:
     - Display a message: "This email has already been verified. You can now log in."

4. **WHEN** an unverified user attempts to log in,
   **THE SYSTEM SHALL**:
   - Allow the user to authenticate with their credentials
   - Display a message: "Please verify your email address before continuing. We've sent a verification email to [email]."
   - Provide options to:
     - Request a new verification email
     - Change the email address (if the user entered it incorrectly)
   - Restrict access to platform features until email is verified
   - Allow the user to resend the verification email (with rate limiting: max 3 requests per hour)

5. **WHEN** 7 days have passed since registration without email verification,
   **THE SYSTEM SHALL**:
   - Send a reminder email to the user:
     - Subject: "Complete your NomadShift registration"
     - Body: Reminder to verify email to activate the account
     - Include the verification link (generate a new token if previous expired)
   - **IF** no verification after 14 days:
     - Mark the account as "dormant"
     - Stop sending reminder emails
     - **IF** the user later attempts to log in:
       - Prompt to verify email or request new verification link
       - Offer option to delete the unverified account

---

### 4.3 Role Selection

#### REQ-AUTH-005: Role Selection During Registration

**WHEN** a user's email is verified (or immediately after OAuth registration),
**THE SYSTEM SHALL** require the user to select their primary role type: Business Owner OR Nomad Worker.

**Requirements:**

1. **WHEN** a verified user reaches the role selection screen,
   **THE SYSTEM SHALL**:
   - Display a clear, visual role selection interface with two options:
     - **"I'm a Business Owner"** (Employer): For those seeking to hire temporary workers
     - **"I'm a Nomad Worker"** (Worker): For travelers seeking temporary work
   - Provide a brief description for each role:
     - Business Owner: "Post jobs, find staff, and grow your business with flexible temporary workers"
     - Nomad Worker: "Find work opportunities, earn income, and experience local culture while traveling"
   - Display icons or illustrations to visually distinguish the roles
   - Make the selection clear and prominent (large cards or buttons)

2. **WHEN** the user selects "Business Owner",
   **THE SYSTEM SHALL**:
   - Record the user's primary role as "business_owner" in the user profile
   - Redirect the user to the Business Profile creation flow (defined in SPEC-BIZ-001)
   - Update the onboarding progress to track the selected role
   - Store the timestamp of role selection

3. **WHEN** the user selects "Nomad Worker",
   **THE SYSTEM SHALL**:
   - Record the user's primary role as "nomad_worker" in the user profile
   - Redirect the user to the Worker Profile creation flow (defined in SPEC-WKR-001)
   - Update the onboarding progress to track the selected role
   - Store the timestamp of role selection

4. **WHEN** the user indicates they want to be both a Business Owner AND a Nomad Worker,
   **THE SYSTEM SHALL**:
   - Display an option: "I want to do both" (or "Both roles")
   - Allow the user to select one role as their "primary" role
   - Record both roles in the user profile:
     - `primary_role`: business_owner OR nomad_worker
     - `secondary_role`: nomad_worker OR business_owner (if applicable)
   - Redirect the user to create the profile for their primary role first
   - Allow the user to create the secondary role profile later (from settings or dashboard)
   - Display a message: "You can always add your other role profile later from your account settings"

5. **WHEN** the user tries to skip role selection,
   **THE SYSTEM SHALL**:
   - Prevent navigation to other parts of the application
   - Display a message: "Please select a role to continue"
   - Keep the role selection screen visible until a choice is made

---

#### REQ-AUTH-006: Role Switching

**WHEN** a user has both Business Owner and Nomad Worker profiles,
**THE SYSTEM SHALL** allow the user to switch between their roles.

**Requirements:**

1. **WHEN** a user with multiple roles is logged in,
   **THE SYSTEM SHALL**:
   - Display the current active role in the user interface (e.g., in the header, profile menu, or dashboard)
   - Provide a role switcher interface (e.g., a toggle, dropdown, or tabs)
   - Show the name and avatar of the currently active role profile

2. **WHEN** the user requests to switch roles,
   **THE SYSTEM SHALL**:
   - Display a role switcher modal or interface showing the available roles:
     - "Switch to Business Owner profile" (with business name if available)
     - "Switch to Nomad Worker profile" (with worker name)
   - **IF** a secondary role profile has not been created yet:
     - Display an option to "Create [Secondary Role] profile"
     - Indicate that the profile is incomplete
   - Show confirmation of the switch with a preview of the role being activated

3. **WHEN** the user confirms the role switch,
   **THE SYSTEM SHALL**:
   - Update the `active_role` field in the user session
   - Refresh the user interface to reflect the new active role:
     - Update the navigation menu and available features
     - Change the dashboard to the appropriate role's dashboard
     - Update the user profile display
   - Store the timestamp of the role switch
   - Log the role switch for analytics purposes
   - Display a success message: "Switched to [Role] profile"

4. **WHEN** the user switches to the Business Owner role,
   **THE SYSTEM SHALL**:
   - Display the Business Owner dashboard
   - Show business-specific navigation:
     - My Businesses
     - Job Postings
     - Applications
     - Messages
   - Enable business-specific features (posting jobs, reviewing applications, etc.)

5. **WHEN** the user switches to the Nomad Worker role,
   **THE SYSTEM SHALL**:
   - Display the Nomad Worker dashboard
   - Show worker-specific navigation:
     - My Profile
     - Find Jobs
     - My Applications
     - Messages
   - Enable worker-specific features (searching jobs, applying, etc.)

6. **WHEN** the user attempts to switch to a role that doesn't have a completed profile,
   **THE SYSTEM SHALL**:
   - Redirect the user to the profile creation flow for that role
   - Display a message: "Please complete your [Role] profile to switch to this role"
   - Allow the user to cancel and return to their current role

---

### 4.4 Password Management

#### REQ-AUTH-008: Password Reset

**WHEN** a user forgets their password,
**THE SYSTEM SHALL** implement password reset functionality via email.

**Requirements:**

1. **WHEN** a user requests to reset their password,
   **THE SYSTEM SHALL**:
   - Provide a "Forgot Password?" link on the login screen
   - **WHEN** clicked, display a password reset request form:
     - Email address input field
     - "Send Reset Link" button
     - "Back to Login" link
   - Validate that the email address is in a valid format
   - **IF** the email exists in the system:
     - Generate a unique password reset token (UUID v4)
     - Store the token with an expiration time (1 hour from creation)
     - Store the token in the database, associated with the user account
     - Send a password reset email to the user's email address containing:
       - A password reset link with the token (e.g., `https://nomadshift.app/reset-password?token=<UUID>`)
       - Information that the link expires in 1 hour
       - Instructions to ignore the email if they didn't request the reset
       - Warning not to share the reset link with anyone
     - Display a success message: "If an account exists with this email, a password reset link has been sent. Please check your inbox."
   - **IF** the email does not exist in the system:
     - Display the same success message (to prevent email enumeration attacks)
     - NOT send an email
     - Log the attempt for security monitoring

2. **WHEN** the user clicks the password reset link within 1 hour,
   **THE SYSTEM SHALL**:
   - Validate the password reset token:
     - Check if the token exists in the database
     - Check if the token has not expired
     - Check if the token has not already been used
   - **IF** the token is valid:
     - Display a password reset form:
       - New password input field (with password strength indicator)
       - Confirm new password input field
       - "Reset Password" button
       - Password requirements displayed (same as registration)
     - Pre-fill the user's email address (hidden field) to associate the new password
   - **IF** the token is invalid, expired, or already used:
     - Display an error message:
       - Invalid token: "This reset link is invalid. Please request a new password reset."
       - Expired token: "This reset link has expired (valid for 1 hour). Please request a new password reset."
       - Already used: "This reset link has already been used. Please request a new password reset."
     - Provide an option to request a new password reset email

3. **WHEN** the user submits the new password,
   **THE SYSTEM SHALL**:
   - Validate that both password fields match
   - Validate that the new password meets security requirements:
     - Minimum 8 characters length
     - Contains at least one uppercase letter
     - Contains at least one lowercase letter
     - Contains at least one number
     - Contains at least one special character
   - **IF** validation passes:
     - Hash the new password using bcrypt (minimum 12 rounds)
     - Update the user's password hash in the database
     - Mark the password reset token as used
     - Invalidate all existing session tokens for the user (force logout from all devices)
     - Send a password reset confirmation email:
       - Confirm that the password was successfully reset
       - Provide the timestamp of the reset
       - Warn the user to contact support if they didn't initiate the reset
     - Redirect the user to the login screen
     - Display a success message: "Your password has been successfully reset. Please log in with your new password."
   - **IF** validation fails:
     - Display error messages indicating which requirements are not met
     - Keep the user on the password reset form
     - Allow the user to resubmit with a corrected password

4. **WHEN** a password reset is attempted for an OAuth-linked account (no password set),
   **THE SYSTEM SHALL**:
   - Display a message: "This account uses Google/Apple sign-in and doesn't have a password. Please log in using Google/Apple."
   - Provide a button to return to the login screen
   - Not send a password reset email

5. **WHEN** multiple password reset requests are made for the same email in a short period,
   **THE SYSTEM SHALL**:
   - Implement rate limiting: maximum 3 password reset requests per hour per email
   - **IF** the limit is exceeded:
     - Display a message: "Too many password reset attempts. Please wait before trying again. Contact support if you need immediate assistance."
     - Log the excessive attempts for security monitoring

---

### 4.5 Authentication Methods

#### REQ-AUTH-009: Biometric Authentication

**WHEN** a user is on a mobile device (iOS or Android),
**THE SYSTEM SHOULD** support biometric authentication (Face ID, Touch ID, fingerprint).

**Requirements:**

1. **WHEN** a user is using the mobile app on a supported device,
   **THE SYSTEM SHALL**:
   - Detect if the device has biometric authentication capabilities:
     - iOS: Face ID or Touch ID via LocalAuthentication framework
     - Android: Fingerprint via BiometricPrompt API
   - Display a biometric authentication option on the login screen (if the user has previously logged in with email/password)

2. **WHEN** a user has successfully logged in with email/password,
   **THE SYSTEM SHALL**:
   - Prompt the user to enable biometric authentication:
     - Display a message: "Would you like to enable Face ID/Touch ID/Fingerprint for faster login next time?"
     - Provide "Enable" and "Not Now" options
   - **IF** the user enables biometric authentication:
     - Store a biometric authentication token in the device's secure storage:
       - iOS: Keychain
       - Android: Encrypted SharedPreferences or Keystore
     - The token shall contain:
       - User ID
       - Encrypted session credentials
       - Token expiration timestamp
     - Associate the biometric token with the user's account
     - Display a success message: "Biometric authentication enabled. You can now use Face ID/Touch ID/Fingerprint to log in."

3. **WHEN** a user with biometric authentication enabled opens the app,
   **THE SYSTEM SHALL**:
   - Display a biometric authentication prompt:
     - Show the app icon and a message: "Log in to NomadShift"
     - Trigger the biometric authentication dialog (Face ID, Touch ID, or fingerprint prompt)
   - **WHEN** biometric authentication succeeds:
     - Retrieve the stored biometric token from secure storage
     - Validate the token (check expiration, user ID)
     - **IF** the token is valid:
       - Create a new session for the user
       - Redirect the user to the dashboard
       - Display a brief success indicator
     - **IF** the token is invalid or expired:
       - Fall back to the standard login screen (email/password or OAuth)
       - Display a message: "Please log in with your email/password or OAuth"
   - **WHEN** biometric authentication fails or is cancelled:
     - Allow the user to fall back to standard login methods
     - Display the standard login screen with email/password and OAuth options

4. **WHEN** the user wants to disable biometric authentication,
   **THE SYSTEM SHALL**:
   - Provide an option in the app settings:
     - "Biometric Authentication" toggle (ON/OFF)
   - **WHEN** the user disables it:
     - Remove the biometric token from secure storage
     - Display a confirmation message: "Biometric authentication disabled"
   - **IF** the user re-enables it:
     - Prompt for email/password authentication first (for security)
     - Store a new biometric token after successful authentication

5. **WHEN** biometric authentication fails repeatedly (e.g., user's face/fingerprint not recognized),
   **THE SYSTEM SHALL**:
   - Allow the user to fall back to email/password or OAuth login
   - Display a message: "Biometric authentication failed. Please log in with your email/password or use Google/Apple sign-in."
   - Not lock the user out of their account
   - Not trigger account security alerts (unless standard login also fails)

6. **WHEN** the user's device biometric settings change (e.g., fingerprint added/removed),
   **THE SYSTEM SHALL**:
   - Detect the change (via platform APIs)
   - Invalidate the stored biometric token
   - Require the user to re-authenticate with email/password or OAuth
   - Prompt the user to re-enable biometric authentication if desired

---

### 4.6 Session Management

#### REQ-AUTH-010: Session Timeout

**WHEN** a user is authenticated,
**THE SYSTEM SHALL** implement session timeout after 30 days of inactivity.

**Requirements:**

1. **WHEN** a user successfully logs in,
   **THE SYSTEM SHALL**:
   - Generate a JSON Web Token (JWT) containing:
     - User ID
     - User email
     - User role(s)
     - Active role
     - Token issuance timestamp (`iat`)
     - Token expiration timestamp (`exp`) - 30 days from issuance
     - Token unique identifier (`jti`) for revocation
   - Sign the JWT using a secure algorithm (RS256 or ES256)
   - Return the JWT to the client
   - Store the JWT in the client (localStorage for web, secure storage for mobile)

2. **WHEN** a user makes an authenticated request to the API,
   **THE SYSTEM SHALL**:
   - Validate the JWT:
     - Verify the signature using the server's public key
     - Check that the token has not expired (`exp` > current time)
     - Check that the token has not been revoked (check against token blacklist)
     - Verify the user account is active and not suspended
   - **IF** the token is valid:
     - Process the request
     - Optionally update the last activity timestamp for the user
   - **IF** the token is invalid or expired:
     - Return an HTTP 401 (Unauthorized) response
     - Include an error code: `TOKEN_EXPIRED` or `TOKEN_INVALID`
     - Instruct the client to redirect to the login screen

3. **WHEN** a user is actively using the application (making requests),
   **THE SYSTEM SHALL**:
   - NOT automatically extend the session expiration (tokens remain valid for 30 days from issuance)
   - Optionally implement token refresh mechanism:
     - **IF** token refresh is implemented:
       - Provide a refresh endpoint that accepts a valid (but expiring soon) JWT
       - Issue a new JWT with a new expiration timestamp
       - Invalidate the old JWT
       - This allows active users to maintain their session beyond 30 days

4. **WHEN** the JWT expires (30 days after issuance),
   **THE SYSTEM SHALL**:
   - Reject any API requests made with the expired token
   - Return HTTP 401 (Unauthorized) with error code `TOKEN_EXPIRED`
   - The client shall:
     - Clear the stored token from local storage
     - Redirect the user to the login screen
     - Display a message: "Your session has expired. Please log in again."
   - Require the user to re-authenticate (email/password or OAuth)

5. **WHEN** a user logs out explicitly,
   **THE SYSTEM SHALL**:
   - Invalidate the JWT by adding it to a token blacklist (Redis or database)
   - Store the token ID (`jti`) with a timestamp until the token's natural expiration
   - Return a successful logout response to the client
   - The client shall:
     - Clear the stored token from local storage
     - Redirect to the login screen
     - Clear any cached user data

6. **WHEN** a user's account is suspended or deleted,
   **THE SYSTEM SHALL**:
   - Immediately invalidate all active JWT tokens for that user:
     - Add all active token IDs to the token blacklist
     - Or maintain a user-level "suspended" flag checked during token validation
   - Force logout the user from all devices
   - **IF** the user attempts to make a request with a valid token:
     - Return HTTP 403 (Forbidden) with error code `ACCOUNT_SUSPENDED`
     - Display an appropriate message: "Your account has been suspended. Please contact support."

7. **WHEN** the system detects suspicious activity on a user's account,
   **THE SYSTEM SHALL**:
   - Optionally invalidate all active sessions for that user
   - Send a security email to the user:
     - Inform them of the suspicious activity
     - List the location/device of the suspicious login (if available)
     - Provide a link to review recent account activity
     - Advise them to change their password
   - Require re-authentication on next login attempt

8. **WHEN** multiple concurrent sessions are allowed,
   **THE SYSTEM SHALL**:
   - Allow the user to be logged in on multiple devices simultaneously
   - Store each session token independently
   - Provide a "Sessions" or "Active Logins" section in account settings:
     - List all active sessions (device type, location, last activity)
     - Allow the user to selectively revoke sessions
     - Provide a "Sign out from all devices" button

---

### 4.7 Terms and Legal Acceptance

#### REQ-AUTH-007: Terms of Service Acceptance

**WHEN** a user registers a new account,
**THE SYSTEM SHALL** require the user to accept the Terms of Service and Privacy Policy before account creation.

**Requirements:**

1. **WHEN** the user is on the registration screen (email/password or OAuth),
   **THE SYSTEM SHALL**:
   - Display a checkbox with the label:
     - "I agree to the Terms of Service and Privacy Policy"
     - Or two separate checkboxes:
       - "I agree to the Terms of Service"
       - "I agree to the Privacy Policy"
   - Provide clickable links:
     - "Terms of Service" - opens a modal/page with the full ToS document
     - "Privacy Policy" - opens a modal/page with the full Privacy Policy document
   - Make the checkbox(es) mandatory (the submit button is disabled until checked)
   - Display the checkbox(es) prominently before the "Create Account" or "Sign Up" button
   - Use clear, readable text for the checkbox label

2. **WHEN** the user attempts to submit the registration form without accepting the terms,
   **THE SYSTEM SHALL**:
   - Prevent form submission
   - Keep the submit button disabled
   - **IF** the user manages to enable the button (e.g., via browser developer tools):
     - Validate on the server side
     - Return an error response: "You must accept the Terms of Service and Privacy Policy to create an account"
     - Display the error message on the registration form

3. **WHEN** the user checks the checkbox and submits the registration form,
   **THE SYSTEM SHALL**:
   - **ON THE CLIENT SIDE:**
     - Enable the submit button
     - Proceed with form submission
   - **ON THE SERVER SIDE:**
     - Validate that the Terms of Service acceptance checkbox is checked
     - **IF** not checked: Reject the registration with an error
     - **IF** checked:
       - Create the user account
       - Record the Terms of Service acceptance:
         - Store the acceptance timestamp (UTC)
         - Store the IP address of the request
         - Store the version of the Terms of Service accepted
         - Store the user agent (browser/app version)
       - Create an audit log entry for the acceptance
       - Proceed with the registration flow

4. **WHEN** the Terms of Service or Privacy Policy are updated,
   **THE SYSTEM SHALL**:
   - Maintain version history of all legal documents:
     - Each version has a unique version number and effective date
     - Previous versions remain accessible in the database
   - **FOR EXISTING USERS:**
     - On their next login after the update:
       - Display a modal or banner: "Our Terms of Service have been updated. Please review and accept the new terms to continue using the platform."
       - Show the new Terms of Service with changes highlighted
       - Require the user to check "I accept the new Terms of Service"
       - Disable platform access until the new terms are accepted
     - Record the new acceptance:
       - New acceptance timestamp
       - New IP address
       - New version of the terms accepted
     - Allow a grace period (e.g., 30 days) before enforcing acceptance:
       - During the grace period: Show reminder banners but allow access
       - After the grace period: Block access until new terms are accepted
   - **FOR NEW USERS:**
     - Always show and require acceptance of the current version of the terms

5. **WHEN** a user views their account settings,
   **THE SYSTEM SHALL**:
   - Provide a "Legal Agreements" or "Terms & Privacy" section
   - Display:
     - The current version of Terms of Service and the date accepted
     - The current version of Privacy Policy and the date accepted
     - Links to view the full text of both documents
   - Allow the user to download a PDF copy of:
     - The Terms of Service
     - The Privacy Policy
     - Their acceptance history (timestamp, IP, version)

6. **WHEN** a user deletes their account,
   **THE SYSTEM SHALL**:
   - Maintain a record of their ToS and Privacy Policy acceptances for legal retention purposes:
     - Retain the acceptance record for a minimum period (e.g., 7 years) as required by law
     - Disassociate the acceptance from active user data after account deletion
     - Archive the acceptance data in a compliance database
   - NOT allow deleted users to claim they never accepted the terms

---

### 4.8 Multi-Language Onboarding

#### REQ-LANG-003: Language Selection During Onboarding

**WHEN** a new user starts the onboarding process,
**THE SYSTEM SHALL** allow the user to select their preferred language.

**Requirements:**

1. **WHEN** a user first accesses the NomadShift app or website (before registration),
   **THE SYSTEM SHALL**:
   - Automatically detect the user's browser or device language setting:
     - For web: Read `navigator.language` or `Accept-Language` header
     - For mobile: Read the device's locale setting
   - **IF** the detected language is supported (English or Spanish in v1.0):
     - Automatically set the app language to match the user's preference
     - Display a banner: "We've set the language to [Language]. Change in settings."
   - **IF** the detected language is NOT supported:
     - Default to English
     - Display a language selection modal: "Select your preferred language / Seleccione su idioma preferido"
   - Store the selected language in a cookie/localStorage for anonymous users

2. **WHEN** the user reaches the registration screen,
   **THE SYSTEM SHALL**:
   - Display the registration form in the user's selected language
   - Show all labels, placeholders, error messages, and help text in that language
   - Maintain the language selection throughout the registration process

3. **WHEN** the user creates an account,
   **THE SYSTEM SHALL**:
   - Store the user's preferred language in their profile:
     - Field: `preferred_language`
     - Values: `en`, `es` (for v1.0)
     - Default: `en`
   - Use this stored preference for all future sessions
   - Display the entire app interface in the user's preferred language

4. **WHEN** a user wants to change their language preference,
   **THE SYSTEM SHALL**:
   - Provide a language selector in:
     - The settings/profile menu (accessible from any screen)
     - The onboarding flow (if the user wants to change it initially)
   - Display the language options as:
     - Language names in their native script (e.g., "English", "Español")
     - Or flags/icons with language names
   - **WHEN** the user selects a different language:
     - Immediately update the UI to reflect the new language (no app restart required)
     - Store the new preference in the user's profile
     - Confirm the change with a toast message: "Language changed to [Language] / Idioma cambiado a [Idioma]"
     - Allow the user to switch back at any time

5. **WHEN** the user's browser/device language differs from their stored preference,
   **THE SYSTEM SHALL**:
   - Respect the stored preference (don't auto-change based on browser/device)
   - Optionally display a one-time prompt: "Your browser is set to [Browser Language], but your NomadShift language is [App Language]. Would you like to switch?"
   - Allow the user to dismiss the prompt and keep their current preference

6. **WHEN** displaying language names or labels,
   **THE SYSTEM SHALL**:
   - Show language names in their native form:
     - English for English
     - Español for Spanish
     - Français for French (future)
     - Português for Portuguese (future)
   - NOT display language names translated into another language (e.g., show "Español", not "Spanish (Español)")

7. **WHEN** the user's selected language is not available for certain content,
   **THE SYSTEM SHALL**:
   - Display a fallback language indicator:
     - For example: "[Content in English]" or "Este contenido está disponible solo en inglés"
   - Attempt to translate user-generated content (e.g., job descriptions) if possible (using machine translation)
   - Clearly indicate when content is auto-translated

---

## 5. Dependencies

This specification depends on the following:

### 5.1 Dependent Specifications

- **SPEC-INFRA-001**: Infrastructure Setup
  - Database for user accounts and authentication tokens
  - Redis for token blacklisting and session management
  - Email service provider for transactional emails (verification, password reset)
  - Secure key storage for JWT signing

- **SPEC-BIZ-001**: Business Profile Management
  - Depends on successful user authentication and Business Owner role selection
  - Requires user ID from authentication to link business profiles

- **SPEC-WKR-001**: Worker Profile Management
  - Depends on successful user authentication and Nomad Worker role selection
  - Requires user ID from authentication to link worker profiles

### 5.2 External Dependencies

- **Google OAuth 2.0 API**
  - For Google Sign-In integration
  - Requires Google Cloud project with OAuth 2.0 credentials

- **Apple Sign-In API**
  - For Apple Sign-In integration
  - Requires Apple Developer account and Sign In with Apple service enabled

- **Email Service Provider** (SendGrid, AWS SES, Mailgun, or similar)
  - For sending verification emails
  - For sending password reset emails
  - For sending welcome emails
  - For sending ToS update notifications

- **JWT Library** (jsonwebtoken, jose, or similar)
  - For generating and validating JSON Web Tokens
  - For secure session management

- **bcrypt Library**
  - For hashing passwords securely
  - Minimum 12 rounds as per security requirements

### 5.3 Technical Constraints

- **Password Hashing**: Must use bcrypt with minimum 12 rounds (per REQ-NFR-SEC-002)
- **JWT Algorithm**: Must use RS256 or ES256 (asymmetric encryption)
- **Token Storage**: Must use secure storage on client devices (Keychain for iOS, Encrypted SharedPreferences for Android)
- **TLS**: All authentication endpoints must use HTTPS (TLS 1.3+ per REQ-NFR-SEC-001)
- **Rate Limiting**: Authentication endpoints must implement rate limiting (per REQ-NFR-SEC-003)

---

## 6. Glossary

| Term | Definition |
|------|------------|
| **Authentication** | The process of verifying the identity of a user or system |
| **Authorization** | The process of determining what permissions an authenticated user has |
| **Biometric Authentication** | Authentication using biological characteristics (fingerprint, face recognition) |
| **bcrypt** | A password hashing function designed to be slow and resistant to brute-force attacks |
| **Email Verification** | The process of confirming that a user owns the email address they provided |
| **JWT (JSON Web Token)** | A compact, URL-safe means of representing claims to be transferred between two parties |
| **OAuth 2.0** | An open standard for access delegation, commonly used for "Sign in with Google/Apple" |
| **Onboarding** | The process of guiding a new user through initial setup and profile creation |
| **Role** | The type of user account (Business Owner or Nomad Worker) determining their permissions and interface |
| **Role Switching** | The ability for users with multiple roles to change their active role |
| **Session** | A period of interaction between a user and the system, typically maintained via a token |
| **Session Timeout** | The automatic termination of a user session after a period of inactivity |
| **ToS (Terms of Service)** | The legal agreement between the user and the platform outlining terms of use |
| **UUID v4** | A universally unique identifier generated using random numbers |
| **Verification Token** | A unique, time-limited code sent to a user to verify their email address or reset their password |

---

## 7. Appendices

### Appendix A: Authentication Flow Diagrams

#### A.1 Email/Password Registration Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      EMAIL/PASSWORD REGISTRATION                  │
└──────────────────────────────────────────────────────────────────┘

User                            System
  │                               │
  │  ┌─────────────────────┐     │
  │  │ 1. Enter email &    │     │
  │  │    password         │     │
  │  └──────────┬──────────┘     │
  │             │                 │
  ├─────────────┼─────────────────┤
  │             │                 │
  │             │  ◄─── Validate email & password
  │             │                 │
  │             │  ──► Email valid & unique?
  │             │                 │
  │             │         YES     │
  │             │  ◄─── Hash password (bcrypt)
  │             │                 │
  │             │  ──► Create user account (unverified)
  │             │                 │
  │             │  ──► Generate verification token (UUID, 24hr expiry)
  │             │                 │
  │             │  ──► Send verification email
  │             │                 │
  │  ◄─── "Check your email to verify your account"
  │                               │
  │  ┌─────────────────────┐     │
  │  │ 2. Click email link │     │
  │  └──────────┬──────────┘     │
  │             │                 │
  ├─────────────┼─────────────────┤
  │             │                 │
  │             │  ◄─── Validate token
  │             │                 │
  │             │  ──► Mark user as verified
  │             │                 │
  │             │  ──► Send welcome email
  │             │                 │
  │  ◄─── Redirect to role selection
  │                               │
  │  ┌─────────────────────┐     │
  │  │ 3. Select role      │     │
  │  └──────────┬──────────┘     │
  │             │                 │
  ├─────────────┼─────────────────┤
  │             │                 │
  │             │  ◄─── Store role selection
  │             │                 │
  │  ◄─── Redirect to profile creation
  │                               │
```

#### A.2 OAuth Registration Flow (Google/Apple)

```
┌──────────────────────────────────────────────────────────────────┐
│                     OAUTH REGISTRATION (GOOGLE/APPLE)            │
└──────────────────────────────────────────────────────────────────┘

User                OAuth Provider         System
  │                      │                   │
  │  ┌───────────────┐   │                   │
  │  │ Click "Sign   │   │                   │
  │  │ up with       │   │                   │
  │  │ Google/Apple" │   │                   │
  │  └───────┬───────┘   │                   │
  │          │           │                   │
  ├──────────┼───────────┼───────────────────┤
  │          │           │                   │
  │          │  ◄────────┼─────── Redirect to OAuth provider
  │          │           │                   │
  │          │  ────────►│       Show consent screen
  │          │           │                   │
  │          │  ┌─────┐  │                   │
  │          │  │User │  │                   │
  │          │  │authenticates & grants permission
  │          │  └──┬──┘  │                   │
  │          │     │      │                   │
  │          │  ───►      │                   │
  │          │     │      │  ◄─── Receive authorization code
  │          │     │      │                   │
  │          │     │      │  ──► Exchange code for ID token
  │          │     │      │                   │
  │          │  ◄──      │  ──► Validate ID token
  │          │           │                   │
  │          │           │  ──► Extract email, name, photo
  │          │           │                   │
  │          │           │  ──► Email already exists?
  │          │           │                   │
  │          │           │       NO          │
  │          │           │  ──► Create user account (verified)
  │          │           │                   │
  │          │           │  ──► Generate JWT
  │          │           │                   │
  │  ◄──────┴───────────┴─────── Redirect to role selection
  │                               │
```

### Appendix B: Security Considerations

#### B.1 Password Security

- **Minimum Requirements**: 8 characters, uppercase, lowercase, number, special character
- **Hashing Algorithm**: bcrypt with minimum 12 rounds
- **Password Storage**: Never store plaintext passwords; only store hashed passwords
- **Password Reset**: Tokens expire after 1 hour; single-use only
- **Password History**: Not implemented in v1.0 (future enhancement)

#### B.2 Token Security

- **JWT Algorithm**: RS256 (asymmetric) using public/private key pair
- **Token Expiration**: 30 days from issuance
- **Token Storage**: Secure storage on client (Keychain, Encrypted SharedPreferences)
- **Token Revocation**: Token blacklist on logout; user-level suspension flag
- **Token Refresh**: Optional; if implemented, requires re-authentication after expiration

#### B.3 OAuth Security

- **Authorization Code Flow**: Always use server-side code flow (not implicit flow)
- **State Parameter**: Use state parameter to prevent CSRF attacks
- **Token Validation**: Always validate ID token signature and expiration
- **Scope Limitation**: Request only necessary scopes (openid, email, profile)
- **PKCE**: Consider using PKCE (Proof Key for Code Exchange) for mobile apps

#### B.4 Rate Limiting

- **Registration Endpoint**: Max 5 attempts per IP per 15 minutes
- **Login Endpoint**: Max 10 attempts per IP per 15 minutes
- **Password Reset**: Max 3 requests per email per hour
- **Email Verification**: Max 3 resend requests per email per hour
- **OAuth Endpoints**: Standard rate limits per OAuth provider

#### B.5 Email Security

- **Verification Links**: One-time use, expire after 24 hours
- **Reset Links**: One-time use, expire after 1 hour
- **Email Enumeration**: Use generic success messages to prevent email enumeration
- **Link Security**: Always use HTTPS links; include token validation

#### B.6 Biometric Security

- **Local Storage**: Biometric tokens stored in device secure storage (Keychain, Keystore)
- **No Remote Storage**: Biometric data never sent to servers
- **Fallback Required**: Always provide fallback to password/OAuth if biometric fails
- **Re-authentication**: Require password/OAuth if biometric settings change

#### B.7 Session Security

- **Session Timeout**: 30 days of inactivity
- **Concurrent Sessions**: Allow multiple devices; provide session management UI
- **Suspicious Activity**: Invalidate all sessions on detection
- **Logout**: Invalidate token on explicit logout; clear from client storage

---

**End of SPEC-AUTH-001**
