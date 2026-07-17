import { NCStatus, VALID_TRANSITIONS, ROLE_PERMISSIONS } from './nc-states';

export class TransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransitionError';
  }
}

/**
 * Vérifie si une transition d'état est autorisée du point de vue du graphe de statut.
 */
export function isValidStatusTransition(current: NCStatus, target: NCStatus): boolean {
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

/**
 * Vérifie si le rôle de l'utilisateur l'autorise à positionner la NC dans le statut cible.
 */
export function isRoleAuthorizedForStatus(role: string, target: NCStatus): boolean {
  const allowedStatuses = ROLE_PERMISSIONS[role] || [];
  return allowedStatuses.includes(target);
}

/**
 * Valide une demande de transition d'état globale (Statut + Rôle).
 * Lève une exception TransitionError si la transition est refusée.
 */
export function validateStateTransition(current: NCStatus, target: NCStatus, role: string): void {
  if (!isValidStatusTransition(current, target)) {
    throw new TransitionError(
      `Transition d'état invalide : Impossible de passer du statut '${current}' vers '${target}'.`
    );
  }

  if (!isRoleAuthorizedForStatus(role, target)) {
    throw new TransitionError(
      `Permission insuffisante : Le rôle '${role}' n'a pas le droit de passer une NC au statut '${target}'.`
    );
  }
}
