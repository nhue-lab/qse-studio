export interface IASuggestion {
  category: string;
  suggestedWhys: string[];
  source: 'ollama_ai' | 'rules_engine_fallback';
}

const ISHIKAWA_KEYWORDS: Record<string, string[]> = {
  'Matériel': ['machine', 'presse', 'outil', 'pompe', 'vérin', 'capteur', 'moteur', 'joint', 'panne', 'casse', 'fuite', 'tuyau', 'disjoncteur', 'garde-corps'],
  'Matière': ['matière', 'composant', 'pièce', 'huile', 'acier', 'plastique', 'produit', 'chimique', 'solvant', 'lot', 'fournisseur'],
  'Méthode': ['procédure', 'consigne', 'mode opératoire', 'planning', 'gamme', 'instruction', 'délai', 'retard', 'organisation'],
  'Main d\'oeuvre': ['formation', 'habilitation', 'intérimaire', 'fatigue', 'erreur', 'inattention', 'qualification', 'consigne non lue'],
  'Milieu': ['température', 'humidité', 'bruit', 'éclairage', 'chantier', 'pluie', 'vent', 'poussière', 'sol glissant', 'espace restreint']
};

/**
 * Moteur de règles déterministe (inspiré du système de Fallback/Simulation d'agentic-builder).
 * Garantit 100% de disponibilité même sans IA locale.
 */
export function analyzeNCWithRules(title: string, description: string): IASuggestion {
  const fullText = `${title} ${description}`.toLowerCase();
  
  const scores: Record<string, number> = {
    'Matériel': 0,
    'Matière': 0,
    'Méthode': 0,
    'Main d\'oeuvre': 0,
    'Milieu': 0
  };

  for (const [category, keywords] of Object.entries(ISHIKAWA_KEYWORDS)) {
    for (const kw of keywords) {
      if (fullText.includes(kw.toLowerCase())) {
        scores[category] += 1;
      }
    }
  }

  // Trouver la catégorie ayant le plus haut score
  let bestCategory = 'Matériel'; // Défaut
  let maxScore = -1;

  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  // Générer des questions "Pourquoi" suggérées selon la catégorie
  const suggestedWhys: string[] = [];
  switch (bestCategory) {
    case 'Matériel':
      suggestedWhys.push("Pourquoi l'équipement a-t-il subi ce dysfonctionnement ? (Usure, défaut d'entretien, surchauffe)");
      suggestedWhys.push("Pourquoi la maintenance préventive n'a-t-elle pas évité la panne ?");
      break;
    case 'Matière':
      suggestedWhys.push("Pourquoi la matière/composant non-conforme a-t-elle été intégrée au processus ?");
      suggestedWhys.push("Pourquoi le contrôle de réception fournisseur n'a-t-il pas détecté le défaut ?");
      break;
    case 'Méthode':
      suggestedWhys.push("Pourquoi la procédure officielle n'a-t-elle pas été suivie ou n'était-elle pas claire ?");
      suggestedWhys.push("Pourquoi le mode opératoire manque-t-il de précisions sur ce cas de figure ?");
      break;
    case 'Main d\'oeuvre':
      suggestedWhys.push("Pourquoi l'opérateur n'était-il pas informé ou formé à la consigne de sécurité ?");
      suggestedWhys.push("Pourquoi le tutorat ou l'accueil au poste n'a-t-il pas abordé ce risque ?");
      break;
    case 'Milieu':
      suggestedWhys.push("Pourquoi les conditions environnementales du poste ont-elles provoqué l'anomalie ?");
      suggestedWhys.push("Pourquoi la zone de travail n'était-elle pas sécurisée contre les intempéries/risques ?");
      break;
  }

  return {
    category: bestCategory,
    suggestedWhys,
    source: 'rules_engine_fallback'
  };
}
