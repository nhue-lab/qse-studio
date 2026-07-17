# QSE Studio

> La plateforme de management QSE que les responsables utilisent vraiment.

**Statut** : 🟡 Phase 0 — Conception  
**Licence** : AGPL-3.0  
**Cible** : PME/ETI (10–500 salariés), industrie manufacturière & BTP  
**Déploiement** : Self-hosted via Docker Compose  

---

## Vision

QSE Studio est une plateforme open source de management de la Qualité, Sécurité et Environnement,
conçue pour les responsables QSE non-techniques des PME et ETI industrielles.

Elle remplace les fichiers Excel éparpillés, les emails de relance et les tableurs de suivi d'actions
par une interface épurée, responsive, et déployable en une commande.

## Modules prévus

| Module | Version | Statut |
|---|---|---|
| Non-Conformités & CAPA | v1.0 | 🟡 En conception |
| Audits internes | v1.1 | ⬜ Planifié |
| Indicateurs & Revue de direction | v1.2 | ⬜ Planifié |
| Gestion des risques | v2.0 | ⬜ Planifié |
| REX & Capitalisation | v2.1 | ⬜ Planifié |
| Compétences & Habilitations | v2.2 | ⬜ Planifié |

## Démarrage rapide (à venir)

```bash
git clone https://github.com/<org>/qse-studio.git
cd qse-studio
docker compose up -d
```

Puis ouvrir `http://localhost:3000`.

## Stack technique

- **Frontend** : Next.js (React) — Responsive, mobile-friendly
- **Backend** : Node.js + Fastify — API REST typée TypeScript
- **Base de données** : PostgreSQL
- **Déploiement** : Docker Compose
- **Exports** : PDF (Puppeteer)
- **IA locale (optionnel)** : Ollama — aucune donnée ne sort du serveur

## Philosophie

- **Zéro donnée sortante** : Les données QSE (incidents, NC, accidents) sont sensibles. Tout reste sur ton serveur.
- **IA frugale** : L'IA n'intervient que là où elle rend le système plus robuste et déterministe, jamais pour faire joli.
- **UX non-technique** : Conçu pour des responsables QSE, pas des développeurs.

## Contribution

Le projet est en cours de conception. La Phase 0 (Design Doc) sera publiée prochainement.

## Licence

AGPL-3.0 — Voir [LICENSE](./LICENSE).
