# Roadmap — QSE Studio 🇫🇷

> Ce fichier est la source de vérité du projet. Il est mis à jour à chaque livraison.
> À terme, sa mise à jour et la publication des releases sera automatisée par un **Release Agent** (basé sur `agentic-builder`).

---

## Vision Produit

Créer la plateforme de management QSE que les responsables utilisent vraiment — open source, 100% gratuite, auto-hébergeable, et distribuable en `.exe` pour les non-techniciens des PME et ETI industrielles françaises.

---

## Statut actuel : `v0.1.0` (En développement)

---

## Phase A — Complétion du Produit (Priorité absolue)

| Tâche | Statut | Description |
|---|---|---|
| **A1** | 🔄 En cours | Page de détail NC + Diagramme Ishikawa interactif + Formulaire 5 Pourquoi |
| **A2** | ⬜ Planifié | Application Desktop Windows (`.exe`) via Tauri + SQLite embarqué |
| **A3** | ⬜ Planifié | `CHANGELOG.md` + versionnage `v0.1.0` + Tags Git |
| **A4** | ⬜ Planifié | Publication sur GitHub + `README.md` 🇫🇷 orienté métier |

---

## Phase B — Release Agent (Après publication GitHub)

> Instancier un agent autonome basé sur `agentic-builder` pour automatiser les releases.

| Tâche | Statut | Description |
|---|---|---|
| **B1** | ⬜ Planifié | Instancier le template `agentic-builder` → `tools/release-agent/` |
| **B2** | ⬜ Planifié | Connecter `GitPushSkill` + `GrillMeGuard` pour validation humaine avant push |
| **B3** | ⬜ Planifié | Test end-to-end : premier release automatisé `v0.2.0` |
| **B4** | ⬜ Planifié | Déléguer la mise à jour de ce fichier `ROADMAP.md` à l'agent |

---

## Phase C — Fonctionnalités Métier (Roadmap Produit)

| Tâche | Version cible | Description |
|---|---|---|
| **C1** | `v0.3.0` | Module Audits Internes (planification, checklists ISO 9001/14001/45001, rapport) |
| **C2** | `v0.4.0` | Module Indicateurs & Revue de Direction (KPI, graphiques de tendances) |
| **C3** | `v0.5.0` | Module Gestion des Risques (cartographie, bow-tie, matrice de cotation) |
| **C4** | `v0.6.0` | Module REX & Capitalisation (base de connaissance, clustering incidents similaires) |
| **C5** | `v0.7.0` | Module Compétences & Habilitations (matrice, alertes expiration) |

---

## Phase D — Distribution & Croissance

| Tâche | Statut | Description |
|---|---|---|
| **D1** | ⬜ Futur | Publication du `.exe` Windows sur GitHub Releases (CI/CD via GitHub Actions) |
| **D2** | ⬜ Futur | Article de blog (personal branding) — lancement officiel QSE Studio |
| **D3** | ⬜ Futur | Post LinkedIn + démonstration vidéo Loom |
| **D4** | ⬜ Futur | Adaptation IA agnostique (Ollama / OpenAI / Gemini selon config `.env`) |

---

## Décisions architecturales clés (ADR)

- **Licence** : AGPL-3.0 (protection contre le cloud-washing, maximise la contribution communautaire)
- **Langue** : 100% Français (cible PME/ETI francophones)
- **IA** : Frugale et optionnelle (moteur de règles déterministe en fallback, Ollama en local, zéro donnée sortante)
- **Distribution** : Self-hosted Docker (pour les IT) + Desktop `.exe` Tauri/SQLite (pour les non-techniciens)
- **Monétisation future** : Services d'implémentation et de support (le logiciel reste 100% gratuit)
