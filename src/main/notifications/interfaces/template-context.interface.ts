/**
 * Template Context Interface
 * SPEC-NOT-001
 */
export interface TemplateContext {
  // User context
  userName?: string;
  userEmail?: string;
  userLanguage?: string;

  // Notification-specific context (dynamic based on type)
  [key: string]: any;
}

/**
 * Rendered Template Interface
 */
export interface RenderedTemplate {
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  pushTitle?: string;
  pushBody?: string;
  smsTemplate?: string;
  inAppTemplate?: string;
}
