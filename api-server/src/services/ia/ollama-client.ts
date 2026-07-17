import { IASuggestion } from './rules-engine';

export class OllamaConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaConnectionError';
  }
}

/**
 * Client HTTP pour Ollama local (zéro donnée sortante du serveur self-hosted).
 */
export async function analyzeNCWithOllama(
  title: string, 
  description: string, 
  ollamaUrl: string = 'http://localhost:11434',
  model: string = 'llama3:latest'
): Promise<IASuggestion> {
  const prompt = `Tu es un expert QSE (Qualité, Sécurité, Environnement). Analyse l'incident suivant :
Titre: ${title}
Description: ${description}

Réponds STRICTEMENT sous la forme d'un objet JSON valide avec les clés :
- "category" : une valeur parmi ["Matériel", "Matière", "Méthode", "Main d'oeuvre", "Milieu"]
- "suggestedWhys" : une liste de 2 questions "Pourquoi ?" pertinentes pour trouver la cause racine.

Format de réponse JSON uniquement.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes de timeout strict

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new OllamaConnectionError(`Ollama HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.response);

    return {
      category: parsed.category || 'Matériel',
      suggestedWhys: parsed.suggestedWhys || [],
      source: 'ollama_ai'
    };
  } catch (error) {
    throw new OllamaConnectionError(`Ollama inaccessible ou en erreur : ${String(error)}`);
  }
}
