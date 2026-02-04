# SPEC-AUTH-001: Acceptance Criteria

**Specification ID:** SPEC-AUTH-001
**Specification Title:** User Authentication & Onboarding
**Version:** 1.0
**Date:** 2026-02-03
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Registration Flow Scenarios](#registration-flow-scenarios)
3. [Login Scenarios](#login-scenarios)
4. [OAuth Integration Scenarios](#oauth-integration-scenarios)
5. [Password Reset Scenarios](#password-reset-scenarios)
6. [Role Selection and Switching Scenarios](#role-selection-and-switching-scenarios)
7. [Biometric Authentication Scenarios](#biometric-authentication-scenarios)
8. [Session Management Scenarios](#session-management-scenarios)
9. [Terms of Service Scenarios](#terms-of-service-scenarios)
10. [Multi-Language Scenarios](#multi-language-scenarios)
11. [Security Test Scenarios](#security-test-scenarios)
12. [Quality Gate Criteria](#quality-gate-criteria)

---

## 1. Overview

This document defines the acceptance criteria for the User Authentication & Onboarding system. Each scenario represents a real-world use case that must be validated before the feature can be considered complete.

### 1.1 Format

Each scenario includes:
- **Scenario ID**: Unique identifier for tracking
- **Title**: Clear, descriptive scenario name
- **Given**: Pre-conditions and initial state
- **When**: User action or event
- **Then**: Expected outcome and system behavior
- **Priority**: Must Have / Should Have / Could Have
- **Status**: Not Started / In Progress / Passed / Failed

### 1.2 Testing Levels

- **Functional Testing**: Does the feature work as expected?
- **Usability Testing**: Is the feature easy to use?
- **Security Testing**: Is the feature secure?
- **Performance Testing**: Does the feature perform adequately?
- **Accessibility Testing**: Is the feature accessible to all users?

---

## 2. Registration Flow Scenarios

### SC-REG-001: Successful Email/Password Registration

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on the NomadShift registration page
- User has a valid email address that is not already registered
- User has a password that meets security requirements

**When:**
- User enters email: "newuser@example.com"
- User enters password: "SecurePass123!"
- User confirms password: "SecurePass123!"
- User checks the checkbox: "I agree to the Terms of Service and Privacy Policy"
- User clicks the "Create Account" button

**Then:**
- System validates the email format (RFC 5322 compliant)
- System validates the password meets all requirements:
  - ✓ At least 8 characters
  - ✓ Contains uppercase letter
  - ✓ Contains lowercase letter
  - ✓ Contains number
  - ✓ Contains special character
- System checks the email is not already registered
- System creates a new user account with status "unverified"
- System generates a unique verification token (UUID)
- System sends a verification email to "newuser@example.com"
- System displays success message: "Check your email to verify your account. We've sent a verification link to newuser@example.com"
- Verification email contains:
  - Verification link with valid token
  - Information that link expires in 24 hours
  - Support contact information
- User record is created in database with:
  - email: "newuser@example.com"
  - password_hash: [bcrypt hash, 12 rounds]
  - email_verified: false
  - verification_token_expires_at: 24 hours from now
  - tos_accepted: true
  - tos_accepted_at: [current timestamp]
  - tos_accepted_ip: [user's IP address]

**Edge Cases:**
- Email already registered → Show error: "This email is already registered. Please log in or reset your password."
- Invalid email format → Show error: "Please enter a valid email address."
- Password too short → Show error: "Password must be at least 8 characters."
- Password missing requirements → Show specific errors for each missing requirement
- ToS not accepted → Disable "Create Account" button or show error: "You must accept the Terms of Service to create an account."

---

### SC-REG-002: Registration with Weak Password

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on the registration page
- User has a valid email address

**When:**
- User enters email: "newuser@example.com"
- User enters password: "password" (weak password)
- User clicks "Create Account"

**Then:**
- System displays password validation errors:
  - ✗ Password must be at least 8 characters
  - ✗ Password must contain at least one uppercase letter
  - ✗ Password must contain at least one number
  - ✗ Password must contain at least one special character
- System does NOT create user account
- System does NOT send verification email
- User remains on registration page
- Password strength indicator shows "Weak" or "Very Weak"

---

### SC-REG-003: Registration with Duplicate Email

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User with email "existinguser@example.com" is already registered

**When:**
- New user tries to register with email: "existinguser@example.com"
- User enters valid password
- User clicks "Create Account"

**Then:**
- System returns error response (HTTP 409 Conflict)
- System displays message: "This email is already registered. Please log in or reset your password."
- System does NOT create duplicate account
- System does NOT send verification email
- System provides links to:
  - Login page
  - Password reset page

---

### SC-REG-004: Email Verification Successful

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has registered with email: "newuser@example.com"
- User's account status is "unverified"
- User received verification email with valid token
- Token has not expired (less than 24 hours old)

**When:**
- User clicks the verification link in the email
- Link format: `https://nomadshift.app/verify-email?token=<valid-uuid>`

**Then:**
- System validates the token:
  - ✓ Token exists in database
  - ✓ Token has not expired
  - ✓ Token has not been used
- System marks user account as "verified"
- System marks token as "used"
- System records verification timestamp
- System sends welcome email to "newuser@example.com"
- System redirects user to "Email Verified Successfully" page
- Success message: "Your email has been verified! Let's get started by selecting your role."
- System displays button: "Continue to Role Selection"
- User status updated to:
  - email_verified: true
  - verified_at: [current timestamp]

---

### SC-REG-005: Email Verification with Expired Token

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has registered with email: "newuser@example.com"
- User's account status is "unverified"
- User received verification email 25 hours ago (token expired)

**When:**
- User clicks the verification link in the email

**Then:**
- System validates the token and finds it expired
- System redirects user to error page
- System displays message: "This verification link has expired (valid for 24 hours). Please request a new verification email."
- System provides button: "Request New Verification Email"
- System does NOT verify the user account
- User can request a new verification link

---

### SC-REG-006: Email Verification with Invalid Token

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has registered with email: "newuser@example.com"
- User's account status is "unverified"

**When:**
- User manually constructs a verification URL with invalid token:
  - `https://nomadshift.app/verify-email?token=invalid-token-123`

**Then:**
- System validates the token and finds it invalid
- System redirects user to error page
- System displays message: "This verification link is invalid. Please request a new verification email."
- System provides button: "Request New Verification Email"
- System does NOT verify the user account
- System logs the invalid attempt for security monitoring

---

### SC-REG-007: Request New Verification Email

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has registered but not verified email
- Previous verification token has expired

**When:**
- User clicks "Request New Verification Email"
- User enters email: "newuser@example.com"
- User clicks "Send New Link"

**Then:**
- System checks email exists and status is "unverified"
- System generates new verification token (new UUID)
- System invalidates all previous verification tokens for this user
- System sends new verification email to "newuser@example.com"
- System displays message: "A new verification email has been sent to newuser@example.com. Please check your inbox."
- New token expires in 24 hours
- System enforces rate limiting: max 3 requests per hour

---

### SC-REG-008: Login Attempt with Unverified Email

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has registered with email: "unverified@example.com"
- User's email is NOT verified (status: "unverified")
- User knows correct password

**When:**
- User navigates to login page
- User enters email: "unverified@example.com"
- User enters password: [correct password]
- User clicks "Log In"

**Then:**
- System validates email and password correctly
- System detects email is not verified
- System displays message: "Please verify your email address before continuing. We've sent a verification email to unverified@example.com."
- System provides options:
  - "Resend Verification Email" button
  - "Change Email Address" link (if user entered it incorrectly)
- System does NOT allow access to platform features
- User can request new verification email (rate limited: 3 requests/hour)

---

## 3. Login Scenarios

### SC-LOG-001: Successful Login with Email/Password

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has registered and verified email: "verified@example.com"
- User knows correct password: "SecurePass123!"

**When:**
- User navigates to login page
- User enters email: "verified@example.com"
- User enters password: "SecurePass123!"
- User clicks "Log In"

**Then:**
- System validates email format
- System retrieves user by email
- System compares provided password with stored bcrypt hash
- Password matches hash
- System checks user status is "active" (not suspended)
- System checks email is verified
- System generates JWT token containing:
  - user_id: [UUID]
  - email: "verified@example.com"
  - roles: ["business_owner"]
  - active_role: "business_owner"
  - iat: [current timestamp]
  - exp: [30 days from now]
  - jti: [unique JWT ID]
- System creates session record in database
- System records login timestamp
- System returns JWT token to client
- System stores token in client (localStorage or secure storage)
- System redirects user to dashboard
- System displays welcome message: "Welcome back, [User Name]!"
- User can access platform features based on their role

---

### SC-LOG-002: Login with Incorrect Password

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has registered and verified email: "verified@example.com"

**When:**
- User enters email: "verified@example.com"
- User enters password: "WrongPassword123!"
- User clicks "Log In"

**Then:**
- System validates email format
- System retrieves user by email
- System compares provided password with stored bcrypt hash
- Password does NOT match hash
- System returns error response (HTTP 401 Unauthorized)
- System displays message: "Incorrect email or password. Please try again."
- System does NOT generate JWT token
- System does NOT create session
- System does NOT redirect to dashboard
- System logs failed login attempt
- Rate limiting counter increments for this IP
- User remains on login page

---

### SC-LOG-003: Login with Non-Existent Email

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Email "nonexistent@example.com" is NOT registered in system

**When:**
- User enters email: "nonexistent@example.com"
- User enters password: "SomePassword123!"
- User clicks "Log In"

**Then:**
- System validates email format
- System searches for user by email
- User not found
- System returns generic error message: "Incorrect email or password. Please try again."
- System does NOT reveal that email doesn't exist (prevents email enumeration)
- System does NOT generate JWT token
- Rate limiting counter increments for this IP
- User remains on login page

---

### SC-LOG-004: Login Rate Limiting

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has exceeded login attempt limit (10 attempts in 15 minutes from IP 192.168.1.1)

**When:**
- User attempts 11th login from same IP

**Then:**
- System detects rate limit exceeded
- System returns error response (HTTP 429 Too Many Requests)
- System displays message: "Too many login attempts. Please wait 15 minutes before trying again. Contact support if you need immediate assistance."
- System does NOT process login attempt
- System does NOT check credentials
- System logs the rate limit violation
- System provides "Contact Support" link

---

### SC-LOG-005: Login with Suspended Account

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User account "suspended@example.com" has status: "suspended"

**When:**
- User enters correct email and password
- User clicks "Log In"

**Then:**
- System validates credentials successfully
- System detects account status is "suspended"
- System returns error response (HTTP 403 Forbidden)
- System displays message: "Your account has been suspended. Please contact support for more information."
- System does NOT generate JWT token
- System does NOT allow login
- System provides link to support page or email: support@nomadshift.app

---

### SC-LOG-006: Login with Dormant Account

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User registered 14 days ago
- User never verified email
- Account status changed to "dormant" after 14 days

**When:**
- User enters email and password
- User clicks "Log In"

**Then:**
- System validates credentials successfully
- System detects account status is "dormant" (unverified for 14+ days)
- System displays message: "Your account was never verified. Please verify your email to activate your account, or request a new verification link."
- System provides options:
  - "Resend Verification Email" button
  - "Delete Account" link (if user wants to remove dormant account)
- User can verify email to activate account

---

## 4. OAuth Integration Scenarios

### SC-OAUTH-001: Successful Google Registration

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on registration page
- User has a Google account with email: "googleuser@gmail.com"
- Email "googleuser@gmail.com" is NOT already registered

**When:**
- User clicks "Sign up with Google" button
- Google OAuth consent screen appears
- User grants permission to NomadShift
- Google redirects back with authorization code

**Then:**
- System exchanges authorization code for ID token
- System validates ID token signature and expiration
- System extracts user information:
  - email: "googleuser@gmail.com"
  - name: "Google User"
  - picture: "https://lh3.googleusercontent.com/..."
- System checks if email exists → NOT found
- System creates new user account:
  - email: "googleuser@gmail.com"
  - email_verified: true (auto-verified via OAuth)
  - oauth_provider: "google"
  - oauth_id: [Google user ID]
  - status: "active"
- System does NOT create password (user only uses OAuth)
- System generates JWT token
- System redirects user to role selection screen
- System displays message: "Welcome! Please select your role to continue."
- System may import profile photo from Google

---

### SC-OAUTH-002: Google Login to Existing Account

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User with email "existing@gmail.com" already registered via email/password
- User previously created account with email and password

**When:**
- User clicks "Sign in with Google" button
- User grants permission with Google account: "existing@gmail.com"
- Google redirects back with authorization code

**Then:**
- System exchanges authorization code for ID token
- System validates ID token
- System extracts email: "existing@gmail.com"
- System checks if email exists → FOUND
- System links Google account to existing user:
  - Updates user record with:
    - oauth_provider: "google"
    - oauth_id: [Google user ID]
- System logs user in (generates JWT token)
- System redirects user to dashboard
- System displays message: "Your Google account has been linked to your NomadShift account."
- User can now log in with either email/password OR Google

---

### SC-OAUTH-003: Successful Apple Sign-In Registration

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on registration page
- User has an Apple ID
- Apple ID email is NOT already registered

**When:**
- User clicks "Sign up with Apple" button
- Apple Sign-In prompt appears
- User grants permission (shares name and email)
- Apple redirects back with authorization code and ID token

**Then:**
- System receives authorization code and ID token from Apple
- System validates ID token signature using Apple's public keys
- System extracts user information:
  - email: "user@icloud.com" or relay email "xxxxx@privaterelay.appleid.com"
  - name: "Apple User"
- System creates new user account:
  - email: [extracted email]
  - email_verified: true
  - oauth_provider: "apple"
  - oauth_id: [Apple user ID]
  - status: "active"
- System generates JWT token
- System redirects user to role selection screen
- System displays message: "Welcome! Please select your role to continue."

---

### SC-OAUTH-004: Apple Sign-In with Hidden Email

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on registration page
- User has an Apple ID
- User chooses "Hide my email" option in Apple Sign-In

**When:**
- User clicks "Sign up with Apple" button
- User grants permission but chooses to hide email
- Apple provides relay email: "abcd1234@privaterelay.appleid.com"

**Then:**
- System receives authorization code and ID token
- System validates ID token
- System extracts relay email: "abcd1234@privaterelay.appleid.com"
- System creates user account with relay email:
  - email: "abcd1234@privaterelay.appleid.com"
  - email_verified: true
  - oauth_provider: "apple"
  - oauth_id: [Apple user ID]
- System stores relay email as user's primary email
- System stores original email (if provided) in metadata
- User can log in with Apple Sign-In using relay email
- Email communications work via Apple's relay service

---

### SC-OAUTH-005: OAuth Authentication Failure

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on registration/login page
- User clicks "Sign in with Google" or "Sign up with Apple"

**When:**
- User denies permission on OAuth consent screen
- OR OAuth provider returns error (invalid token, expired code, etc.)
- OAuth provider redirects back with error

**Then:**
- System receives error from OAuth provider
- System does NOT create user account
- System does NOT log user in
- System redirects user back to registration/login page
- System displays message: "Unable to sign in with Google/Apple. Please try again or use email registration."
- System logs OAuth error for debugging
- User can retry OAuth or use email/password

---

### SC-OAUTH-006: OAuth Token Validation Failure

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User attempts to sign in with Google/Apple
- OAuth provider returns authorization code
- System exchanges code for ID token

**When:**
- System attempts to validate ID token signature
- Signature validation fails (invalid signature, expired token, tampered token)

**Then:**
- System logs validation failure with details
- System does NOT create user account or log in
- System redirects user to login page
- System displays message: "Authentication failed. Please try again."
- System does NOT reveal technical details to user
- System may retry OAuth flow if user tries again

---

## 5. Password Reset Scenarios

### SC-PW-001: Successful Password Reset

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has account with email: "user@example.com"
- User forgot password

**When:**
- User navigates to login page
- User clicks "Forgot Password?" link
- User enters email: "user@example.com"
- User clicks "Send Reset Link"

**Then:**
- System validates email format
- System finds user account
- System generates unique password reset token (UUID)
- System stores token with 1-hour expiration
- System sends password reset email to "user@example.com"
- Email contains:
  - Reset link: `https://nomadshift.app/reset-password?token=<uuid>`
  - Information that link expires in 1 hour
  - Warning not to share the link
- System displays message: "If an account exists with this email, a password reset link has been sent. Please check your inbox."
- User receives email within 1 minute
- User clicks reset link within 1 hour
- System displays password reset form:
  - New password field
  - Confirm password field
  - Password requirements displayed
  - "Reset Password" button
- User enters new password: "NewSecurePass123!"
- User confirms password: "NewSecurePass123!"
- User clicks "Reset Password"
- System validates new password meets requirements
- System hashes new password with bcrypt
- System updates user password hash in database
- System marks reset token as "used"
- System invalidates all existing JWT sessions (user logged out from all devices)
- System sends password reset confirmation email
- System redirects user to login page
- System displays message: "Your password has been successfully reset. Please log in with your new password."
- User can now log in with new password

---

### SC-PW-002: Password Reset with Expired Token

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User requested password reset
- Reset token was generated 65 minutes ago (expired after 1 hour)

**When:**
- User clicks reset link from email

**Then:**
- System validates token and finds it expired
- System displays error page or form with message:
  - "This reset link has expired (valid for 1 hour). Please request a new password reset."
- System provides button: "Request New Reset Link"
- System does NOT allow password reset
- User can request new reset email

---

### SC-PW-003: Password Reset with Invalid Token

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User manually constructs reset URL with invalid token

**When:**
- User navigates to: `https://nomadshift.app/reset-password?token=invalid-token`

**Then:**
- System validates token and finds it invalid
- System displays error message:
  - "This reset link is invalid. Please request a new password reset."
- System provides button: "Request New Reset Link"
- System does NOT allow password reset
- System logs invalid attempt for security monitoring

---

### SC-PW-004: Password Reset with Weak New Password

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User clicked valid reset link
- User is on password reset form

**When:**
- User enters new password: "weak"
- User confirms password: "weak"
- User clicks "Reset Password"

**Then:**
- System validates password and finds it doesn't meet requirements
- System displays validation errors:
  - ✗ Password must be at least 8 characters
  - ✗ Must contain uppercase letter
  - ✗ Must contain number
  - ✗ Must contain special character
- System does NOT update password
- System does NOT invalidate sessions
- User remains on password reset form
- User must enter stronger password

---

### SC-PW-005: Password Reset with Mismatched Passwords

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on password reset form

**When:**
- User enters new password: "NewSecurePass123!"
- User confirms password: "DifferentPass123!"
- User clicks "Reset Password"

**Then:**
- System detects passwords don't match
- System displays error: "Passwords do not match. Please try again."
- System does NOT update password
- User remains on password reset form
- User must re-enter matching passwords

---

### SC-PW-006: Password Reset for Non-Existent Email

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Email "nonexistent@example.com" is NOT registered

**When:**
- User enters email: "nonexistent@example.com" on "Forgot Password" page
- User clicks "Send Reset Link"

**Then:**
- System searches for user by email → NOT found
- System displays generic message:
  - "If an account exists with this email, a password reset link has been sent."
- System does NOT send email
- System does NOT reveal that email doesn't exist (prevents email enumeration)
- Response time is similar to when email exists (prevent timing attacks)

---

### SC-PW-007: Password Reset Rate Limiting

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has requested 3 password resets for same email within 1 hour

**When:**
- User attempts 4th password reset request

**Then:**
- System detects rate limit exceeded
- System displays message:
  - "Too many password reset attempts. Please wait before trying again. Contact support if you need immediate assistance."
- System does NOT send reset email
- System provides "Contact Support" link
- Rate limit resets after 1 hour

---

### SC-PW-008: Password Reset for OAuth-Only Account

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User account "oauthuser@gmail.com" registered via Google OAuth
- User has NO password set (password_hash is NULL)

**When:**
- User tries to reset password for "oauthuser@gmail.com"

**Then:**
- System detects account uses OAuth (no password)
- System displays message:
  - "This account uses Google sign-in and doesn't have a password. Please log in using Google."
- System provides button: "Return to Login"
- System does NOT send password reset email
- User must use OAuth to log in

---

## 6. Role Selection and Switching Scenarios

### SC-ROLE-001: Role Selection - Business Owner

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has verified email
- User is on role selection screen
- User has not yet selected a role

**When:**
- User sees two role options:
  - "I'm a Business Owner" - with description and icon
  - "I'm a Nomad Worker" - with description and icon
- User clicks/selects "I'm a Business Owner"
- User clicks "Continue" or "Get Started"

**Then:**
- System records user's primary_role as "business_owner"
- System creates user_roles record:
  - user_id: [user's UUID]
  - role_type: "business_owner"
  - is_primary: true
  - profile_completed: false
- System updates onboarding progress
- System redirects user to Business Profile creation flow (SPEC-BIZ-001)
- System displays message: "Let's create your business profile!"
- User's active_role is set to "business_owner" in JWT token

---

### SC-ROLE-002: Role Selection - Nomad Worker

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has verified email
- User is on role selection screen

**When:**
- User clicks/selects "I'm a Nomad Worker"
- User clicks "Continue"

**Then:**
- System records user's primary_role as "nomad_worker"
- System creates user_roles record:
  - user_id: [user's UUID]
  - role_type: "nomad_worker"
  - is_primary: true
  - profile_completed: false
- System redirects user to Worker Profile creation flow (SPEC-WKR-001)
- System displays message: "Let's create your worker profile!"
- User's active_role is set to "nomad_worker" in JWT token

---

### SC-ROLE-003: Role Selection - Both Roles

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User is on role selection screen
- User wants to be both Business Owner and Nomad Worker

**When:**
- User sees option: "I want to do both"
- User clicks "I want to do both"
- System prompts: "Which role do you want to set as your primary role?"
- User selects "Business Owner" as primary
- User clicks "Continue"

**Then:**
- System records:
  - primary_role: "business_owner"
  - secondary_role: "nomad_worker"
- System creates TWO user_roles records:
  1. role_type: "business_owner", is_primary: true
  2. role_type: "nomad_worker", is_primary: false
- System redirects to create Business Owner profile first (primary role)
- System displays message: "You can always add your Nomad Worker profile later from your account settings."
- User can create secondary profile later

---

### SC-ROLE-004: Attempt to Skip Role Selection

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on role selection screen
- User tries to navigate to another part of app without selecting role

**When:**
- User tries to access dashboard, jobs, or other features

**Then:**
- System prevents navigation
- System keeps user on role selection screen
- System displays message or highlight: "Please select a role to continue"
- "Continue" button is disabled until role is selected
- User cannot bypass role selection

---

### SC-ROLE-005: Role Switching - Business Owner to Worker

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has both Business Owner and Nomad Worker roles
- User's current active_role is "business_owner"
- Both profiles are completed

**When:**
- User clicks role switcher in header or profile menu
- System shows switcher with options:
  - Currently viewing: Business Owner profile
  - Switch to: Nomad Worker profile
- User clicks "Switch to Nomad Worker"
- System confirms: "Switch to Nomad Worker profile?"

**Then:**
- System updates user's active_role to "nomad_worker" in session
- System refreshes UI to reflect new role:
  - Navigation menu changes to worker options
  - Dashboard changes to Worker Dashboard
  - Profile display shows worker name and photo
- System logs role switch with timestamp
- System displays success message: "Switched to Nomad Worker profile"
- User now sees worker-specific features:
  - Find Jobs
  - My Applications
  - Worker profile settings

---

### SC-ROLE-006: Role Switching with Incomplete Secondary Profile

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has primary_role: "business_owner" (completed profile)
- User has secondary_role: "nomad_worker" (profile NOT completed)
- User's current active_role is "business_owner"

**When:**
- User tries to switch to Nomad Worker role

**Then:**
- System detects secondary role profile is incomplete
- System displays message: "Please complete your Nomad Worker profile to switch to this role."
- System provides button: "Complete Worker Profile"
- System provides option: "Cancel" (stay as Business Owner)
- **IF** user clicks "Complete Worker Profile":
  - Redirect to Worker Profile creation flow
  - After completion, allow role switch
- **IF** user clicks "Cancel":
  - Remain as Business Owner

---

### SC-ROLE-007: View All Active Sessions

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User is logged in
- User has multiple active sessions (phone, tablet, web browser)

**When:**
- User navigates to Account Settings
- User clicks "Active Sessions" or "Security"

**Then:**
- System displays list of all active sessions:
  1. "iPhone 13 Pro - Last active 2 minutes ago - This session" ✓
  2. "Chrome on Windows - Last active 1 hour ago"
  3. "iPad Pro - Last active 3 hours ago"
- Each session shows:
  - Device type and name
  - Last activity timestamp
  - Login location (if available)
  - "Revoke" button
- System provides "Sign out from all devices" button
- User can selectively revoke sessions

---

### SC-ROLE-008: Revoke Specific Session

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User has 3 active sessions
- User wants to revoke session on "iPad Pro"

**When:**
- User clicks "Revoke" button next to "iPad Pro" session
- System confirms: "Revoke access for iPad Pro?"

**Then:**
- System marks session as revoked in database
- System invalidates JWT token (adds to blacklist)
- System displays success message: "Session revoked. iPad Pro has been logged out."
- System refreshes session list (now shows 2 sessions)
- iPad Pro user is immediately logged out and redirected to login screen
- Other sessions remain active

---

## 7. Biometric Authentication Scenarios

### SC-BIO-001: Enable Face ID on iOS

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User is using NomadShift iOS app
- User has successfully logged in with email/password
- Device supports Face ID (iPhone X or newer)

**When:**
- User completes login
- System displays prompt: "Would you like to enable Face ID for faster login next time?"
- User taps "Enable Face ID"
- iOS shows Face ID permission prompt
- User authenticates with Face ID (scans face)

**Then:**
- System generates biometric authentication token
- System stores token in iOS Keychain (secure enclave)
- System associates token with user account
- System displays success message: "Face ID enabled. You can now use Face ID to log in."
- System stores biometric preference in user settings: is_biometric_enabled: true
- Next time user opens app, Face ID prompt appears automatically

---

### SC-BIO-002: Login with Face ID

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User previously enabled Face ID
- User opens NomadShift iOS app
- User is not logged in (no active session)

**When:**
- App launches
- System detects biometric token exists in Keychain
- System shows Face ID prompt: "Log in to NomadShift"
- User authenticates with Face ID

**Then:**
- Face ID authentication succeeds
- System retrieves biometric token from Keychain
- System validates token (not expired, user ID matches)
- System generates new JWT session token
- System creates session record in database
- System logs user in
- System redirects to dashboard
- Login completes in < 2 seconds
- User does NOT need to enter email/password

---

### SC-BIO-003: Face ID Authentication Failure

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User enabled Face ID
- User opens app
- Face ID prompt appears

**When:**
- Face ID authentication fails (face not recognized, user cancels, etc.)

**Then:**
- System detects authentication failure
- System does NOT log user in
- System displays message: "Face ID authentication failed. Please log in with your email/password or use Google/Apple sign-in."
- System shows standard login screen with:
  - Email/password fields
  - Google Sign-In button
  - Apple Sign-In button
- User can fall back to standard login methods
- System does NOT lock user account

---

### SC-BIO-004: Disable Face ID

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User has enabled Face ID
- User is in app settings

**When:**
- User navigates to Settings → Security
- User sees "Biometric Authentication" toggle: ON
- User toggles to OFF
- System confirms: "Disable Face ID authentication?"

**Then:**
- System removes biometric token from Keychain
- System updates user settings: is_biometric_enabled: false
- System displays message: "Face ID authentication disabled"
- Next time user opens app, standard login screen appears (no Face ID prompt)
- User can re-enable Face ID later

---

### SC-BIO-005: Fingerprint Authentication on Android

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User is using NomadShift Android app
- User has successfully logged in
- Device has fingerprint sensor
- User has enrolled fingerprints

**When:**
- User completes login
- System prompts: "Enable fingerprint authentication?"
- User taps "Enable"
- Android shows biometric prompt
- User scans fingerprint

**Then:**
- System generates biometric token
- System stores token in Android Keystore (encrypted)
- System displays success message: "Fingerprint authentication enabled"
- User can now log in with fingerprint

---

### SC-BIO-006: Biometric Settings Change Detected

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User has enabled Face ID / fingerprint
- User adds new fingerprint to device
- OR user removes all fingerprints

**When:**
- User opens NomadShift app
- System detects biometric settings changed

**Then:**
- System invalidates stored biometric token
- System requires user to re-authenticate with email/password or OAuth
- System prompts: "Your biometric settings have changed. Please log in with your email/password."
- User must log in with standard method
- After successful login, system offers to re-enable biometric authentication
- User can choose to enable or disable biometric

---

## 8. Session Management Scenarios

### SC-SES-001: Session Expiration After 30 Days

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User logged in 30 days ago
- User has not used app for 30 days (no API requests)
- JWT token was issued 30 days ago

**When:**
- User opens app and makes authenticated request
- User's JWT token has expired (exp timestamp passed)

**Then:**
- System validates JWT token and finds it expired
- System returns HTTP 401 Unauthorized with error code: TOKEN_EXPIRED
- Client detects token expired
- Client clears stored token from localStorage
- Client redirects user to login screen
- Client displays message: "Your session has expired. Please log in again."
- User must re-authenticate with email/password or OAuth

---

### SC-SES-002: Explicit Logout

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is logged in
- User has active JWT token
- User is on dashboard or any app screen

**When:**
- User clicks "Log Out" button in menu or profile

**Then:**
- System sends POST /api/auth/logout request
- System receives JWT token in Authorization header
- System extracts JWT ID (jti) from token
- System adds token to blacklist in Redis
- System records logout timestamp
- System returns success response: "Logged out successfully"
- Client clears token from localStorage
- Client clears user data from state
- Client redirects to login screen
- User cannot access protected endpoints without logging in again

---

### SC-SES-003: Logout from All Devices

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is logged in on 3 devices:
  1. iPhone app
  2. Android tablet
  3. Web browser (laptop)
- User is currently using web browser

**When:**
- User navigates to Settings → Security
- User clicks "Sign out from all devices"
- System confirms: "Sign out from all devices? This will log you out everywhere."

**Then:**
- System retrieves all active sessions for user from database
- System invalidates all JWT tokens (adds all to blacklist)
- System marks all sessions as revoked
- System sends notification emails to user:
  - "You have been logged out from all devices"
  - Lists devices that were logged out
- System returns success response
- Current user is logged out immediately
- Other devices (iPhone, Android tablet) are logged out on next request
- All users must re-authenticate to access platform

---

### SC-SES-004: Concurrent Sessions Allowed

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User is logged in on iPhone
- User has valid JWT token on iPhone

**When:**
- User logs in on Android tablet (same account)
- User enters correct credentials
- User clicks "Log In"

**Then:**
- System validates credentials
- System generates NEW JWT token for Android session
- System creates NEW session record in database
- System allows both sessions to be active simultaneously
- iPhone session remains active (not invalidated)
- User is logged in on both devices
- Each device has independent session
- User can use both devices concurrently

---

### SC-SES-005: Token Refresh (Optional Feature)

**Priority:** Could Have
**Status:** Not Started

**Given:**
- User's JWT token is expiring soon (e.g., 28 days old)
- Token will expire in 2 days
- User is actively using app

**When:**
- Client detects token is expiring soon
- Client sends POST /api/auth/refresh-token request
- Client includes current (expiring) JWT token in Authorization header

**Then:**
- System validates current token (not expired yet)
- System generates NEW JWT token with fresh expiration (30 days from now)
- System invalidates old JWT token (adds to blacklist)
- System returns new token in response
- Client stores new token
- Client replaces old token with new token
- User's session is extended without requiring re-login
- User experience is seamless (no interruption)

---

## 9. Terms of Service Scenarios

### SC-TOS-001: ToS Acceptance on Registration

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on registration page
- User has entered valid email and password
- Terms of Service checkbox is unchecked

**When:**
- User clicks "Create Account" WITHOUT checking ToS checkbox

**Then:**
- System prevents form submission
- "Create Account" button remains disabled OR
- If button is enabled, system validates on server side and returns error
- System displays error: "You must accept the Terms of Service and Privacy Policy to create an account."
- System highlights ToS checkbox
- User must check checkbox to proceed

---

### SC-TOS-002: ToS Accepted - Record Created

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on registration page
- User has entered valid email and password
- Terms of Service checkbox is displayed

**When:**
- User checks "I agree to the Terms of Service and Privacy Policy"
- User clicks "Create Account"

**Then:**
- System creates user account
- System records ToS acceptance:
  - tos_version: "1.0"
  - tos_accepted_at: [current timestamp]
  - tos_accepted_ip: [user's IP address]
  - user_agent: [browser/app version]
- System creates entry in tos_acceptance_history table
- System stores acceptance for legal compliance
- Account creation proceeds successfully

---

### SC-TOS-003: ToS Update - Require Re-Acceptance

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User registered 6 months ago
- User accepted ToS version "1.0"
- ToS has been updated to version "1.1"
- User is logging in for first time since update

**When:**
- User enters email and password
- User clicks "Log In"

**Then:**
- System validates credentials
- System detects ToS version has changed (1.0 → 1.1)
- System does NOT allow login to proceed
- System redirects user to ToS update screen
- System displays modal: "Our Terms of Service have been updated. Please review and accept the new terms to continue."
- System displays new ToS text with changes highlighted
- System shows checkbox: "I accept the new Terms of Service (v1.1)"
- User must check checkbox to continue
- **IF** user accepts:
  - System records new acceptance:
    - tos_version: "1.1"
    - tos_accepted_at: [current timestamp]
  - System creates entry in tos_acceptance_history
  - System proceeds with login
- **IF** user declines:
  - System does not allow login
  - System offers option to delete account (if user doesn't agree)

---

### SC-TOS-004: View ToS Acceptance History

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User is logged in
- User has accepted ToS multiple times (original + updates)

**When:**
- User navigates to Account Settings → Legal Agreements

**Then:**
- System displays ToS acceptance history:
  - Accepted v1.0 on Jan 1, 2026 from IP 192.168.1.1
  - Accepted v1.1 on Feb 1, 2026 from IP 192.168.1.5
- System provides links:
  - "View Terms of Service (v1.1)"
  - "View Privacy Policy (v1.1)"
  - "Download PDF"
- System shows current accepted version
- System records are retained for legal compliance (7 years minimum)

---

### SC-TOS-005: Grace Period for ToS Update

**Priority:** Should Have
**Status:** Not Started

**Given:**
- ToS has been updated to v1.1
- User is logging in 2 days after update (within 30-day grace period)

**When:**
- User logs in
- System detects new ToS version

**Then:**
- System allows user to proceed with login (not blocked)
- System displays banner at top of screen:
  - "Our Terms of Service have been updated. Please review and accept the new terms by [date 30 days from now]."
  - Banner has "Review Now" button
- User can dismiss banner temporarily
- Banner reappears on next login if not accepted
- **IF** user clicks "Review Now":
  - Show ToS acceptance modal
  - Require acceptance
- **AFTER** 30 days if not accepted:
  - Block access until new ToS accepted

---

## 10. Multi-Language Scenarios

### SC-LANG-001: Auto-Detect Browser Language

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User visits NomadShift website for first time (no cookies, no account)
- User's browser language is set to "es-ES" (Spanish)

**When:**
- User loads website

**Then:**
- System reads browser language from `navigator.language` or `Accept-Language` header
- System detects "es" (Spanish)
- System automatically sets app language to Spanish
- System displays UI in Spanish
- System shows banner: "Hemos configurado el idioma en español. Cámbialo en configuración." (We've set the language to Spanish. Change in settings.)
- System stores language preference in cookie/localStorage

---

### SC-LANG-002: Language Selection During Registration

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on registration page
- User's browser language is not supported (e.g., "fr-FR" French)
- System defaulted to English

**When:**
- User loads registration page

**Then:**
- System displays language selection modal:
  - "Select your preferred language / Seleccione su idioma preferido"
  - Options:
    - 🇺🇸 English
    - 🇪🇸 Español
- User selects "Español"
- System immediately updates UI to Spanish
- Registration form labels, buttons, errors display in Spanish
- System stores language preference in cookie for anonymous user

---

### SC-LANG-003: Store Language Preference After Registration

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User selected Spanish during registration
- User completed registration and verified email

**When:**
- User logs in for first time after verification

**Then:**
- System retrieves user's language preference from profile
- System displays entire app in Spanish
- All UI elements, menus, buttons are in Spanish
- Dashboard, settings, notifications are in Spanish
- User's preferred_language field is "es" in database
- Language preference persists across all future sessions

---

### SC-LANG-004: Change Language Preference

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is logged in
- User's current language is English
- User wants to switch to Spanish

**When:**
- User clicks profile menu or settings
- User sees "Language / Idioma" option
- User clicks language selector
- User selects "Español"

**Then:**
- System immediately updates UI to Spanish (no page reload required)
- System stores new preference in database:
  - preferred_language: "es"
- System displays toast message: "Idioma cambiado a Español" (Language changed to Spanish)
- All UI elements translate to Spanish
- Language preference persists on next login

---

### SC-LANG-005: Language-Specific Email Communications

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User's preferred_language is "es" (Spanish)
- User requests password reset

**When:**
- System sends password reset email

**Then:**
- System retrieves user's language preference: "es"
- System selects Spanish email template
- Email content is in Spanish:
  - Subject: "Restablecer tu contraseña" (Reset your password)
  - Body: Spanish instructions and button text
- System sends email in Spanish
- **IF** user's preferred_language is "en":
  - Send email in English

---

### SC-LANG-006: Unsupported Language Fallback

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User's browser language is "de-DE" (German, not supported in v1.0)
- User visits NomadShift for first time

**When:**
- System detects browser language

**Then:**
- System checks if "de" is supported → NOT supported
- System defaults to English
- System displays language selection modal:
  - "Your browser is set to German, which is not yet supported. Please select English or Spanish."
  - Options: English / Español
- User can select supported language
- System does NOT attempt to display UI in German

---

## 11. Security Test Scenarios

### SC-SEC-001: SQL Injection Prevention

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on login page
- Attacker attempts SQL injection

**When:**
- User enters email: "' OR '1'='1"
- User enters password: "anything"
- User clicks "Log In"

**Then:**
- System sanitizes input
- System uses parameterized queries or ORM
- SQL injection attempt fails
- System treats input as literal string (not SQL code)
- Login fails (credentials invalid)
- System logs injection attempt for security monitoring
- System is NOT compromised

---

### SC-SEC-002: XSS Prevention

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on registration page
- Attacker attempts XSS attack

**When:**
- User enters name field: "<script>alert('XSS')</script>"
- User enters email: "user@example.com"
- User completes registration

**Then:**
- System sanitizes input
- System escapes HTML entities in name field
- System stores sanitized name: "&lt;script&gt;alert('XSS')&lt;/script&gt;"
- When name is displayed on profile:
  - Script does NOT execute
  - Text displays as literal: "<script>alert('XSS')</script>"
  - No alert popup appears
- System is NOT compromised

---

### SC-SEC-003: CSRF Protection

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is logged in
- Attacker creates malicious website with CSRF form

**When:**
- User visits attacker's website while logged into NomadShift
- Attacker's form attempts to submit POST request to NomadShift:
  - Action: https://nomadshift.app/api/auth/logout-all
  - Attempts to log user out from all devices

**Then:**
- System validates CSRF token
- System finds missing or invalid CSRF token
- System rejects request with HTTP 403 Forbidden
- User remains logged in
- Attack fails
- **IF** NomadShift uses same-site cookies:
  - Browser blocks CSRF request automatically
  - Request never reaches server

---

### SC-SEC-004: JWT Token Manipulation

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is logged in
- User's JWT token contains: role: "nomad_worker"
- Attacker attempts to escalate privileges

**When:**
- Attacker decodes JWT token (Base64 decode)
- Attacker modifies payload: role: "business_owner"
- Attacker re-encodes token
- Attacker sends modified token in Authorization header

**Then:**
- System validates JWT signature using public key
- Signature validation FAILS (token was tampered)
- System rejects request with HTTP 401 Unauthorized
- System displays error: "Invalid token"
- Attacker cannot escalate privileges
- System logs tampering attempt

---

### SC-SEC-005: Brute Force Password Attack

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Attacker knows user's email: "victim@example.com"
- Attacker wants to guess password

**When:**
- Attacker attempts 10 different passwords in 10 minutes:
  1. password1
  2. password2
  3. password3
  ...
  10. password10

**Then:**
- After 5th failed attempt:
  - Rate limiting kicks in
  - System slows down responses (increasing delay)
- After 10th failed attempt:
  - System blocks further attempts from this IP
  - System returns HTTP 429 Too Many Requests
  - System displays message: "Too many login attempts. Please wait 15 minutes."
- Attack is thwarted
- Account remains secure

---

### SC-SEC-006: Email Enumeration Prevention

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Attacker wants to find which emails are registered

**When:**
- Attacker tries password reset for "existent@example.com" (registered)
- Attacker tries password reset for "nonexistent@example.com" (not registered)

**Then:**
- **FOR** existent@example.com:
  - System sends reset email
  - Response time: 500ms
  - Message: "If an account exists, a reset link was sent."
- **FOR** nonexistent@example.com:
  - System does NOT send email
  - Response time: 500ms (similar to existent email)
  - Message: "If an account exists, a reset link was sent."
- Attacker cannot determine which emails exist
- Response times are similar (prevent timing attacks)
- Messages are identical

---

### SC-SEC-007: Session Hijacking Prevention

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Attacker steals user's JWT token (e.g., via XSS on vulnerable site)
- Attacker uses stolen token to make requests

**When:**
- Attacker sends request with stolen JWT token
- User logs out from their device

**Then:**
- User's logout adds token to blacklist
- Attacker's next request with stolen token:
  - System checks blacklist
  - System finds token is revoked
  - System rejects request with HTTP 401 Unauthorized
  - Attacker cannot access account
- Session is secured after logout

---

### SC-SEC-008: HTTPS Enforcement

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User tries to access NomadShift over HTTP (unencrypted)

**When:**
- User navigates to: `http://nomadshift.app/login`

**Then:**
- Server redirects to HTTPS: `https://nomadshift.app/login`
- Browser shows padlock icon
- All data is encrypted in transit (TLS 1.3)
- Passwords, tokens, cookies are never sent over HTTP
- HSTS header ensures future requests always use HTTPS

---

## 12. Quality Gate Criteria

### 12.1 Functional Completeness

**Must Have Criteria (ALL must pass):**

- [ ] Users can register with email/password and complete verification
- [ ] Users can register with Google OAuth
- [ ] Users can register with Apple Sign-In
- [ ] Users can log in with email/password
- [ ] Users can log in with Google/Apple OAuth
- [ ] Users can reset password via email
- [ ] Users can select role (Business Owner / Nomad Worker) during onboarding
- [ ] Users can switch between roles if both are configured
- [ ] Sessions expire after 30 days of inactivity
- [ ] Users can log out from current device
- [ ] Users can log out from all devices
- [ ] Users must accept ToS before registration
- [ ] Users can select language (English/Spanish) during onboarding
- [ ] Biometric authentication works on supported devices

**Should Have Criteria (at least 80% must pass):**

- [ ] Users can view all active sessions
- [ ] Users can revoke specific sessions
- [ ] ToS updates require re-acceptance
- [ ] Grace period for ToS acceptance (30 days)
- [ ] Language auto-detection works
- [ ] Email communications use user's preferred language
- [ ] Token refresh extends session (if implemented)

---

### 12.2 Security Requirements

**ALL must pass:**

- [ ] All passwords hashed with bcrypt (12+ rounds)
- [ ] JWT tokens signed with RS256 (asymmetric encryption)
- [ ] All authentication endpoints use HTTPS (TLS 1.3+)
- [ ] Rate limiting enforced on all auth endpoints:
  - Registration: 5 attempts per 15 min per IP
  - Login: 10 attempts per 15 min per IP
  - Password reset: 3 requests per hour per email
- [ ] SQL injection attacks are prevented
- [ ] XSS attacks are prevented
- [ ] CSRF protection is implemented
- [ ] Email enumeration is prevented
- [ ] JWT token manipulation is prevented
- [ ] Password reset tokens expire after 1 hour
- [ ] Email verification tokens expire after 24 hours
- [ ] Tokens are single-use only
- [ ] Biometric tokens stored in secure device storage (not transmitted)

---

### 12.3 Performance Requirements

**ALL must pass:**

- [ ] Registration API responds within 2 seconds (p95)
- [ ] Login API responds within 1 second (p95)
- [ ] Email verification API responds within 500ms (p95)
- [ ] Password reset request API responds within 1 second (p95)
- [ ] OAuth authentication completes within 3 seconds (p95)
- [ ] JWT token validation takes < 100ms
- [ ] Email delivery (verification, reset) completes within 1 minute (p95)
- [ ] System can handle 1000 concurrent login requests without degradation

---

### 12.4 Usability Requirements

**ALL must pass:**

- [ ] Registration flow is intuitive (no user confusion in testing)
- [ ] Password requirements are clearly explained
- [ ] Error messages are clear and actionable
- [ ] OAuth buttons are prominent and easy to find
- [ ] Role selection is visually clear (icons, descriptions)
- [ ] Biometric setup is easy (2-3 steps)
- [ ] Language switching is immediate (no app restart)
- [ ] Logout is accessible from all screens
- [ ] Mobile interface is responsive and touch-friendly
- [ ] Forms provide real-time validation feedback

---

### 12.5 Accessibility Requirements

**ALL must pass (WCAG 2.1 Level AA):**

- [ ] All form inputs have associated labels
- [ ] Error messages are announced by screen readers
- [ ] Color is NOT the only means of conveying information
- [ ] Touch targets are at least 44x44 pixels (mobile)
- [ ] Keyboard navigation works for all authentication flows
- [ ] Focus indicators are visible
- [ ] ToS links open in accessible modals or new pages
- [ ] Language selector is accessible via keyboard

---

### 12.6 Testing Requirements

**ALL must pass:**

- [ ] Unit test coverage >= 70% for authentication services
- [ ] All registration scenarios (SC-REG-001 to SC-REG-008) pass
- [ ] All login scenarios (SC-LOG-001 to SC-LOG-006) pass
- [ ] All OAuth scenarios (SC-OAUTH-001 to SC-OAUTH-006) pass
- [ ] All password reset scenarios (SC-PW-001 to SC-PW-008) pass
- [ ] All role selection scenarios (SC-ROLE-001 to SC-ROLE-008) pass
- [ ] All session management scenarios (SC-SES-001 to SC-SES-005) pass
- [ ] All ToS scenarios (SC-TOS-001 to SC-TOS-005) pass
- [ ] All multi-language scenarios (SC-LANG-001 to SC-LANG-006) pass
- [ ] All security test scenarios (SC-SEC-001 to SC-SEC-008) pass
- [ ] No critical security vulnerabilities in penetration test
- [ ] Performance benchmarks meet targets

---

### 12.7 Documentation Requirements

**ALL must pass:**

- [ ] API documentation (OpenAPI/Swagger) is complete
- [ ] All authentication endpoints are documented
- [ ] Request/response examples are provided
- [ ] Error codes are documented
- [ ] User-facing help documentation exists:
  - How to register
  - How to verify email
  - How to reset password
  - How to use OAuth
  - How to switch roles
  - How to enable biometric authentication
- [ ] Developer documentation exists:
  - JWT token structure
  - OAuth integration guide
  - API authentication guide

---

### 12.8 Deployment Readiness

**ALL must pass:**

- [ ] Database migrations are tested and reversible
- [ ] Environment variables are documented
- [ ] Redis is configured for session storage and rate limiting
- [ ] Email service provider is configured and tested
- [ ] OAuth provider credentials are set up:
  - Google Cloud Console configured
  - Apple Developer configured
- [ ] JWT key pair is generated and secured
- [ ] HTTPS certificates are installed (TLS 1.3+)
- [ ] Monitoring and logging are configured:
  - Authentication success/failure logs
  - Rate limiting alerts
  - Error tracking (Sentry)
- [ ] CI/CD pipeline is configured
- [ ] Rollback plan is documented

---

### 12.9 Final Sign-Off Checklist

**Before SPEC-AUTH-001 can be marked as COMPLETE:**

- [ ] All Must Have acceptance criteria pass
- [ ] At least 80% of Should Have criteria pass
- [ ] Security audit is completed with no critical findings
- [ ] Performance testing meets all targets
- [ ] Penetration testing is completed
- [ ] User acceptance testing (UAT) is completed
- [ ] Bug fixes are implemented and verified
- [ ] Documentation is complete and reviewed
- [ ] Deployment plan is approved
- [ ] Stakeholders (Product Owner, Tech Lead) have signed off

---

**End of Acceptance Criteria**
