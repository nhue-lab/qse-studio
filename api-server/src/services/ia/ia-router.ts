import { IASuggestion, analyzeNCWithRules } from './rules-engine';
import { analyzeNCWithOllama } from './ollama-client';

/**
 * Routeur IA avec Failover & Circuit Breaker (inspiré directement de LLMRouter et LoopRecovery dans agentic-builder).
 * Tente Ollama en primaire, et bascule de façon 100% déterministe sur le moteur de règles en cas d'échec.
 */
export class IARouter {
  private consecutiveErrors: number = 0;
  private maxConsecutiveErrors: number = 3;
  private circuitOpen: boolean = false;
  private circuitResetTimeout: number = 5 * 60 * 1000; // 5 minutes de pause si le circuit est ouvert
  private lastErrorTime: number = 0;

  async suggestCauses(title: string, description: string): Promise<IASuggestion> {
    // 1. Vérifier si le Circuit Breaker est ouvert
    if (this.circuitOpen) {
      const now = Date.now();
      if (now - this.lastErrorTime > this.circuitResetTimeout) {
        console.log('[IARouter] Tentative de réinitialisation du Circuit Breaker pour Ollama...');
        this.circuitOpen = false;
        this.consecutiveErrors = 0;
      } else {
        console.log('[IARouter] Circuit Breaker OUVERT (Ollama en pause). Utilisation directe du Moteur de Règles.');
        return analyzeNCWithRules(title, description);
      }
    }

    // 2. Essayer le modèle primaire (Ollama local)
    try {
      console.log('[IARouter] Tentative d\'analyse via Ollama local...');
      const result = await analyzeNCWithOllama(title, description);
      
      // Réinitialiser le compteur d'erreurs consécutives en cas de succès (inspiré de LoopRecovery)
      this.consecutiveErrors = 0;
      return result;
    } catch (error) {
      this.consecutiveErrors += 1;
      this.lastErrorTime = Date.now();

      console.warn(
        `[IARouter] Ollama a échoué (${this.consecutiveErrors}/${this.maxConsecutiveErrors}). Raison :`,
        String(error)
      );

      // Si le seuil de 3 erreurs est atteint, ouvrir le Circuit Breaker
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        this.circuitOpen = true;
        console.error(
          `[IARouter] Circuit Breaker OUVERT après ${this.consecutiveErrors} échecs. Ollama est temporairement désactivé.`
        );
      }

      // 3. Failover déterministe immédiat vers le Moteur de Règles
      console.log('[IARouter] Basculement gracieux (Failover) vers le Moteur de Règles déterministe.');
      return analyzeNCWithRules(title, description);
    }
  }
}

export const iaRouter = new IARouter();
