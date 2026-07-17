import { db } from '../db';

export interface AuditLogEntry {
  id?: string;
  entityType: 'non_conformity' | 'capa_action' | 'user';
  entityId: string;
  action: 'created' | 'status_changed' | 'assigned' | 'field_updated' | 'deleted';
  actorId: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
}

/**
 * Service de Journal d'Audit inaltérable (inspiré de SessionMetrics dans agentic-builder).
 * Enregistre les événements de manière immuable pour répondre aux exigences des audits ISO.
 */
export async function logAudit(entry: AuditLogEntry): Promise<string> {
  try {
    const query = `
      INSERT INTO public.audit_log (
        entity_type, 
        entity_id, 
        action, 
        actor_id, 
        previous_value, 
        new_value, 
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at;
    `;

    const values = [
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.actorId,
      entry.previousValue ? JSON.stringify(entry.previousValue) : null,
      entry.newValue ? JSON.stringify(entry.newValue) : null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
    ];

    const result = await db.query(query, values);
    const insertedId = result.rows[0].id;
    console.log(`[AuditTrail] Événement enregistré [${entry.action}] pour ${entry.entityType}:${entry.entityId} par User:${entry.actorId}`);
    return insertedId;
  } catch (error) {
    console.error('[AuditTrail] Échec de l\'enregistrement de l\'audit log :', error);
    // En QSE, un échec de journalisation ne doit pas nécessairement faire crasher la requête utilisateur, 
    // mais doit être loggué de manière critique.
    throw error;
  }
}

/**
 * Récupère l'historique chronologique d'audit d'une entité spécifique (ex: une Fiche NC).
 */
export async function getAuditHistory(entityType: string, entityId: string) {
  const query = `
    SELECT 
      a.id,
      a.entity_type,
      a.entity_id,
      a.action,
      a.previous_value,
      a.new_value,
      a.metadata,
      a.created_at,
      u.first_name as actor_first_name,
      u.last_name as actor_last_name,
      u.email as actor_email
    FROM public.audit_log a
    JOIN public.users u ON a.actor_id = u.id
    WHERE a.entity_type = $1 AND a.entity_id = $2
    ORDER BY a.created_at DESC;
  `;
  const result = await db.query(query, [entityType, entityId]);
  return result.rows;
}
