# Changelog — QSE Studio 🇫🇷

Tous les changements notables apportés à ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) et ce projet respecte le [Versionnage Sémantique (SemVer)](https://semver.org/lang/fr/).

---

## [v0.1.0] - 2026-07-17

Première version fonctionnelle de QSE Studio, livrée avec une architecture hybride (Solo local & Collaboratif) et les patterns de robustesse inspirés d'agentic-builder.

### Ajouté
- **State Machine de cycle de vie des NC** : Verrouillage strict des transitions de statut et contrôle des rôles (Admin, QSE, Collaborateur).
- **Guardrails de conformité ISO** : Validation automatique de la complétude des fiches de Non-Conformités avant transition (assignation pilote QSE, saisie cause racine, preuve d'efficacité).
- **Audit Trail inaltérable** : Historique d'audit (INSERT-only) traçant chaque événement en format JSON pour les auditeurs ISO.
- **Moteur IA avec Failover déterministe** : Suggestion de causes Ishikawa et 5 Pourquoi par IA Ollama en local. Dégradation gracieuse et instantanée vers un moteur de règles en cas de déconnexion.
- **Diagramme Ishikawa interactif** : Rendu SVG interactif dans la page de détail d'une NC.
- **Export PDF** : Service d'exportation pour imprimer la fiche de Non-Conformité au format rapport QSE.
- **Architecture hybride & Tauri** : Structure prête pour compiler le client léger sous forme d'application Desktop native Windows `.exe` avec base de données SQLite locale.
- **CI/CD GitHub Action** : Workflow d'action automatisé pour compiler le `.exe` à chaque nouvelle release Git.
