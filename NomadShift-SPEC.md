# NomadShift - Software Requirements Specification (SRS)

**Version:** 1.0
**Date:** February 3, 2026
**Status:** Draft
**Document Owner:** NomadShift Product Team

---

## Table of Contents

1. [Document Information](#document-information)
2. [Introduction](#introduction)
3. [System Overview](#system-overview)
4. [Actors and User Roles](#actors-and-user-roles)
5. [Functional Requirements](#functional-requirements)
6. [Non-Functional Requirements](#non-functional-requirements)
7. [Constraints](#constraints)
8. [Assumptions and Dependencies](#assumptions-and-dependencies)
9. [User Stories](#user-stories)
10. [Future Extensions](#future-extensions)
11. [Glossary](#glossary)

---

## 1. Document Information

| Field | Value |
|-------|-------|
| Project Name | NomadShift |
| Alternative Names | CulturaWork, NomadWork, ShiftCulture |
| Document Type | Software Requirements Specification (SRS) |
| Requirements Format | EARS (Easy Approach to Requirements Syntax) |
| Target Platforms | Mobile (iOS/Android), Web (PWA) |
| Primary Languages | English, Spanish |

---

## 2. Introduction

### 2.1 Purpose

This document defines the complete requirements for **NomadShift**, a dual-sided marketplace platform connecting temporary workers (digital nomads and long-term travelers) with small-to-medium business owners (bars, restaurants, boutiques, hostels, cafes) for short-term work engagements.

### 2.2 Scope

**IN SCOPE:**
- User registration and authentication for both worker and employer roles
- Profile creation and management with verification capabilities
- Job posting and discovery with location-based matching
- In-app messaging between employers and workers
- Review and rating system with prestige/gamification layers
- Legal agreement acceptance workflow
- Multi-language support (EN/ES minimum)
- Mobile-first responsive design

**OUT OF SCOPE (v1.0):**
- Payment processing or financial transactions
- Payroll, tax filing, or employment administration
- Background checks or government ID verification
- Video calling (external tools to be used)
- Advanced analytics dashboard

### 2.3 Definitions, Acronyms, and Abbreviations

- **EARS**: Easy Approach to Requirements Syntax
- **PWA**: Progressive Web Application
- **GDPR**: General Data Protection Regulation
- **SMB**: Small-to-Medium Business
- **MVP**: Minimum Viable Product

---

## 3. System Overview

### 3.1 Vision Statement

To create the world's most trusted platform for culturally-enriching temporary work experiences, enabling travelers to fund their journeys while local businesses access flexible, enthusiastic talent.

### 3.2 Value Proposition

**For Digital Nomads:**
- Earn income while traveling
- Access authentic local experiences
- Build cultural competence and language skills
- Gain a portable professional reputation

**For Business Owners:**
- Access flexible staff without administrative complexity
- Bring cultural diversity to their workplace
- Find motivated short-term workers quickly
- Reduce hiring friction and costs

### 3.3 System Context

```
┌─────────────────────────────────────────────────────────────┐
│                         EXTERNAL SYSTEMS                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Google     │  │    Apple     │  │   Email      │      │
│  │   OAuth      │  │    OAuth     │  │   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │  NomadShift │                          │
│                    │   Platform  │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│  ┌──────────┐  ┌──────────┴──────────┐  ┌──────────────┐  │
│  │   iOS    │  │       Web/PWA       │  │   Android    │  │
│  │   App    │  │       Browser       │  │    App       │  │
│  └──────────┘  └─────────────────────┘  └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Actors and User Roles

### 4.1 Primary Actors

#### 4.1.1 Business Owner (Employer)

**Description:** Owner or manager of a small/medium business seeking temporary staff.

**Responsibilities:**
- Create and manage business profile
- Post job vacancies with requirements
- Review candidate profiles and applications
- Communicate with potential hires
- Complete work agreements and leave reviews

**Access Rights:**
- CRUD operations on own business profile
- CRUD operations on own job postings
- Read-only access to candidate profiles
- Messaging with applicants
- Review submission for completed work

#### 4.1.2 Nomad Worker

**Description:** Digital nomad or long-term traveler seeking temporary work opportunities.

**Responsibilities:**
- Create and manage personal profile
- Search and apply for job vacancies
- Communicate with potential employers
- Complete work agreements
- Receive and build reputation through reviews

**Access Rights:**
- CRUD operations on own worker profile
- Read-only access to job postings
- Apply to open positions
- Messaging with employers
- Review submission for completed work
- View own reputation metrics

#### 4.1.3 Platform Administrator

**Description:** System administrator managing platform operations.

**Responsibilities:**
- Review and moderate reported content
- Manage user disputes
- Access platform analytics
- Configure system settings

**Access Rights:**
- Full system access
- User account management
- Content moderation
- Dispute resolution

### 4.2 Secondary Actors

#### 4.2.1 Email Service Provider
- Delivers transactional emails and notifications

#### 4.2.2 Push Notification Service
- Delivers real-time mobile notifications

#### 4.2.3 OAuth Providers (Google, Apple)
- Provide third-party authentication

---

## 5. Functional Requirements

### 5.1 User Authentication and Onboarding

**REQ-AUTH-001:** The system SHALL allow user registration via email address and password.

**REQ-AUTH-002:** The system SHALL allow user registration via Google OAuth.

**REQ-AUTH-003:** The system SHALL allow user registration via Apple Sign-In.

**REQ-AUTH-004:** The system SHALL require email verification before account activation.

**REQ-AUTH-005:** The system SHALL allow users to select their role type (Business Owner OR Nomad Worker) during registration.

**REQ-AUTH-006:** The system SHALL allow users to switch between roles (if they have both business and worker profiles).

**REQ-AUTH-007:** The system SHALL require users to accept the Terms of Service and Privacy Policy before account creation.

**REQ-AUTH-008:** The system SHALL implement password reset functionality via email.

**REQ-AUTH-009:** The system SHOULD support biometric authentication (Face ID, Touch ID, fingerprint) on mobile devices.

**REQ-AUTH-010:** The system SHALL implement session timeout after 30 days of inactivity.

### 5.2 Business Profile Management

**REQ-BIZ-001:** The system SHALL allow business owners to create a business profile containing:
- Business name
- Business type (restaurant, bar, cafe, boutique, hostel, etc.)
- Geographic location (address + coordinates)
- Business photos (minimum 1, maximum 10)
- Business description (max 500 characters)
- Contact information

**REQ-BIZ-002:** The system SHALL validate business location via geolocation services.

**REQ-BIZ-003:** The system SHALL allow business owners to add multiple business locations under one account.

**REQ-BIZ-004:** The system SHALL allow business owners to edit their business profile at any time.

**REQ-BIZ-005:** The system SHALL display business prestige level based on worker reviews.

**REQ-BIZ-006:** The system SHALL maintain a "Good Employer" badge for businesses with 4.5+ average rating and 10+ reviews.

**REQ-BIZ-007:** The system MAY allow business profile verification via business document upload.

### 5.3 Job Posting Management

**REQ-JOB-001:** The system SHALL allow business owners to create job postings containing:
- Job title
- Job category (bartender, kitchen staff, server, housekeeping, retail, etc.)
- Job description (max 1000 characters)
- Duration estimate (days, weeks, or months)
- Expected work schedule (part-time, full-time, flexible)
- Compensation (hourly rate, daily rate, or fixed amount)
- Required languages and proficiency levels
- Required experience level (none, basic, intermediate, advanced)
- Start date (or "immediately")
- End date (or "open-ended")

**REQ-JOB-002:** The system SHALL allow business owners to set job posting status as: active, paused, or closed.

**REQ-JOB-003:** The system SHALL auto-close job postings after the end date has passed.

**REQ-JOB-004:** The system SHALL allow business owners to edit active job postings.

**REQ-JOB-005:** The system SHALL display the number of applicants for each job posting to the business owner.

**REQ-JOB-006:** The system SHALL allow business owners to duplicate previous job postings for quick re-posting.

**REQ-JOB-007:** The system SHALL send notifications to business owners when new candidates apply.

**REQ-JOB-008:** The system SHOULD suggest compensation ranges based on job type and location.

### 5.4 Worker Profile Management

**REQ-WKR-001:** The system SHALL allow workers to create a personal profile containing:
- Profile photo
- Full name (or preferred display name)
- Nationality
- Languages spoken with self-assessed proficiency (CEFR levels: A1-C2)
- Brief bio (max 500 characters)
- Countries visited
- Skills/tags (e.g., "customer service," "coffee brewing," "social media")

**REQ-WKR-002:** The system SHALL allow workers to add previous work experiences with:
- Business name (optional)
- Job role
- Duration
- Description of responsibilities
- Option to mark as "verified by employer"

**REQ-WKR-003:** The system SHALL allow workers to specify job preferences:
- Preferred job types
- Minimum/maximum duration preference
- Expected salary range
- Preferred geographic locations

**REQ-WKR-004:** The system SHALL display worker prestige level based on reviews.

**REQ-WKR-005:** The system SHALL calculate worker prestige levels as:
- Bronze: 0-4 completed jobs OR rating < 4.0
- Silver: 5-9 completed jobs AND rating 4.0-4.4
- Gold: 10-24 completed jobs AND rating 4.5-4.7
- Platinum: 25+ completed jobs AND rating 4.8+

**REQ-WKR-006:** The system SHALL allow workers to set their current location and future travel plans.

**REQ-WKR-007:** The system SHALL allow workers to edit their profile at any time.

### 5.5 Job Discovery and Search

**REQ-SEARCH-001:** The system SHALL allow workers to search for jobs by:
- Geographic location (current location or specified location)
- Distance radius from location (5km, 10km, 25km, 50km, 100km)
- Job category
- Start date
- Duration
- Compensation range
- Required language
- Worker's language proficiency

**REQ-SEARCH-002:** The system SHALL display search results with:
- Job title and business name
- Location
- Compensation
- Duration
- Required languages
- Business rating
- Distance from worker (if location enabled)

**REQ-SEARCH-003:** The system SHALL allow workers to save search filters for future use.

**REQ-SEARCH-004:** The system SHALL allow workers to "save" or "favorite" job postings.

**REQ-SEARCH-005:** The system SHALL display job postings on an interactive map.

**REQ-SEARCH-006:** The system SHALL recommend jobs based on worker's profile and preferences.

**REQ-SEARCH-007:** The system SHALL show a "match score" indicating how well a job fits the worker's profile.

### 5.6 Application and Hiring Workflow

**REQ-APP-001:** The system SHALL allow workers to submit an application to a job posting with:
- A brief message (max 500 characters)
- Optional: selected answers to employer's screening questions

**REQ-APP-002:** The system SHALL notify business owners of new applications.

**REQ-APP-003:** The system SHALL allow business owners to view applicant profiles including:
- Profile photo and bio
- Languages spoken
- Previous experience
- Reviews and ratings
- Prestige level

**REQ-APP-004:** The system SHALL allow business owners to accept or reject applications.

**REQ-APP-005:** The system SHALL notify workers of application status changes.

**REQ-APP-006:** The system SHALL allow business owners and workers to message each other after an application is submitted.

**REQ-APP-007:** The system SHALL allow either party to initiate a "work agreement" proposal.

**REQ-APP-008:** The system SHALL require both parties to digitally confirm the work agreement before the job starts.

**REQ-APP-009:** The system SHALL create a work agreement record containing:
- Job title and description
- Start date and end date
- Expected schedule
- Agreed compensation
- Responsibilities
- Both parties' digital signatures (timestamp + confirmation)

### 5.7 Messaging System

**REQ-MSG-001:** The system SHALL provide an in-app messaging system between business owners and workers.

**REQ-MSG-002:** The system SHALL only allow messaging after a worker has applied to a job or a business has invited a worker.

**REQ-MSG-003:** The system SHALL support text messages and emojis.

**REQ-MSG-004:** The system SHALL support image sharing in messages.

**REQ-MSG-005:** The system SHALL display message read receipts.

**REQ-MSG-006:** The system SHALL send push notifications for new messages.

**REQ-MSG-007:** The system SHALL archive message threads automatically after 90 days of inactivity.

**REQ-MSG-008:** The system SHALL NOT allow deleting messages (only archiving).

**REQ-MSG-009:** The system MAY support audio messages in future versions.

### 5.8 Reviews and Reputation System

**REQ-REV-001:** The system SHALL require both parties to submit a review within 14 days after work agreement end date.

**REQ-REV-002:** The system SHALL allow only one review per work agreement (bidirectional).

**REQ-REV-003:** The system SHALL make reviews visible only after BOTH parties have submitted their reviews, OR after 14 days have passed (whichever comes first).

**REQ-REV-004:** The system SHALL require reviews to include:
- Star rating (1-5 stars)
- Written comment (minimum 20 characters, maximum 500 characters)
- Optional: specific attributes rating (communication, punctuality, quality of work, attitude)

**REQ-REV-005:** The system SHALL calculate aggregate ratings based on all reviews.

**REQ-REV-006:** The system SHALL display the number of completed jobs alongside ratings.

**REQ-REV-007:** The system SHALL allow users to flag inappropriate reviews for moderator review.

**REQ-REV-008:** The system SHALL allow responses to reviews (one response allowed per review).

**REQ-REV-009:** The system SHALL suspend users with average rating below 2.5 after 5+ reviews.

### 5.9 Legal and Compliance

**REQ-LEG-001:** The system SHALL require users to accept the following agreements before posting jobs or applying:
- Temporary Work Agreement Terms
- Platform Liability Waiver (platform is NOT the employer)
- Cancellation and Refund Policy
- Dispute Resolution Policy
- Data Protection Agreement (GDPR-compliant)
- Prohibited Activities Policy

**REQ-LEG-002:** The system SHALL record timestamp and IP address for each legal agreement acceptance.

**REQ-LEG-003:** The system SHALL prohibit the following content:
- Job postings for illegal activities
- Discriminatory language or requirements
- Harassment or hate speech
- False or misleading information
- Solicitation of services outside the platform

**REQ-LEG-004:** The system SHALL allow users to report policy violations.

**REQ-LEG-005:** The system SHALL allow administrators to suspend or ban users who violate policies.

**REQ-LEG-006:** The system SHALL maintain an audit log of all user agreements and policy acceptances.

**REQ-LEG-007:** The system SHALL provide users the right to export their personal data (GDPR compliance).

**REQ-LEG-008:** The system SHALL allow users to permanently delete their account and associated data.

### 5.10 Notifications

**REQ-NOT-001:** The system SHALL send push notifications for:
- New job applications (to business owners)
- Application status changes (to workers)
- New messages
- New reviews received
- Work agreement confirmations
- Work agreement ending soon

**REQ-NOT-002:** The system SHALL send email notifications for:
- Account verification
- Password reset
- Weekly digest of new matching opportunities
- Important platform updates

**REQ-NOT-003:** The system SHALL allow users to customize notification preferences by type.

**REQ-NOT-004:** The system SHALL allow users to set "quiet hours" for push notifications.

**REQ-NOT-005:** The system SHOULD use intelligent notification batching to reduce notification fatigue.

### 5.11 Multi-Language Support

**REQ-LANG-001:** The system SHALL support English and Spanish in version 1.0.

**REQ-LANG-002:** The system SHOULD support French and Portuguese in future versions.

**REQ-LANG-003:** The system SHALL allow users to select their preferred language during onboarding.

**REQ-LANG-004:** The system SHALL allow users to change language preference at any time.

**REQ-LANG-005:** The system SHALL display job postings in their original language with an option to auto-translate.

**REQ-LANG-006:** The system SHALL indicate language proficiency requirements using CEFR standards (A1-C2).

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements

**REQ-NFR-PERF-001:** The system SHALL load any page within 3 seconds under normal network conditions (4G).

**REQ-NFR-PERF-002:** The system SHALL support up to 10,000 concurrent users without performance degradation.

**REQ-NFR-PERF-003:** The system SHALL return search results within 2 seconds.

**REQ-NFR-PERF-004:** The system SHALL send push notifications within 5 seconds of trigger event.

**REQ-NFR-PERF-005:** The system SHALL have 99.5% uptime availability.

**REQ-NFR-PERF-006:** The system SHALL complete image uploads within 10 seconds.

### 6.2 Security Requirements

**REQ-NFR-SEC-001:** The system SHALL encrypt all data in transit using TLS 1.3 or higher.

**REQ-NFR-SEC-002:** The system SHALL hash passwords using bcrypt or Argon2 with minimum 12 rounds.

**REQ-NFR-SEC-003:** The system SHALL implement rate limiting on authentication endpoints (max 5 attempts per 15 minutes).

**REQ-NFR-SEC-004:** The system SHALL implement CSRF protection for all state-changing operations.

**REQ-NFR-SEC-005:** The system SHALL sanitize all user inputs to prevent XSS attacks.

**REQ-NFR-SEC-006:** The system SHALL implement API rate limiting (100 requests per minute per user).

**REQ-NFR-SEC-007:** The system SHALL log all authentication attempts and failures.

**REQ-NFR-SEC-008:** The system SHALL implement two-factor authentication (optional but recommended).

### 6.3 Usability Requirements

**REQ-NFR-USAB-001:** The system SHALL be mobile-first responsive design.

**REQ-NFR-USAB-002:** The system SHALL follow WCAG 2.1 Level AA accessibility guidelines.

**REQ-NFR-USAB-003:** The system SHALL support iOS 14+ and Android 10+.

**REQ-NFR-USAB-004:** The system SHALL function as a Progressive Web App (PWA) for web users.

**REQ-NFR-USAB-005:** The system SHALL provide onboarding tutorial for first-time users.

**REQ-NFR-USAB-006:** The system SHALL use clear, non-technical language in UI labels.

**REQ-NFR-USAB-007:** The system SHALL support offline mode for viewing saved content.

### 6.4 Scalability Requirements

**REQ-NFR-SCAL-001:** The system SHALL be designed to scale to 100,000 users within 12 months.

**REQ-NFR-SCAL-002:** The system SHALL use auto-scaling cloud infrastructure.

**REQ-NFR-SCAL-003:** The system SHALL implement database indexing for all frequently queried fields.

**REQ-NFR-SCAL-004:** The system SHALL use CDN for static asset delivery.

**REQ-NFR-SCAL-005:** The system SHALL implement caching strategy with Redis or similar.

### 6.5 Maintainability Requirements

**REQ-NFR-MAINT-001:** The system SHALL have API documentation (OpenAPI/Swagger).

**REQ-NFR-MAINT-002:** The system SHALL have automated test coverage minimum 70%.

**REQ-NFR-MAINT-003:** The system SHALL implement structured logging.

**REQ-NFR-MAINT-004:** The system SHALL have CI/CD pipeline for deployments.

**REQ-NFR-MAINT-005:** The system SHALL separate frontend, backend, and database layers.

### 6.6 Reliability Requirements

**REQ-NFR-REL-001:** The system SHALL implement database replication for disaster recovery.

**REQ-NFR-REL-002:** The system SHALL perform daily automated backups.

**REQ-NFR-REL-003:** The system SHALL have RPO (Recovery Point Objective) of 1 hour.

**REQ-NFR-REL-004:** The system SHALL have RTO (Recovery Time Objective) of 4 hours.

**REQ-NFR-REL-005:** The system SHALL implement graceful degradation during partial outages.

---

## 7. Constraints

### 7.1 Technical Constraints

**CON-TECH-001:** The system must be built using technologies supported by the development team's expertise.

**CON-TECH-002:** The system must integrate with Google and Apple OAuth APIs.

**CON-TECH-003:** The system must comply with Apple App Store and Google Play Store guidelines.

**CON-TECH-004:** The system must support both iOS and Android native apps or a cross-platform solution.

### 7.2 Legal Constraints

**CON-LEG-001:** The system must comply with GDPR for EU users.

**CON-LEG-002:** The system must comply with local labor laws in target markets (platform acts as connector, not employer).

**CON-LEG-003:** The system must not facilitate illegal work arrangements (e.g., undeclared labor, visa violations).

**CON-LEG-004:** The system must comply with California Consumer Privacy Act (CCPA) for California residents.

### 7.3 Business Constraints

**CON-BIZ-001:** The system must NOT process payments in version 1.0 (payment arrangement is between parties).

**CON-BIZ-002:** The system must not charge for job postings in version 1.0.

**CON-BIZ-003:** The business model must allow for future premium features (subscriptions, featured listings).

**CON-BIZ-004:** Marketing budget is limited; platform should leverage word-of-mouth and community growth.

### 7.4 Time Constraints

**CON-TIME-001:** MVP must be launched within 6 months.

**CON-TIME-002:** Initial focus markets: 3-5 tourist destinations (e.g., Bali, Medellín, Lisbon, Tulum, Mexico City).

### 7.5 Geographic Constraints

**CON-GEO-001:** Initial launch limited to countries with high digital nomad populations.

**CON-GEO-002:** Platform must support metric and imperial units based on user location.

---

## 8. Assumptions and Dependencies

### 8.1 Assumptions

**ASM-001:** Users have access to smartphones or internet-connected devices.

**ASM-002:** Users have basic digital literacy to use mobile apps.

**ASM-003:** Business owners have basic English proficiency or translation tools.

**ASM-004:** Digital nomads target market continues to grow post-pandemic.

**ASM-005:** Small businesses are open to flexible staffing solutions.

**ASM-006:** Users will provide honest reviews and ratings.

**ASM-007:** Platform liability waivers will be legally enforceable in target markets.

**ASM-008:** Most users will have stable internet connectivity when using the platform.

### 8.2 Dependencies

**DEP-001:** Third-party OAuth providers (Google, Apple) maintain their APIs.

**DEP-002:** Mapping services (Google Maps or Mapbox) for location features.

**DEP-003:** Push notification services (Firebase Cloud Messaging, Apple Push Notification Service).

**DEP-004:** Email service provider (SendGrid, AWS SES, or similar).

**DEP-005:** Cloud infrastructure provider (AWS, GCP, or Azure).

**DEP-006:** App store approval processes complete without significant delays.

---

## 9. User Stories

### 9.1 Business Owner Stories

**US-BIZ-001:** As a business owner, I want to quickly post a job opening so I can find staff for tomorrow's shift.

**US-BIZ-002:** As a business owner, I want to see candidate reviews and ratings so I can trust the person I'm hiring.

**US-BIZ-003:** As a business owner, I want to message candidates within the app so I don't have to share personal contact info.

**US-BIZ-004:** As a business owner, I want to leave an honest review after a worker completes a job so other businesses know what to expect.

**US-BIZ-005:** As a business owner, I want to pause a job posting if I found someone so I don't get more applications.

### 9.2 Nomad Worker Stories

**US-NOM-001:** As a nomad, I want to find jobs near my current location so I can earn money during my stay.

**US-NOM-002:** As a nomad, I want to see what language is required for a job so I know if I'm qualified.

**US-NOM-003:** As a nomad, I want to build my reputation through reviews so I can access better opportunities.

**US-NOM-004:** As a nomad, I want to filter jobs by duration so I can find work that fits my travel schedule.

**US-NOM-005:** As a nomad, I want to save interesting jobs for later so I can apply when I'm ready.

**US-NOM-006:** As a nomad, I want to see the business rating and reviews before applying so I know it's a safe workplace.

### 9.3 Platform Administrator Stories

**US-ADM-001:** As an admin, I want to review reported content so I can maintain a safe platform.

**US-ADM-002:** As an admin, I want to view platform analytics so I can understand user behavior.

**US-ADM-003:** As an admin, I want to resolve disputes between users so both parties feel heard.

---

## 10. Future Extensions

### 10.1 Phase 2 Features (Post-MVP)

**FEAT-001:** **Payment Processing** - Integrated payment handling with escrow protection.

**FEAT-002:** **Video Calls** - In-app video interviewing capability.

**FEAT-003:** **Advanced Verification** - ID verification, work permit checks.

**FEAT-004:** **Premium Subscriptions** - Paid tier with enhanced features (featured listings, advanced analytics).

**FEAT-005:** **Skill Badges** - Verified skill testing or certification integration.

**FEAT-006:** **Travel Planner Integration** - Connect with travel booking platforms.

**FEAT-007:** **Community Features** - Forums, events, meetups for nomads.

**FEAT-008:** **Employer Branding** - Enhanced business profiles with video, team culture.

**FEAT-009:** **AI Matching** - Machine learning-based job-candidate compatibility scoring.

**FEAT-010:** **Multi-Currency Support** - Display compensation in local currencies.

### 10.2 Phase 3 Features (Long-term Vision)

**FEAT-011:** **Visa/Documentation Assistance** - Guidance for work visas and permits.

**FEAT-012:** **Insurance Integration** - Short-term work insurance options.

**FEAT-013:** **Nomad Community Rating** - Overall community trust score.

**FEAT-014:** **B2B Enterprise Version** - For larger hospitality chains.

**FEAT-015:** **API for Integrations** - Allow HR tools to integrate with NomadShift.

**FEAT-016:** **AR/VR Business Previews** - Virtual workplace tours.

**FEAT-017:** **Social Impact Tracking** - Measure cultural exchange impact.

**FEAT-018:** **Nomad Passport** - Portable work credentials across countries.

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **Business Owner** | User who posts jobs and hires temporary workers |
| **Nomad Worker** | User who seeks temporary work while traveling |
| **Work Agreement** | Digital contract between business and worker for a specific job |
| **Prestige Level** | Tiered reputation system (Bronze, Silver, Gold, Platinum) |
| **Good Employer Badge** | Visual indicator for highly-rated businesses |
| **CEFR** | Common European Framework of Reference for Languages (A1-C2) |
| **GDPR** | General Data Protection Regulation (EU data protection law) |
| **PWA** | Progressive Web App - web app with native-like capabilities |
| **OAuth** | Open standard for access delegation (used for "Sign in with Google/Apple") |
| **MVP** | Minimum Viable Product - initial functional version |
| **SMB** | Small-to-Medium Business |
| **SRS** | Software Requirements Specification |
| **EARS** | Easy Approach to Requirements Syntax |
| **RPO** | Recovery Point Objective - maximum data loss tolerance |
| **RTO** | Recovery Time Objective - maximum downtime tolerance |
| **CSRF** | Cross-Site Request Forgery - security attack type |
| **XSS** | Cross-Site Scripting - security attack type |
| **TLS** | Transport Layer Security - encryption protocol |

---

## 12. Appendices

### Appendix A: Priority Matrix

| Requirement ID | Priority | rationale |
|----------------|----------|-----------|
| REQ-AUTH-001 to REQ-AUTH-007 | HIGH | Core authentication needed |
| REQ-BIZ-001, REQ-JOB-001 | HIGH | Essential for business users |
| REQ-WKR-001, REQ-SEARCH-001 | HIGH | Essential for worker users |
| REQ-APP-001 to REQ-APP-009 | HIGH | Core hiring workflow |
| REQ-REV-001 to REQ-REV-006 | HIGH | Trust/reputation is core value prop |
| REQ-MSG-001 to REQ-MSG-006 | MEDIUM | Important but external messaging possible |
| REQ-SEARCH-005 (map) | MEDIUM | Nice-to-have, not critical |
| REQ-LANG-002 (French/Portuguese) | LOW | Can be added post-MVP |
| FEAT-001 to FEAT-010 | LOW | Phase 2 features |

### Appendix B: Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Monthly Active Users (MAU) | 5,000 | 6 months post-launch |
| Job-to-Hire Conversion Rate | 20% | 6 months post-launch |
| Average User Rating | 4.2+ stars | Ongoing |
| User Retention (30-day) | 40% | 6 months post-launch |
| Average Time-to-Hire | <7 days | 6 months post-launch |
| Review Completion Rate | 80% | Ongoing |

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 3, 2026 | Product Team | Initial SRS creation |

---

**Approval Signatures:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Business Stakeholder | | | |

---

*End of Document*
