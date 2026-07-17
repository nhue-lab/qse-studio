/**
  * State Machine des Non-Conformités (inspiré de AgentStatus dans agentic-builder)
  */

export enum NCStatus {
  DRAFT = 'draft',               // Fiche en cours de rédaction
  DECLARED = 'declared',         // Fiche transmise au service QSE
  ANALYZING = 'analyzing',       // En cours d'analyse de cause (5 Pourquoi / Ishikawa)
  ACTIONS_OPEN = 'actions_open', // Plan d'actions validé et en cours d'exécution
  VERIFYING = 'verifying',       // Toutes les actions terminées, vérification d'efficacité
  CLOSED = 'closed'              // NC clôturée avec preuve d'efficacité
}

export const NC_STATUS_LABELS: Record<NCStatus, string> = {
  [NCStatus.DRAFT]: 'Brouillon',
  [NCStatus.DECLARED]: 'Déclarée',
  [NCStatus.ANALYZING]: 'Analyse des causes (5P/Ishikawa)',
  [NCStatus.ACTIONS_OPEN]: 'Actions en cours',
  [NCStatus.VERIFYING]: 'Vérification d\'efficacité',
  [NCStatus.CLOSED]: 'Clôturée'
};

/**
 * Matrice des transitions valides (inspiré du graphe de transition de LoopRouter)
 */
export const VALID_TRANSITIONS: Record<NCStatus, NCStatus[]> = {
  [NCStatus.DRAFT]: [NCStatus.DECLARED],
  [NCStatus.DECLARED]: [NCStatus.ANALYZING],
  [NCStatus.ANALYZING]: [NCStatus.ACTIONS_OPEN],
  [NCStatus.ACTIONS_OPEN]: [NCStatus.VERIFYING],
  [NCStatus.VERIFYING]: [NCStatus.CLOSED, NCStatus.ACTIONS_OPEN], // Rebouclage si l'action s'avère inefficace
  [NCStatus.CLOSED]: [] // État terminal
};

/**
 * Matrice des autorisations par rôle (inspiré du Permission Cloisonnement)
 */
export const ROLE_PERMISSIONS: Record<string, NCStatus[]> = {
  admin: [
    NCStatus.DRAFT,
    NCStatus.DECLARED,
    NCStatus.ANALYZING,
    NCStatus.ACTIONS_OPEN,
    NCStatus.VERIFYING,
    NCStatus.CLOSED
  ],
  qse: [
    NCStatus.DRAFT,
    NCStatus.DECLARED,
    NCStatus.ANALYZING,
    NCStatus.ACTIONS_OPEN,
    NCStatus.VERIFYING,
    NCStatus.CLOSED
  ],
  collaborateur: [
    NCStatus.DRAFT,
    NCStatus.DECLARED
  ]
};
