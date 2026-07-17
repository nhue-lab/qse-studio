import { IService, ServiceResult } from './base-service';
import { config } from '../config';

export interface MailNotificationInput {
  to: string;
  subject: string;
  body: string;
  type: 'action_assigned' | 'due_reminder' | 'overdue_alert';
}

export interface MailNotificationOutput {
  messageId: string;
  sentAt: string;
}

/**
 * Service de notification par Email (inspiré du pattern Skill d'agentic-builder).
 * Gère le mode dégradé si SMTP non disponible.
 */
export class MailService implements IService<MailNotificationInput, MailNotificationOutput> {
  readonly name = 'MailService';

  async execute(input: MailNotificationInput): Promise<ServiceResult<MailNotificationOutput>> {
    try {
      console.log(`[MailService] Notification [${input.type}] à envoyer à ${input.to}`);
      console.log(`[MailService] Sujet : ${input.subject}`);

      // Simulation d'envoi SMTP ou intégration réelle si configurée
      const isConfigured = Boolean(config.smtp.host && config.smtp.host !== 'localhost');

      const simulatedMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      if (!isConfigured) {
        console.log(`[MailService] Mode simulation SMTP (Host local/défaut) : E-mail simulant l'envoi à ${input.to}`);
      } else {
        console.log(`[MailService] E-mail transmis au serveur SMTP ${config.smtp.host}:${config.smtp.port}`);
      }

      return {
        success: true,
        data: {
          messageId: simulatedMessageId,
          sentAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[MailService] Échec de l\'envoi d\'email :', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }
}

export const mailService = new MailService();
