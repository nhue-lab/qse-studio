import { NCStatus } from './nc-states';

export interface CapaActionSummary {
  id: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
}

export interface NonConformityData {
  id: string;
  title: string;
  description: string;
  status: NCStatus;
  qse_manager_id?: string | null;
  root_cause?: string | null;
  why_1?: string | null;
  effectiveness_proof?: string | null;
  actions?: CapaActionSummary[];
}

export interface GuardrailResult {
  passed: boolean;
  errors: string[];
}

export class GuardrailViolationError extends Error {
  public errors: string[];
  constructor(errors: string[]) {
    super(`Violation des Guardrails de conformité QSE : ${errors.join(' | ')}`);
    this.name = 'GuardrailViolationError';
    this.errors = errors;
  }
}

/**
 * Pipeline de Guardrails de conformité (inspiré d'InputFilter/OutputFilter d'agentic-builder).
 * Évalue si une fiche de Non-Conformité satisfait aux exigences de complétude ISO pour la transition visée.
 */
export function evaluateGuardrails(nc: NonConformityData, targetStatus: NCStatus): GuardrailResult {
  const errors: string[] = [];

  switch (targetStatus) {
    case NCStatus.DECLARED:
      if (!nc.title || nc.title.trim().length < 5) {
        errors.push("Le titre de la Non-Conformité doit comporter au moins 5 caractères.");
      }
      if (!nc.description || nc.description.trim().length < 10) {
        errors.push("La description doit comporter au moins 10 caractères.");
      }
      break;

    case NCStatus.ANALYZING:
      if (!nc.qse_manager_id) {
        errors.push("Un responsable QSE doit être assigné à la NC avant de démarrer l'analyse des causes.");
      }
      break;

    case NCStatus.ACTIONS_OPEN:
      if (!nc.root_cause || nc.root_cause.trim().length === 0) {
        errors.push("L'analyse de cause racine ('root_cause') est obligatoire pour valider le plan d'actions.");
      }
      if (!nc.why_1 || nc.why_1.trim().length === 0) {
        errors.push("Au moins le premier 'Pourquoi' de l'analyse doit être renseigné.");
      }
      break;

    case NCStatus.VERIFYING: {
      const actions = nc.actions || [];
      if (actions.length === 0) {
        errors.push("Impossible de passer en vérification : aucune action CAPA n'est associée à cette NC.");
      }
      const pendingActions = actions.filter(a => a.status === 'todo' || a.status === 'in_progress');
      if (pendingActions.length > 0) {
        errors.push(`Toutes les actions CAPA doivent être terminées. (${pendingActions.length} action(s) encore en cours).`);
      }
      break;
    }

    case NCStatus.CLOSED:
      if (!nc.effectiveness_proof || nc.effectiveness_proof.trim().length < 10) {
        errors.push("Une preuve d'efficacité détaillée (au moins 10 caractères) est requise pour clôturer la NC.");
      }
      break;

    default:
      break;
  }

  return {
    passed: errors.length === 0,
    errors
  };
}

/**
 * Exécute l'évaluation du Guardrail et lève une GuardrailViolationError si échec.
 */
export function assertGuardrails(nc: NonConformityData, targetStatus: NCStatus): void {
  const result = evaluateGuardrails(nc, targetStatus);
  if (!result.passed) {
    throw new GuardrailViolationError(result.errors);
  }
}
