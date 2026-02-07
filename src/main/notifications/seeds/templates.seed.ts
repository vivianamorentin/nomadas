import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed predefined notification templates
 * SPEC-NOT-001 Phase 2
 */
async function seedNotificationTemplates() {
  console.log('Seeding notification templates...');

  const templates = [
    // Job Application Notifications
    {
      type: NotificationType.JOB_APPLICATION_RECEIVED,
      language: 'en',
      subject: 'New Job Application Received',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Job Application Received</h2>
          <p>Hello {{userName}},</p>
          <p>You have received a new job application for <strong>{{jobTitle}}</strong>.</p>
          <p><strong>Applicant:</strong> {{workerName}}</p>
          <p>You can view the full application details in your dashboard.</p>
          <a href="{{applicationUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Application</a>
        </div>
      `,
      textBody: 'Hello {{userName}},\n\nYou have received a new job application for {{jobTitle}}.\n\nApplicant: {{workerName}}\n\nView application: {{applicationUrl}}',
      pushTitle: 'New Application',
      pushBody: '{{workerName}} applied for {{jobTitle}}',
      inAppTemplate: '{{workerName}} applied for {{jobTitle}}',
      variables: { userName: 'string', jobTitle: 'string', workerName: 'string', applicationUrl: 'string' },
    },
    {
      type: NotificationType.APPLICATION_STATUS_CHANGED,
      language: 'en',
      subject: 'Application Status Updated',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Application Status Updated</h2>
          <p>Hello {{userName}},</p>
          <p>Your application for <strong>{{jobTitle}}</strong> at <strong>{{businessName}}</strong> has been updated.</p>
          <p><strong>New Status:</strong> {{newStatus}}</p>
          <a href="{{applicationUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Application</a>
        </div>
      `,
      textBody: 'Hello {{userName}},\n\nYour application for {{jobTitle}} at {{businessName}} has been updated.\n\nNew Status: {{newStatus}}\n\nView application: {{applicationUrl}}',
      pushTitle: 'Application Updated',
      pushBody: 'Your application for {{jobTitle}} is now {{newStatus}}',
      inAppTemplate: 'Application for {{jobTitle}} is {{newStatus}}',
      variables: { userName: 'string', jobTitle: 'string', businessName: 'string', newStatus: 'string', applicationUrl: 'string' },
    },

    // Review Notifications
    {
      type: NotificationType.REVIEW_RECEIVED,
      language: 'en',
      subject: 'New Review Received',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Review Received</h2>
          <p>Hello {{userName}},</p>
          <p>You have received a new review from {{reviewerName}}.</p>
          <p><strong>Rating:</strong> {{rating}}/5</p>
          <p><strong>Review:</strong></p>
          <p style="font-style: italic;">"{{reviewText}}"</p>
          <a href="{{reviewUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Review</a>
        </div>
      `,
      textBody: 'Hello {{userName}},\n\nYou have received a new review from {{reviewerName}}.\n\nRating: {{rating}}/5\n\n"{{reviewText}}"\n\nView review: {{reviewUrl}}',
      pushTitle: 'New Review',
      pushBody: '{{reviewerName}} gave you a {{rating}}-star review',
      inAppTemplate: 'New {{rating}}-star review from {{reviewerName}}',
      variables: { userName: 'string', reviewerName: 'string', rating: 'number', reviewText: 'string', reviewUrl: 'string' },
    },

    // Message Notifications
    {
      type: NotificationType.NEW_MESSAGE,
      language: 'en',
      subject: 'New Message',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Message</h2>
          <p>Hello {{userName}},</p>
          <p>You have received a new message from {{senderName}}.</p>
          <p style="font-style: italic;">"{{messagePreview}}"</p>
          <a href="{{threadUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Message</a>
        </div>
      `,
      textBody: 'Hello {{userName}},\n\nYou have a new message from {{senderName}}.\n\n"{{messagePreview}}"\n\nView message: {{threadUrl}}',
      pushTitle: 'New Message',
      pushBody: '{{senderName}} sent you a message',
      inAppTemplate: 'New message from {{senderName}}',
      variables: { userName: 'string', senderName: 'string', messagePreview: 'string', threadUrl: 'string' },
    },
    {
      type: NotificationType.MESSAGE_DIGEST,
      language: 'en',
      subject: 'You Have {{messageCount}} Unread Messages',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Unread Messages</h2>
          <p>Hello {{userName}},</p>
          <p>You have <strong>{{messageCount}}</strong> unread messages.</p>
          <a href="{{inboxUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Messages</a>
        </div>
      `,
      textBody: 'Hello {{userName}},\n\nYou have {{messageCount}} unread messages.\n\nView messages: {{inboxUrl}}',
      pushTitle: '',
      pushBody: '',
      inAppTemplate: '{{messageCount}} unread messages',
      variables: { userName: 'string', messageCount: 'number', inboxUrl: 'string' },
    },

    // Job Alert Notifications
    {
      type: NotificationType.JOB_ALERT,
      language: 'en',
      subject: '{{jobCount}} New Jobs Matching "{{searchName}}"',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Job Matches</h2>
          <p>Hello {{userName}},</p>
          <p>We found <strong>{{jobCount}}</strong> new jobs matching your saved search "{{searchName}}".</p>
          <ul>
            {{#each jobs}}
            <li><a href="{{this.url}}">{{this.title}}</a> at {{this.businessName}}</li>
            {{/each}}
          </ul>
          <a href="{{searchUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View All Jobs</a>
        </div>
      `,
      textBody: 'Hello {{userName}},\n\nWe found {{jobCount}} new jobs matching "{{searchName}}".\n\nView all jobs: {{searchUrl}}',
      pushTitle: 'New Job Matches',
      pushBody: '{{jobCount}} new jobs match "{{searchName}}"',
      inAppTemplate: '{{jobCount}} new jobs match "{{searchName}}"',
      variables: { userName: 'string', jobCount: 'number', searchName: 'string', jobs: 'array', searchUrl: 'string' },
    },

    // System Notifications
    {
      type: NotificationType.JOB_EXPIRING_SOON,
      language: 'en',
      subject: 'Job Expiring Soon',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Job Expiring Soon</h2>
          <p>Hello {{userName}},</p>
          <p>Your job posting <strong>{{jobTitle}}</strong> will expire on {{expiryDate}}.</p>
          <p>Please extend the posting or mark the position as filled.</p>
          <a href="{{jobUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Manage Job</a>
        </div>
      `,
      textBody: 'Hello {{userName}},\n\nYour job posting {{jobTitle}} will expire on {{expiryDate}}.\n\nManage job: {{jobUrl}}',
      pushTitle: 'Job Expiring Soon',
      pushBody: '{{jobTitle}} expires on {{expiryDate}}',
      inAppTemplate: '{{jobTitle}} expires soon',
      variables: { userName: 'string', jobTitle: 'string', expiryDate: 'string', jobUrl: 'string' },
    },
    {
      type: NotificationType.SECURITY_ALERT,
      language: 'en',
      subject: 'Security Alert',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">Security Alert</h2>
          <p>Hello {{userName}},</p>
          <p>A security event was detected on your account:</p>
          <p><strong>Event:</strong> {{eventType}}</p>
          <p><strong>Time:</strong> {{timestamp}}</p>
          <p><strong>Location:</strong> {{location}}</p>
          <p>If this was you, you can ignore this message. If you did not initiate this action, please secure your account immediately.</p>
          <a href="{{securityUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #d9534f; color: white; text-decoration: none; border-radius: 4px;">Secure Account</a>
        </div>
      `,
      textBody: 'Hello {{userName}},\n\nSecurity event detected:\n\nEvent: {{eventType}}\nTime: {{timestamp}}\nLocation: {{location}}\n\nIf this was not you, secure your account immediately: {{securityUrl}}',
      pushTitle: 'Security Alert',
      pushBody: 'Security event: {{eventType}}',
      inAppTemplate: 'Security alert: {{eventType}}',
      variables: { userName: 'string', eventType: 'string', timestamp: 'string', location: 'string', securityUrl: 'string' },
    },
    {
      type: NotificationType.BADGE_EARNED,
      language: 'en',
      subject: 'Congratulations! You Earned a Badge',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Congratulations!</h2>
          <p>Hello {{userName}},</p>
          <p>You have earned a new badge:</p>
          <h3 style="color: #f0ad4e;">{{badgeName}}</h3>
          <p>Level: {{badgeLevel}}</p>
          <p>Keep up the great work!</p>
          <a href="{{profileUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Profile</a>
        </div>
      `,
      textBody: 'Hello {{userName}},\n\nCongratulations! You earned the {{badgeName}} badge (Level {{badgeLevel}})!\n\nView profile: {{profileUrl}}',
      pushTitle: 'Badge Earned!',
      pushBody: 'You earned the {{badgeName}} badge!',
      inAppTemplate: 'Badge earned: {{badgeName}}',
      variables: { userName: 'string', badgeName: 'string', badgeLevel: 'string', profileUrl: 'string' },
    },
  ];

  for (const template of templates) {
    await prisma.notificationTemplate.create({
      data: {
        ...template,
        key: `${template.type}_${template.language}_v1`,
        version: 1,
        isActive: true,
      },
    });
  }

  console.log('Seeded notification templates successfully.');
}

seedNotificationTemplates()
  .catch((e) => {
    console.error('Error seeding notification templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
