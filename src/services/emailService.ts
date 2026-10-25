import emailjs from '@emailjs/browser';
import { EmailNotification, SmtpConfig, Assignee, Finding, Visit } from '../types/gemba';
import { generateEmailId, formatGembaEmail } from '../utils/gembaLogic';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isLive: boolean;
}

export class EmailService {
  /**
   * Dispatches a real email notification using EmailJS or direct HTTP API
   */
  static async sendEmail(
    notification: EmailNotification,
    config: SmtpConfig
  ): Promise<EmailDispatchResult> {
    const serviceId = (config.emailJsServiceId || '').trim();
    const templateId = (config.emailJsTemplateId || '').trim();
    const publicKey = (config.emailJsPublicKey || '').trim();
    const recipientEmail = (notification.recipientEmail || '').trim();

    // Check if recipient email is valid to prevent 422 'The recipients address is empty'
    if (!recipientEmail || !recipientEmail.includes('@')) {
      const errorMsg = 'The recipients address is empty or invalid.';
      console.warn('[EmailService]', errorMsg, notification.recipientEmail);
      return {
        success: false,
        error: errorMsg,
        isLive: Boolean(serviceId && templateId && publicKey),
      };
    }

    // Check if real EmailJS credentials are provided
    if (serviceId && templateId && publicKey) {
      try {
        // Provide recipient_email (matching template_5x5fd5d variable) as well as to_email and email aliases
        const templateParams = {
          recipient_email: recipientEmail,
          to_email: recipientEmail,
          email: recipientEmail,
          reply_to: recipientEmail,
          to_name: notification.recipientName || 'Concern Lead',
          recipient_name: notification.recipientName || 'Concern Lead',
          recipient_role: notification.recipientRole || '',
          subject: notification.subject,
          message: notification.body,
          finding_id: notification.findingId,
          area: notification.area,
          sub_area: notification.subArea,
          severity: notification.severity,
          category: notification.category,
          sender_name: config.displayName || 'Reckitt GembaWalk Safety System',
          timestamp: new Date(notification.timestamp).toLocaleString(),
        };

        // Call EmailJS REST endpoint or SDK
        const response = await emailjs.send(
          serviceId,
          templateId,
          templateParams,
          publicKey
        );

        return {
          success: true,
          messageId: `EJS-${response.status}-${Date.now()}`,
          isLive: true,
        };
      } catch (err: unknown) {
        console.warn('EmailJS live dispatch warning:', err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : typeof err === 'object' && err !== null && 'text' in err
            ? String((err as { text: unknown }).text)
            : String(err);
        return {
          success: false,
          error: errorMsg,
          isLive: true,
        };
      }
    }

    // If EmailJS keys not provided, log HTTP payload and mark status
    console.info(
      `[EmailService] Simulated dispatch for ${recipientEmail}: [${notification.subject}]`
    );
    return {
      success: true,
      messageId: `SIM-${Date.now().toString(36).toUpperCase()}`,
      isLive: false,
    };
  }

  /**
   * Generates notifications for all question-specific assignees for a finding
   */
  static createFindingNotifications(
    finding: Finding,
    visit: Visit,
    assignees: Assignee[]
  ): EmailNotification[] {
    const notifications: EmailNotification[] = [];

    for (const assignee of assignees) {
      if (!assignee.email) continue;
      const { subject, body } = formatGembaEmail(finding, visit, assignee);
      notifications.push({
        id: generateEmailId(),
        findingId: finding.id,
        visitId: visit.id,
        recipientName: assignee.name || assignee.email.split('@')[0],
        recipientEmail: assignee.email,
        recipientRole: assignee.role || 'Designated Area Concern Lead',
        area: finding.area,
        subArea: finding.subArea,
        category: finding.category,
        severity: finding.severity,
        subject,
        body,
        timestamp: new Date().toISOString(),
        status: 'Delivered',
      });
    }

    return notifications;
  }
}
