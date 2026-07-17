import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { logAudit } from '../services/audit-trail';
import { mailService } from '../services/mail-service';

export async function actionRoutes(fastify: FastifyInstance) {
  // 1. Créer une nouvelle action CAPA pour une NC
  fastify.post('/api/nc/:ncId/actions', async (request, reply) => {
    try {
      const { ncId } = request.params as { ncId: string };
      const body = request.body as {
        title: string;
        description: string;
        assignee_id: string;
        due_date: string;
        actor_id?: string;
      };

      const actorId = body.actor_id || 'd1a3b110-3882-411a-85d0-79883bfd12f1';

      const query = `
        INSERT INTO public.capa_actions (nc_id, title, description, assignee_id, due_date, status)
        VALUES ($1, $2, $3, $4, $5, 'todo')
        RETURNING *;
      `;

      const result = await db.query(query, [
        ncId,
        body.title,
        body.description,
        body.assignee_id,
        body.due_date
      ]);

      const action = result.rows[0];

      // Audit Trail
      await logAudit({
        entityType: 'capa_action',
        entityId: action.id,
        action: 'created',
        actorId,
        newValue: action
      });

      // Notification Email
      const userRes = await db.query('SELECT email, first_name FROM public.users WHERE id = $1', [body.assignee_id]);
      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        await mailService.execute({
          to: user.email,
          subject: `[QSE Studio] Nouvelle action CAPA assignée : ${body.title}`,
          body: `Bonjour ${user.first_name},\n\nUne nouvelle action corrective vous a été assignée : "${body.title}". Échéance : ${body.due_date}.\n\nConnectez-vous sur QSE Studio pour consulter la fiche.`,
          type: 'action_assigned'
        });
      }

      return reply.status(201).send(action);
    } catch (error) {
      fastify.log.error({ err: error }, 'Échec de la création de l\'action CAPA');
      return reply.status(500).send({ error: 'Erreur lors de la création de l\'action' });
    }
  });

  // 2. Mettre à jour le statut d'une action CAPA
  fastify.put('/api/actions/:id/status', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { status, actor_id } = request.body as {
        status: 'todo' | 'in_progress' | 'done' | 'cancelled';
        actor_id?: string;
      };

      const actorId = actor_id || 'd1a3b110-3882-411a-85d0-79883bfd12f1';

      const currentRes = await db.query('SELECT * FROM public.capa_actions WHERE id = $1', [id]);
      if (currentRes.rows.length === 0) {
        return reply.status(404).send({ error: 'Action introuvable' });
      }

      const completedAt = status === 'done' ? new Date().toISOString() : null;

      const query = `
        UPDATE public.capa_actions
        SET status = $1,
            completed_at = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `;

      const result = await db.query(query, [status, completedAt, id]);
      const updated = result.rows[0];

      // Audit Trail
      await logAudit({
        entityType: 'capa_action',
        entityId: id,
        action: 'status_changed',
        actorId,
        previousValue: currentRes.rows[0],
        newValue: updated
      });

      return updated;
    } catch (error) {
      fastify.log.error({ err: error }, 'Échec de la mise à jour du statut de l\'action');
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  });
}
