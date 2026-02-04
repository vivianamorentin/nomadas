# SPEC-BIZ-001: Acceptance Criteria

**Specification ID:** SPEC-BIZ-001
**Specification Title:** Business Profile Management
**Version:** 1.0
**Date:** 2026-02-03
**Status:** Draft

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Profile Creation Scenarios](#business-profile-creation-scenarios)
3. [Geolocation Validation Scenarios](#geolocation-validation-scenarios)
4. [Multiple Business Locations Scenarios](#multiple-business-locations-scenarios)
5. [Profile Editing Scenarios](#profile-editing-scenarios)
6. [Photo Management Scenarios](#photo-management-scenarios)
7. [Reputation System Scenarios](#reputation-system-scenarios)
8. [Business Verification Scenarios](#business-verification-scenarios)
9. [Security Test Scenarios](#security-test-scenarios)
10. [Quality Gate Criteria](#quality-gate-criteria)

---

## 1. OVERVIEW

This document defines the acceptance criteria for the Business Profile Management system. Each scenario represents a real-world use case that must be validated before the feature can be considered complete.

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

## 2. BUSINESS PROFILE CREATION SCENARIOS

### SC-BIZ-001: Successful Business Profile Creation

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is authenticated with business_owner role
- User has completed role selection and reached business profile creation flow
- User has all required information ready

**When:**
- User fills in the business profile form:
  - Business name: "Sunset Beach Bar"
  - Business type: "Bar" (selected from dropdown)
  - Description: "A vibrant beachfront bar specializing in tropical cocktails and live music, located in the heart of Tulum."
  - Location: "123 Beach Road, Tulum, Mexico"
  - Contact email: "contact@sunsetbeachbar.com"
  - Contact phone: "+52 984 123 4567"
- User uploads 1 photo of the business (exterior shot)
- User clicks "Create Business Profile"

**Then:**
- System validates all required fields are present and valid
- System validates business name length (<= 100 characters) ✓
- System validates description length (<= 500 characters) ✓
- System validates email format ✓
- System validates phone format ✓
- System validates at least 1 photo is uploaded ✓
- System geocodes the address and retrieves coordinates:
  - Latitude: 20.2114
  - Longitude: -87.4654
- System creates business profile record in database:
  - `id`: UUID generated
  - `user_id`: [authenticated user's ID]
  - `business_name`: "Sunset Beach Bar"
  - `business_type`: "bar"
  - `description`: [user's description]
  - `location_address`: "123 Beach Road"
  - `location_city`: "Tulum"
  - `location_country`: "Mexico"
  - `location_latitude`: 20.2114
  - `location_longitude`: -87.4654
  - `contact_email`: "contact@sunsetbeachbar.com"
  - `contact_phone`: "+52 984 123 4567"
  - `status`: "active"
  - `is_verified`: false
  - `prestige_level`: "bronze"
  - `average_rating`: 0.00
  - `total_reviews`: 0
- System uploads photo to S3 and stores metadata
- System updates `user_roles.profile_completed` to TRUE
- System links business profile to user's business_owner role
- System displays success message: "Business profile created successfully!"
- System redirects user to business profile dashboard
- User can now post jobs for this business

**Edge Cases:**
- Business name too long (>100 chars) → Show error "Business name must be 100 characters or less."
- Description too long (>500 chars) → Show error and character counter
- Invalid email → Show error "Please enter a valid email address."
- No photo uploaded → Show error "Please upload at least 1 photo of your business."
- Geocoding fails → Show error and offer manual location selection

---

### SC-BIZ-002: Business Profile Creation - Missing Required Fields

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on business profile creation form
- User has not filled in all required fields

**When:**
- User enters only:
  - Business name: "Cafe Tulum"
  - Business type: "Cafe"
- User leaves empty:
  - Description
  - Location
  - Contact email and phone
  - Photos
- User clicks "Create Business Profile"

**Then:**
- System detects missing required fields
- System displays validation errors:
  - ✗ "Description is required (max 500 characters)"
  - ✗ "Location is required"
  - ✗ "Contact email is required"
  - ✗ "Contact phone is required"
  - ✗ "At least 1 photo is required"
- System does NOT create business profile
- System keeps user on form with pre-filled data
- "Create Business Profile" button is disabled until all errors are resolved

---

### SC-BIZ-003: Business Profile Creation - Custom Business Type

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is creating a business profile
- User's business type is not in the standard list

**When:**
- User selects "Other" from business type dropdown
- System displays text input field: "Please specify your business type"
- User enters: "Yoga Studio"
- User fills in all other required fields
- User clicks "Create Business Profile"

**Then:**
- System stores `business_type`: "other"
- System stores `business_type_custom`: "Yoga Studio"
- System creates business profile successfully
- Business profile displays: "Yoga Studio" as the business type
- Business is categorized as "Other" in filters/listings

---

### SC-BIZ-004: Business Profile Creation - Optional Website URL

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User is creating a business profile
- User has a website for their business

**When:**
- User fills in all required fields
- User enters website: "https://sunsetbeachbar.com"
- User clicks "Create Business Profile"

**Then:**
- System validates website URL format (optional field)
- System stores `website_url`: "https://sunsetbeachbar.com"
- Business profile displays website link
- Users can click link to visit business website

**Edge Case:**
- Invalid URL format → Show error "Please enter a valid website URL (e.g., https://example.com)"

---

## 3. GEOLOCATION VALIDATION SCENARIOS

### SC-GEO-001: Successful Address Geocoding

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on business profile creation form
- User enters address manually

**When:**
- User types address: "123 Beach Road, Tulum, Mexico"
- User clicks "Validate Address" or tab out of address field
- System sends address to geocoding service

**Then:**
- System receives geocoding response with:
  - Formatted address: "123 Beach Road, Tulum, Quintana Roo, Mexico"
  - City: "Tulum"
  - Country: "Mexico"
  - Postal code: "77780"
  - Latitude: 20.2114
  - Longitude: -87.4654
- System fills in location fields automatically
- System displays map preview centered on coordinates
- System shows pin/marker at exact location
- System stores coordinates in hidden fields
- User sees confirmation: "Location validated successfully!"
- User can proceed with profile creation

---

### SC-GEO-002: Invalid Address - Geocoding Fails

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is on business profile creation form
- User enters an invalid address

**When:**
- User types address: "Nonexistent Street 123, Fake City"
- System sends address to geocoding service
- Geocoding service returns ZERO_RESULTS

**Then:**
- System detects address is invalid
- System displays error: "Unable to validate this address. Please check the address and try again, or select the location on the map."
- System provides two options:
  1. "Try again" - Allows user to correct address
  2. "Select on map" - Opens map interface for manual pin placement
- System does NOT proceed with profile creation until valid location is provided

---

### SC-GEO-003: Multiple Address Matches - User Selects Correct One

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User enters an ambiguous address
- Geocoding service returns multiple possible matches

**When:**
- User types: "Main Street, Tulum"
- Geocoding service returns 5 matches for "Main Street" in Tulum area
- System displays list of options:
  1. "Main Street, Tulum Centro, Tulum, Mexico"
  2. "Main Street, La Veleta, Tulum, Mexico"
  3. "Main Street, Colonia, Tulum, Mexico"
  - ... (all matches)

**Then:**
- User selects correct address: "Main Street, Tulum Centro, Tulum, Mexico"
- System fills in location fields with selected address
- System retrieves coordinates for selected address
- System displays map preview
- Profile creation proceeds

---

### SC-GEO-004: User Drags Map Pin to Adjust Location

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User has validated address and sees map preview
- The pin is slightly off from the actual business entrance

**When:**
- User clicks and drags the map pin to the correct location
- User drops pin at new coordinates
- System detects pin position changed

**Then:**
- System performs reverse geocoding on new coordinates
- System updates address fields with reverse-geocoded address
- System displays confirmation: "Location updated. Please verify the address is correct."
- User sees:
  - Updated address: "125 Beach Road, Tulum, Mexico" (corrected street number)
  - New coordinates reflected on map
- User can confirm or cancel the change

---

### SC-GEO-005: Geocoding Service Down - Fallback to Manual Entry

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User enters address to validate
- Geocoding service is temporarily down (API timeout or error)

**When:**
- System attempts to geocode address
- Geocoding service fails (returns error or times out)

**Then:**
- System displays warning: "Location validation is temporarily unavailable. Please enter your location manually or try again later."
- System allows manual coordinate entry:
  - User can enter latitude and longitude directly
  - User can click on map to place pin
- System proceeds with profile creation using manually entered coordinates
- System flags location for re-validation when service is available

---

## 4. MULTIPLE BUSINESS LOCATIONS SCENARIOS

### SC-MULTI-001: Create Second Business Profile

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User already has one business profile: "Sunset Beach Bar"
- User wants to add a second business location

**When:**
- User navigates to business profile dashboard
- User sees list of their businesses
- User clicks "Add another business location" button
- System displays new business profile creation form (same as initial)
- User fills in form for second business:
  - Business name: "Jungle Cafe"
  - Business type: "Cafe"
  - Location: "45 Jungle Road, Tulum, Mexico"
  - Description: "Cozy cafe in the jungle..."
  - Uploads 3 photos
  - Contact info
- User clicks "Create Business Profile"

**Then:**
- System creates new business profile record:
  - New `id` generated
  - Same `user_id` as first business
  - All fields populated with second business data
- System associates both businesses with same user account
- User's business dashboard now shows 2 businesses:
  1. "Sunset Beach Bar" (Bar) - Tulum - Active
  2. "Jungle Cafe" (Cafe) - Tulum - Active
- User can switch between managing each business
- Each business has independent:
  - Job postings
  - Reviews
  - Reputation

---

### SC-MULTI-002: Switch Between Multiple Businesses

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has 2 business profiles: "Sunset Beach Bar" and "Jungle Cafe"
- User is currently viewing "Sunset Beach Bar" dashboard

**When:**
- User clicks business selector in header
- System shows dropdown with both businesses
- User clicks "Jungle Cafe"
- System confirms: "Switch to Jungle Cafe dashboard?"

**Then:**
- System switches active business context to "Jungle Cafe"
- System refreshes UI to show "Jungle Cafe" data:
  - Dashboard shows Jungle Cafe's job postings
  - Photos show Jungle Cafe's images
  - Reviews show Jungle Cafe's ratings
- Navigation updates to reflect current business
- System can switch back to "Sunset Beach Bar" anytime

---

### SC-MULTI-003: Set Primary Business

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User has 2 businesses, neither marked as primary

**When:**
- User navigates to business settings
- User sees "Primary Business" option
- User selects "Jungle Cafe" as primary
- User clicks "Save"

**Then:**
- System updates business_profiles table:
  - Jungle Cafe: `is_primary` = TRUE
  - Sunset Beach Bar: `is_primary` = FALSE
- Jungle Cafe is displayed first in business listings
- Jungle Cafe is used as default when posting jobs (if not specified)
- "Primary" badge is displayed next to Jungle Cafe in dashboard

---

### SC-MULTI-004: Delete Business Profile - No Active Jobs

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has 2 business profiles
- "Sunset Beach Bar" has no active job postings and no ongoing work agreements

**When:**
- User navigates to "Sunset Beach Bar" settings
- User clicks "Delete Business Profile"
- System shows confirmation modal: "Are you sure you want to delete 'Sunset Beach Bar'? This action cannot be undone."
- User confirms deletion

**Then:**
- System checks for active job postings: None ✓
- System checks for ongoing work agreements: None ✓
- System deletes business profile record (soft delete or hard delete)
- System deletes associated photos from S3
- User's business dashboard now shows only 1 business: "Jungle Cafe"
- User can no longer access "Sunset Beach Bar" data

---

### SC-MULTI-005: Delete Business Profile - Has Active Jobs (Blocked)

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has business profile "Sunset Beach Bar"
- Business has 3 active job postings
- Business has 1 ongoing work agreement

**When:**
- User tries to delete "Sunset Beach Bar" profile

**Then:**
- System detects active job postings and work agreements
- System blocks deletion
- System displays error message:
  - "Cannot delete this business profile because it has active job postings or work agreements."
  - "Active job postings: 3"
  - "Ongoing work agreements: 1"
- System suggests alternative: "You can deactivate the profile instead. This will hide it from workers but keep your data."
- User can choose to:
  - Cancel deletion
  - Deactivate profile (sets status to 'inactive')

---

## 5. PROFILE EDITING SCENARIOS

### SC-EDIT-001: Update Business Name

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has existing business profile: "Sunset Beach Bar"

**When:**
- User navigates to business profile
- User clicks "Edit Profile"
- User changes business name from "Sunset Beach Bar" to "Sunset Beach Bar & Grill"
- User clicks "Save Changes"

**Then:**
- System validates new business name (<= 100 characters)
- System updates `business_name` field
- System updates `updated_at` timestamp
- System logs change in `business_profile_changes`:
  - `changed_field`: "business_name"
  - `old_value`: "Sunset Beach Bar"
  - `new_value`: "Sunset Beach Bar & Grill"
  - `changed_at`: [current timestamp]
  - `changed_by`: [user_id]
- System displays success: "Business profile updated successfully!"
- Profile view shows updated name

---

### SC-EDIT-002: Update Location - Significant Change Warning

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User's business is located in Tulum, Mexico
- User wants to update location to Cancun, Mexico (> 5km away)

**When:**
- User edits profile and changes address to:
  - "123 Hotel Zone, Cancun, Mexico"
- System geocodes new address
- System calculates distance from old location
- Distance is > 5km

**Then:**
- System displays warning: "Changing your location may affect your visibility to workers looking for jobs in your area."
- System requires confirmation: "Are you sure you want to change your business location?"
- User confirms location change
- System updates location fields
- System logs location change in audit log
- System displays option: "Update location for all existing job postings?"
- **IF** user confirms:
  - System updates all associated job postings with new location
  - System sends notifications to workers who applied to jobs (optional)
- **IF** user declines:
  - Only business profile location is updated
  - Job postings retain original location

---

### SC-EDIT-003: Update Business Description - Character Limit

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is editing business description
- Current description: "A vibrant beachfront bar."

**When:**
- User types a very long description (600 characters)
- User exceeds 500 character limit

**Then:**
- System displays character counter: "520 / 500 characters"
- System shows error: "Description must be 500 characters or less."
- System truncates or prevents additional input at 500 characters
- User cannot save until description is <= 500 characters
- User edits description down to 500 characters
- System allows save

---

### SC-EDIT-004: Concurrent Edit - Optimistic Locking

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User has business profile open on two devices (laptop and phone)
- Both devices show the same version of the profile

**When:**
- User on laptop edits business name and saves
- User on phone edits description (still showing old business name)
- User on phone tries to save changes

**Then:**
- System detects that profile was updated since phone loaded it
- System displays warning: "This profile was updated by another device. Your changes may overwrite newer data. Continue?"
- User chooses:
  - **"Overwrite"**: Phone's changes are saved (last write wins)
  - **"Cancel"**: User can refresh and see laptop's changes, then re-edit

---

## 6. PHOTO MANAGEMENT SCENARIOS

### SC-PHOTO-001: Upload Single Photo

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is creating a new business profile
- User has one business photo ready

**When:**
- User clicks "Upload Photos" button
- File picker opens
- User selects: `bar-exterior.jpg` (2.5MB, JPEG, 1920x1080)
- System uploads file

**Then:**
- System validates file:
  - Format: JPEG ✓
  - Size: 2.5MB (< 5MB) ✓
  - Dimensions: 1920x1080 (> 400x400) ✓
- System generates unique filename: `uuid-123.jpg`
- System uploads to S3:
  - Original: `/business-photos/{id}/original/uuid-123.jpg`
  - Standard: `/business-photos/{id}/standard/uuid-123.jpg` (resized to 1200x675)
  - Thumbnail: `/business-photos/{id}/thumbnails/uuid-123.jpg` (resized to 200x113)
- System stores metadata in database:
  - `file_name`: "uuid-123.jpg"
  - `file_url`: "https://cdn.nomadshift.app/business-photos/..."
  - `thumbnail_url`: "https://cdn.nomadshift.app/business-photos/thumbnails/..."
  - `file_size_bytes`: 2621440
  - `width`: 1920
  - `height`: 1080
  - `upload_order`: 0
  - `is_primary`: TRUE (first photo is primary)
- System displays photo preview in form
- Upload completes within 10 seconds

---

### SC-PHOTO-002: Upload Multiple Photos (Batch)

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is creating business profile
- User wants to upload 5 photos at once

**When:**
- User clicks "Upload Photos"
- User selects 5 files:
  - `photo1.jpg` (1.5MB)
  - `photo2.jpg` (2MB)
  - `photo3.jpg` (3MB)
  - `photo4.jpg` (1MB)
  - `photo5.jpg` (2.5MB)
- User confirms upload

**Then:**
- System validates all 5 files
- System uploads all 5 files in parallel
- System processes all images (resize, compress)
- System stores all metadata in database
- System sets `upload_order`: 0, 1, 2, 3, 4
- System sets first photo (`upload_order`: 0) as primary
- System displays all 5 photos in preview gallery
- Upload completes within 30 seconds (all 5 photos)

---

### SC-PHOTO-003: Upload Exceeds 10 Photo Limit

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User has already uploaded 10 photos to business profile

**When:**
- User tries to upload an 11th photo

**Then:**
- System detects photo count = 10 (maximum reached)
- System displays error: "Maximum 10 photos allowed. Please delete an existing photo before uploading a new one."
- System prevents 11th photo upload
- User must delete a photo to add a new one

---

### SC-PHOTO-004: Upload Invalid File Type

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is uploading business photos

**When:**
- User selects file: `document.pdf` (not an image)
- System attempts to process file

**Then:**
- System validates file type: PDF ✗
- System rejects file
- System displays error: "Photo must be JPEG, PNG, or WEBP format."
- System does NOT upload file to S3
- User must select a valid image file

---

### SC-PHOTO-005: Upload File Too Large

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is uploading business photos

**When:**
- User selects file: `huge-photo.jpg` (8MB)

**Then:**
- System validates file size: 8MB > 5MB limit ✗
- System rejects file
- System displays error: "Photo must be under 5MB. Your photo is 8MB. Please compress the image and try again."
- User must compress or resize image

---

### SC-PHOTO-006: Delete Photo - Minimum 1 Photo Required

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Business profile has only 1 photo

**When:**
- User tries to delete the only photo

**Then:**
- System detects this is the last photo
- System blocks deletion
- System displays error: "At least 1 photo is required for a business profile."
- User cannot delete the photo

---

### SC-PHOTO-007: Reorder Photos

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User has uploaded 5 photos
- Current order: [Photo A, Photo B, Photo C, Photo D, Photo E]

**When:**
- User drags Photo E to position 1
- User drops Photo E at the beginning

**Then:**
- System updates `upload_order` for all photos:
  - Photo E: 0 (was 4)
  - Photo A: 1 (was 0)
  - Photo B: 2 (was 1)
  - Photo C: 3 (was 2)
  - Photo D: 4 (was 3)
- System saves new order to database
- Photo gallery displays new order: [Photo E, Photo A, Photo B, Photo C, Photo D]

---

### SC-PHOTO-008: Set Primary Photo

**Priority:** Should Have
**Status:** Not Started

**Given:**
- User has 5 photos
- Photo A is currently primary

**When:**
- User clicks on Photo C
- User clicks "Set as Primary Photo" button

**Then:**
- System updates Photo C: `is_primary` = TRUE
- System updates Photo A: `is_primary` = FALSE
- Photo C is now displayed first in gallery
- Photo C is used as thumbnail in listings

---

## 7. REPUTATION SYSTEM SCENARIOS

### SC-REP-001: Initial Prestige Level - Bronze

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Business profile is newly created
- No reviews yet

**When:**
- System calculates initial prestige level

**Then:**
- `total_reviews`: 0
- `average_rating`: 0.00
- `prestige_level`: "bronze" (default)
- Bronze badge (🥉) is displayed on profile

---

### SC-REP-002: Prestige Level Progression - Bronze to Silver

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Business has 5 completed jobs
- Average rating is 4.2
- Current prestige level: Bronze

**When:**
- 5th worker review is submitted (4.5 stars)
- System recalculates prestige level

**Then:**
- `total_reviews`: 5
- `average_rating`: 4.2 (weighted average)
- `prestige_level`: "silver" (5-9 reviews AND rating 4.0-4.4)
- Silver badge (🥈) is displayed on profile
- Business owner receives notification: "Congratulations! Your business has reached Silver level!"
- Badge is updated in job listings and search results

---

### SC-REP-003: Prestige Level Progression - Silver to Gold

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Business has 9 completed jobs
- Average rating is 4.6
- Current prestige level: Silver

**When:**
- 10th worker review is submitted (4.7 stars)

**Then:**
- `total_reviews`: 10
- `average_rating`: 4.6
- `prestige_level`: "gold" (10-24 reviews AND rating 4.5-4.7)
- Gold badge (🥇) is displayed
- Business owner receives notification: "Congratulations! Your business has reached Gold level!"

---

### SC-REP-004: Prestige Level Progression - Gold to Platinum

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Business has 24 completed jobs
- Average rating is 4.8
- Current prestige level: Gold

**When:**
- 25th worker review is submitted (5.0 stars)

**Then:**
- `total_reviews`: 25
- `average_rating`: 4.8
- `prestige_level`: "platinum" (25+ reviews AND rating 4.8+)
- Platinum badge (💎) is displayed
- Business owner receives notification: "Congratulations! Your business has reached Platinum level - the highest tier!"

---

### SC-REP-005: Prestige Level Regression

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Business has 15 completed jobs
- Average rating is 4.5
- Current prestige level: Gold

**When:**
- New worker review is submitted with low rating (3.0 stars)
- Average rating drops to 4.3

**Then:**
- `total_reviews`: 16
- `average_rating`: 4.3
- `prestige_level`: Regresses to "silver" (10+ reviews but rating dropped to 4.3)
- Silver badge is now displayed
- Business owner receives notification: "Your business has dropped to Silver level. Maintain higher ratings to reach Gold again."

---

### SC-REP-006: Good Employer Badge - Awarded

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Business has 9 completed jobs
- Average rating is 4.6
- Good Employer badge is not yet awarded

**When:**
- 10th worker review is submitted (4.8 stars)

**Then:**
- `total_reviews`: 10
- `average_rating`: 4.6
- Good Employer criteria met (rating >= 4.5 AND reviews >= 10)
- "Good Employer" badge is awarded:
  - Green checkmark ✅ displayed
  - Text: "Good Employer"
  - Tooltip: "This business has a 4.5+ star rating from 10+ workers"
- Business owner receives notification: "You've earned the Good Employer badge!"
- Badge is displayed in:
  - Business profile header
  - Job posting listings
  - Search results

---

### SC-REP-007: Good Employer Badge - Removed

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Business has Good Employer badge
- 12 reviews, average rating 4.5

**When:**
- New review is submitted with low rating (3.0 stars)
- Average rating drops to 4.4

**Then:**
- `average_rating`: 4.4 < 4.5 threshold
- Good Employer badge criteria NO LONGER met
- "Good Employer" badge is removed from profile
- Business owner receives notification: "Your Good Employer badge has been removed. Maintain a 4.5+ rating to earn it back."

---

## 8. BUSINESS VERIFICATION SCENARIOS

### SC-VER-001: Submit Verification Documents

**Priority:** Should Have
**Status:** Not Started

**Given:**
- Business profile exists and is NOT verified
- User wants to verify their business

**When:**
- User navigates to business profile settings
- User sees "Verify Your Business" section
- User clicks "Start Verification"
- System displays document upload form
- User selects document type: "Business License"
- User uploads PDF: `business-license.pdf` (2MB)
- User uploads second document: `tax-registration.pdf` (1.5MB)
- User clicks "Submit for Verification"

**Then:**
- System validates documents:
  - File types: PDF ✓
  - File sizes: < 10MB ✓
  - Total documents: 2 (max 3) ✓
- System uploads documents to secure S3 bucket (encrypted, not public)
- System creates records in `business_verification_documents`:
  - `verification_status`: "pending"
  - `document_type`: "business_license" / "tax_registration"
  - `file_url`: [private S3 URL]
- System sends notification email to admins
- System displays confirmation: "Verification documents submitted. We will review them within 3-5 business days."
- Business profile shows "Verification Pending" status

---

### SC-VER-002: Admin Approves Verification

**Priority:** Should Have
**Status:** Not Started

**Given:**
- Business verification request is pending
- Admin reviews the submitted documents

**When:**
- Admin navigates to "Pending Verifications" in admin dashboard
- Admin opens business verification request
- Admin reviews uploaded documents
- Admin clicks "Approve Verification"
- Admin adds optional note: "Documents verified successfully"

**Then:**
- System updates `business_verification_documents`:
  - `verification_status`: "approved"
  - `reviewed_by`: [admin_id]
  - `review_date`: [current timestamp]
- System updates `business_profiles`:
  - `is_verified`: TRUE
- System sends approval email to business owner
- Business profile displays "Verified Business" badge with ✓
- Badge appears in listings next to business name

---

### SC-VER-003: Admin Rejects Verification

**Priority:** Should Have
**Status:** Not Started

**Given:**
- Business verification request is pending
- Admin finds documents insufficient or invalid

**When:**
- Admin reviews documents
- Admin determines business license is expired
- Admin clicks "Reject Verification"
- Admin provides reason: "Business license expired on Jan 1, 2025. Please upload a current license."

**Then:**
- System updates `business_verification_documents`:
  - `verification_status`: "rejected"
  - `reviewed_by`: [admin_id]
  - `review_date`: [current timestamp]
  - `rejection_reason`: "Business license expired on Jan 1, 2025. Please upload a current license."
- System sends rejection email to business owner with explanation
- Business profile shows "Verification Rejected" status
- User can re-submit verification with corrected documents

---

### SC-VER-004: Verified Badge Display

**Priority:** Should Have
**Status:** Not Started

**Given:**
- Business is verified (`is_verified`: TRUE)

**When:**
- Any user views business profile or job listing

**Then:**
- "Verified Business" badge is displayed:
  - Blue checkmark icon ✓
  - Text: "Verified Business"
  - Tooltip: "This business has verified their identity with official documents"
- Badge appears in:
  - Business profile header
  - Job posting listings
  - Search results
- Badge is clickable to show verification details (optional)

---

## 9. SECURITY TEST SCENARIOS

### SC-SEC-001: Unauthorized Access - View Another User's Business Profile (Edit)

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User A is authenticated
- User A has business profile ID: business-123
- User B is different authenticated user

**When:**
- User B attempts to edit User A's business profile:
  - User B sends PUT request to /api/business-profiles/business-123

**Then:**
- System validates that User B does not own business-123
- System returns HTTP 403 Forbidden
- System displays error: "You do not have permission to edit this business profile."
- User B cannot modify User A's business profile

---

### SC-SEC-002: SQL Injection Prevention - Business Name

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is creating business profile
- Attacker attempts SQL injection

**When:**
- User enters business name: "'; DROP TABLE business_profiles; --"

**Then:**
- System sanitizes input
- System uses parameterized queries or ORM
- SQL injection attempt fails
- Business name is stored as literal string: "'; DROP TABLE business_profiles; --"
- Database is NOT compromised
- Profile is created successfully (though with unusual name)

---

### SC-SEC-003: XSS Prevention - Business Description

**Priority:** Must Have
**Status:** Not Started

**Given:**
- User is creating business profile
- Attacker attempts XSS attack

**When:**
- User enters description: "<script>alert('XSS')</script> Great bar!"

**Then:**
- System sanitizes input
- System escapes HTML entities
- Description stored as: "&lt;script&gt;alert('XSS')&lt;/script&gt; Great bar!"
- When description is displayed on profile:
  - Script does NOT execute
  - Text displays as literal: "<script>alert('XSS')</script> Great bar!"
  - No alert popup appears
- System is NOT compromised

---

### SC-SEC-004: File Upload Attack - Malicious File

**Priority:** Must Have
**Status:** Not Started

**Given:**
- Attacker is uploading "business photo"

**When:**
- Attacker uploads file: `malicious.php.jpg` (actually a PHP script with .jpg extension)

**Then:**
- System validates file by magic bytes (not just extension)
- System detects file is NOT a valid image
- System rejects file
- System displays error: "Invalid image file."
- File is NOT uploaded to S3
- Attack is thwarted

---

### SC-SEC-005: Photo Upload Rate Limiting

**Priority:** Should Have
**Status:** Not Started

**Given:**
- Attacker attempts to abuse photo upload system
- User tries to upload 100 photos rapidly

**When:**
- User uploads 10 photos (within limit)
- User attempts to upload 11th photo immediately after

**Then:**
- System detects upload rate exceeded
- System returns HTTP 429 Too Many Requests
- System displays error: "Too many upload attempts. Please wait before trying again."
- Attacker cannot abuse storage or bandwidth

---

## 10. QUALITY GATE CRITERIA

### 10.1 Functional Completeness

**Must Have Criteria (ALL must pass):**

- [ ] Business owners can create a complete business profile with all required fields
- [ ] Geolocation validation works for valid addresses
- [ ] Invalid addresses are rejected with helpful error messages
- [ ] Business owners can upload 1-10 photos successfully
- [ ] Photo validation (type, size) works correctly
- [ ] Business owners can edit all editable fields
- [ ] Multiple business locations can be managed from one account
- [ ] Business owners can switch between their business profiles
- [ ] Prestige levels calculate correctly based on reviews
- [ ] "Good Employer" badge is awarded/removed correctly
- [ ] Business verification workflow functions end-to-end
- [ ] Admins can approve/reject verification requests
- [ ] Verified badge displays correctly on profiles

**Should Have Criteria (at least 80% must pass):**

- [ ] Map preview displays during profile creation
- [ ] Users can drag map pin to adjust location
- [ ] Photo reordering works smoothly
- [ ] Primary photo can be set/changed
- [ ] Character counter displays for description field
- [ ] Location change warning appears for significant location updates
- [ ] Concurrent edit detection works (optimistic locking)
- [ ] Businesses can be marked as "primary"
- [ ] Verification documents are stored securely (encrypted S3)

---

### 10.2 Performance Requirements

**ALL must pass:**

- [ ] Business profile creation API responds within 2 seconds (p95)
- [ ] Business profile update API responds within 1 second (p95)
- [ ] Photo upload completes within 10 seconds per photo (p95)
- [ ] Geocoding request completes within 2 seconds (p95)
- [ ] Business profile page loads within 3 seconds (p95)
- [ ] Photo gallery loads within 2 seconds (p95)
- [ ] Map preview loads within 3 seconds (p95)
- [ ] Prestige level calculation takes < 100ms
- [ ] System can handle 100 concurrent profile creations without degradation

---

### 10.3 Security Requirements

**ALL must pass:**

- [ ] Users can only edit their own business profiles (authorization check)
- [ ] SQL injection attacks are prevented
- [ ] XSS attacks are prevented
- [ ] CSRF protection is implemented
- [ ] File upload validation prevents malicious files
- [ ] Photo storage uses S3 with proper access controls (no public listing)
- [ ] Verification documents are stored in secure/encrypted storage
- [ ] Rate limiting is implemented for API endpoints
- [ ] Input validation is enforced on all fields
- [ ] Sensitive data (documents) are not publicly accessible

---

### 10.4 Usability Requirements

**ALL must pass:**

- [ ] Profile creation form is intuitive (no user confusion in testing)
- [ ] Error messages are clear and actionable
- [ ] Required fields are clearly marked
- [ ] Character limits are displayed with counters
- [ ] Photo upload progress is visible
- [ ] Map interface is responsive and easy to use
- [ ] Photo gallery is easy to navigate
- [ ] Mobile interface is responsive and touch-friendly
- [ ] Forms provide real-time validation feedback
- [ ] Success messages confirm actions clearly

---

### 10.5 Accessibility Requirements

**ALL must pass (WCAG 2.1 Level AA):**

- [ ] All form inputs have associated labels
- [ ] Error messages are announced by screen readers
- [ ] Color is NOT the only means of conveying information
- [ ] Touch targets are at least 44x44 pixels (mobile)
- [ ] Keyboard navigation works for all profile management flows
- [ ] Focus indicators are visible
- [ ] Map has alternative text description for location
- [ ] Photos have alt text or are marked as decorative

---

### 10.6 Testing Requirements

**ALL must pass:**

- [ ] Unit test coverage >= 80% for business profile services
- [ ] All business profile creation scenarios (SC-BIZ-001 to SC-BIZ-004) pass
- [ ] All geolocation scenarios (SC-GEO-001 to SC-GEO-005) pass
- [ ] All multiple location scenarios (SC-MULTI-001 to SC-MULTI-005) pass
- [ ] All profile editing scenarios (SC-EDIT-001 to SC-EDIT-004) pass
- [ ] All photo management scenarios (SC-PHOTO-001 to SC-PHOTO-008) pass
- [ ] All reputation scenarios (SC-REP-001 to SC-REP-007) pass
- [ ] All verification scenarios (SC-VER-001 to SC-VER-004) pass
- [ ] All security test scenarios (SC-SEC-001 to SC-SEC-005) pass

---

### 10.7 Documentation Requirements

**ALL must pass:**

- [ ] API documentation (OpenAPI/Swagger) is complete
- [ ] All business profile endpoints are documented
- [ ] Request/response examples are provided
- [ ] Error codes are documented
- [ ] User-facing help documentation exists:
  - How to create a business profile
  - How to upload and manage photos
  - How to verify a business
  - How to manage multiple locations
- [ ] Developer documentation exists:
  - Photo upload guide
  - Geocoding integration guide
  - Prestige level calculation logic

---

### 10.8 Deployment Readiness

**ALL must pass:**

- [ ] Database migrations are tested and reversible
- [ ] S3 buckets are created and configured with proper CORS
- [ ] CloudFront CDN distribution is set up
- [ ] Google Maps API key is configured and quota is set
- [ ] Image processing (Sharp) is configured and tested
- [ ] Monitoring and logging are configured:
  - Photo upload success/failure logs
  - Geocoding API usage logs
  - Profile creation metrics
- [ ] CI/CD pipeline is configured
- [ ] Rollback plan is documented

---

### 10.9 Final Sign-Off Checklist

**Before SPEC-BIZ-001 can be marked as COMPLETE:**

- [ ] All Must Have acceptance criteria pass
- [ ] At least 80% of Should Have criteria pass
- [ ] Security audit is completed with no critical findings
- [ ] Performance testing meets all targets
- [ ] User acceptance testing (UAT) is completed
- [ ] Bug fixes are implemented and verified
- [ ] Documentation is complete and reviewed
- [ ] Deployment plan is approved
- [ ] Stakeholders (Product Owner, Tech Lead) have signed off

---

**End of Acceptance Criteria**
