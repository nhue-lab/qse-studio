# Changelog — QSE Studio 🇫🇷

Tous les changements notables apportés à ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) et ce projet respecte le [Versionnage Sémantique (SemVer)](https://semver.org/lang/fr/).

---

## [v0.2.0] - 2026-07-19

### Ajouté
- **Gestion et Annuaire des Utilisateurs (`/users`)** : Nouvelle page permettant de lister les membres de l'équipe et de leur attribuer des rôles métiers (`admin`, `qse_manager`, `operator`, `auditor`).
- **Onboarding Administrateur Automatique** : Assistant de premier lancement qui détecte une base vierge et attribue automatiquement les privilèges d'administrateur au premier utilisateur créé.
- **Tableau de Bord KPI (Signal > Bruit)** : Nouveaux indicateurs clés avec alerte visuelle sur les actions CAPA en retard, calcul du temps moyen de résolution et graphique de répartition des causes par catégorie d'Ishikawa.
- **Kanban CAPA Interactif** : Boutons de changement de statut rapide sur les cartes (`▶ En cours`, `✓ Terminer`, `✕ Annuler`, `↺ Ré-ouvrir`), avec alerte rouge `⚠️` en cas de dépassement de délai.
- **Création d'Action CAPA liée à l'Annuaire** : Modale d'ajout d'actions CAPA permettant la sélection dynamique du responsable parmi les utilisateurs de la base.
- **Traçabilité Audit des Actions** : Journalisation automatique de la création et des mouvements de statut des actions CAPA dans l'Audit Trail inaltérable.

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
