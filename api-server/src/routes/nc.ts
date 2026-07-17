import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { NCStatus } from '../domain/nc-states';
import { validateStateTransition } from '../domain/nc-machine';
import { assertGuardrails } from '../domain/guardrails';
import { logAudit, getAuditHistory } from '../services/audit-trail';
import { iaRouter } from '../services/ia/ia-router';
import { pdfService } from '../services/pdf-service';

export async function ncRoutes(fastify: FastifyInstance) {
  // 1. Lister toutes les Non-Conformités
  fastify.get('/api/nc', async (request, reply) => {
    try {
      const result = await db.query(`
        SELECT nc.id, nc.title, nc.description, nc.status, nc.severity, nc.detected_at,
               nc.ishikawa_category, nc.root_cause,
               u.first_name as reporter_first_name, u.last_name as reporter_last_name,
               q.first_name as manager_first_name, q.last_name as manager_last_name,
               COUNT(ca.id)::int as total_actions,
               COUNT(CASE WHEN ca.status = 'done' THEN 1 END)::int as completed_actions
        FROM public.non_conformities nc
        JOIN public.users u ON nc.reporter_id = u.id
        LEFT JOIN public.users q ON nc.qse_manager_id = q.id
        LEFT JOIN public.capa_actions ca ON ca.nc_id = nc.id
        GROUP BY nc.id, u.first_name, u.last_name, q.first_name, q.last_name
        ORDER BY nc.detected_at DESC
      `);
      return result.rows;
    } catch (error) {
      fastify.log.error({ err: error }, 'Échec de la récupération des non-conformités');
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  });

  // 2. Créer une nouvelle Non-Conformité
  fastify.post('/api/nc', async (request, reply) => {
    try {
      const body = request.body as {
        title: string;
        description: string;
        severity: 'minor' | 'major' | 'critical';
        reporter_id?: string;
      };

      // Utilisateur par défaut (Marc Admin QSE) si non spécifié
      const reporterId = body.reporter_id || 'd1a3b110-3882-411a-85d0-79883bfd12f1';

      const query = `
        INSERT INTO public.non_conformities (title, description, severity, status, reporter_id, detected_at)
        VALUES ($1, $2, $3, 'declared', $4, NOW())
        RETURNING *;
      `;

      const result = await db.query(query, [
        body.title,
        body.description,
        body.severity || 'minor',
        reporterId
      ]);

      const createdNC = result.rows[0];

      // Audit Trail (Phase 3)
      await logAudit({
        entityType: 'non_conformity',
        entityId: createdNC.id,
        action: 'created',
        actorId: reporterId,
        newValue: createdNC
      });

      return reply.status(201).send(createdNC);
    } catch (error) {
      fastify.log.error({ err: error }, 'Échec de la création de la non-conformité');
      return reply.status(500).send({ error: 'Erreur lors de la création' });
    }
  });

  // 3. Récupérer le détail complet d'une Non-Conformité (avec ses actions CAPA)
  fastify.get('/api/nc/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const ncResult = await db.query(`
        SELECT nc.*, 
               u.first_name as reporter_first_name, u.last_name as reporter_last_name,
               q.first_name as manager_first_name, q.last_name as manager_last_name
        FROM public.non_conformities nc
        JOIN public.users u ON nc.reporter_id = u.id
        LEFT JOIN public.users q ON nc.qse_manager_id = q.id
        WHERE nc.id = $1
      `, [id]);

      if (ncResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Non-conformité introuvable' });
      }

      const nc = ncResult.rows[0];

      const actionsResult = await db.query(`
        SELECT ca.*, u.first_name as assignee_first_name, u.last_name as assignee_last_name
        FROM public.capa_actions ca
        JOIN public.users u ON ca.assignee_id = u.id
        WHERE ca.nc_id = $1
        ORDER BY ca.created_at ASC
      `, [id]);

      return {
        ...nc,
        actions: actionsResult.rows
      };
    } catch (error) {
      fastify.log.error({ err: error }, 'Échec de la récupération du détail de la NC');
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  });

  // 4. Mettre à jour l'analyse de cause (5 Pourquoi / Ishikawa)
  fastify.put('/api/nc/:id/analysis', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        why_1?: string;
        why_2?: string;
        why_3?: string;
        why_4?: string;
        why_5?: string;
        root_cause?: string;
        ishikawa_category?: string;
        actor_id?: string;
      };

      const actorId = body.actor_id || 'd1a3b110-3882-411a-85d0-79883bfd12f1';

      const currentNc = await db.query('SELECT * FROM public.non_conformities WHERE id = $1', [id]);
      if (currentNc.rows.length === 0) {
        return reply.status(404).send({ error: 'NC introuvable' });
      }

      const query = `
        UPDATE public.non_conformities
        SET why_1 = COALESCE($1, why_1),
            why_2 = COALESCE($2, why_2),
            why_3 = COALESCE($3, why_3),
            why_4 = COALESCE($4, why_4),
            why_5 = COALESCE($5, why_5),
            root_cause = COALESCE($6, root_cause),
            ishikawa_category = COALESCE($7, ishikawa_category),
            updated_at = NOW()
        WHERE id = $8
        RETURNING *;
      `;

      const result = await db.query(query, [
        body.why_1, body.why_2, body.why_3, body.why_4, body.why_5,
        body.root_cause, body.ishikawa_category, id
      ]);

      const updated = result.rows[0];

      await logAudit({
        entityType: 'non_conformity',
        entityId: id,
        action: 'field_updated',
        actorId,
        previousValue: currentNc.rows[0],
        newValue: updated
      });

      return updated;
    } catch (error) {
      fastify.log.error({ err: error }, 'Échec de la mise à jour de l\'analyse');
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  });

  // 5. Effectuer une transition d'état contrôlée (State Machine + Guardrails + Audit)
  fastify.put('/api/nc/:id/status', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { targetStatus, userRole, actorId, effectivenessProof } = request.body as {
        targetStatus: NCStatus;
        userRole?: string;
        actorId?: string;
        effectivenessProof?: string;
      };

      const role = userRole || 'admin';
      const actor = actorId || 'd1a3b110-3882-411a-85d0-79883bfd12f1';

      // Récupérer l'état actuel et les actions associées
      const ncRes = await db.query('SELECT * FROM public.non_conformities WHERE id = $1', [id]);
      if (ncRes.rows.length === 0) {
        return reply.status(404).send({ error: 'NC introuvable' });
      }
      const nc = ncRes.rows[0];

      const actionsRes = await db.query('SELECT id, status FROM public.capa_actions WHERE nc_id = $1', [id]);
      const ncData = {
        ...nc,
        effectiveness_proof: effectivenessProof || nc.effectiveness_proof,
        actions: actionsRes.rows
      };

      // A. Valider la State Machine (Phase 1)
      validateStateTransition(nc.status as NCStatus, targetStatus, role);

      // B. Valider les Guardrails de complétude (Phase 2)
      assertGuardrails(ncData, targetStatus);

      // C. Appliquer la transition en base de données
      const updateQuery = `
        UPDATE public.non_conformities
        SET status = $1,
            effectiveness_proof = COALESCE($2, effectiveness_proof),
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `;

      const updateRes = await db.query(updateQuery, [targetStatus, effectivenessProof, id]);
      const updatedNC = updateRes.rows[0];

      // D. Enregistrer l'événement dans le journal d'audit (Phase 3)
      await logAudit({
        entityType: 'non_conformity',
        entityId: id,
        action: 'status_changed',
        actorId: actor,
        previousValue: { status: nc.status },
        newValue: { status: targetStatus },
        metadata: { guardrailsPassed: true }
      });

      return updatedNC;
    } catch (error: any) {
      if (error.name === 'TransitionError' || error.name === 'GuardrailViolationError') {
        return reply.status(400).send({
          error: error.message,
          type: error.name,
          details: error.errors || []
        });
      }
      fastify.log.error({ err: error }, 'Échec de la transition de statut');
      return reply.status(500).send({ error: 'Erreur serveur lors de la transition' });
    }
  });

  // 6. Demander une suggestion d'analyse par l'IA (Phase 5 - Routeur IA avec Failover)
  fastify.post('/api/nc/:id/suggest-causes', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const ncRes = await db.query('SELECT title, description FROM public.non_conformities WHERE id = $1', [id]);
      if (ncRes.rows.length === 0) {
        return reply.status(404).send({ error: 'NC introuvable' });
      }

      const { title, description } = ncRes.rows[0];

      // Déclencher le routeur IA avec Failover
      const suggestion = await iaRouter.suggestCauses(title, description);
      return suggestion;
    } catch (error) {
      fastify.log.error({ err: error }, 'Échec de la suggestion IA');
      return reply.status(500).send({ error: 'Erreur lors de la suggestion IA' });
    }
  });

  // 7. Exporter la Fiche NC au format HTML/PDF (Phase 4 - Service PDF)
  fastify.get('/api/nc/:id/pdf', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const ncRes = await db.query(`
        SELECT nc.*, 
               u.first_name || ' ' || u.last_name as reporter_name,
               q.first_name || ' ' || q.last_name as qse_manager_name
        FROM public.non_conformities nc
        JOIN public.users u ON nc.reporter_id = u.id
        LEFT JOIN public.users q ON nc.qse_manager_id = q.id
        WHERE nc.id = $1
      `, [id]);

      if (ncRes.rows.length === 0) {
        return reply.status(404).send({ error: 'NC introuvable' });
      }

      const actionsRes = await db.query(`
        SELECT ca.*, u.first_name || ' ' || u.last_name as assignee_name
        FROM public.capa_actions ca
        JOIN public.users u ON ca.assignee_id = u.id
        WHERE ca.nc_id = $1
      `, [id]);

      const exportResult = await pdfService.execute({
        nc: {
          ...ncRes.rows[0],
          actions: actionsRes.rows
        }
      });

      if (!exportResult.success || !exportResult.data) {
        return reply.status(500).send({ error: exportResult.error || 'Échec de la génération du rapport' });
      }

      reply.header('Content-Type', 'text/html; charset=utf-8');
      return reply.send(exportResult.data.htmlContent);
    } catch (error) {
      fastify.log.error({ err: error }, 'Échec de l\'export PDF');
      return reply.status(500).send({ error: 'Erreur serveur lors de l\'export' });
    }
  });

  // 8. Consulter l'historique d'audit d'une NC (Phase 3 - Audit Trail)
  fastify.get('/api/nc/:id/audit', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const history = await getAuditHistory('non_conformity', id);
      return history;
    } catch (error) {
      fastify.log.error({ err: error }, 'Échec de la récupération de l\'audit trail');
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  });
}
