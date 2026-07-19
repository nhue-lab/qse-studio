# 🛡️ QSE Studio 🇫🇷

> **La plateforme Open Source de Management QSE (Qualité, Sécurité, Environnement) autonome, souveraine et assistée par IA locale.**

![Version](https://img.shields.io/badge/Version-v0.2.0-blue.svg?style=flat-square)
![Licence](https://img.shields.io/badge/Licence-AGPL--3.0-green.svg?style=flat-square)
![Mode](https://img.shields.io/badge/Mode-100%25%20Offline%20%7C%20Desktop%20SQLite-purple.svg?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Tauri%20%7C%20TypeScript-000000.svg?style=flat-square)

---

## 🎯 Pourquoi QSE Studio ?

Les responsables Qualité & HSE des PME et ETI industrielles passent **plus de 40% de leur temps** à relancer des actions par e-mail, corriger des fichiers Excel corrompus et synthétiser manuellement des indicateurs pour la direction.

**QSE Studio** résout ce problème en remplaçant le chaos des tableurs par un outil d'usine moderne :
- 🔒 **100% Souverain & Local** : Vos données industrielles ne quittent jamais votre PC (base SQLite intégrée) ou votre serveur interne.
- ⚡ **Zéro Bruit, 100% Signal** : Tableau de bord orienté décision (actions en retard, temps moyen de résolution, causes racines).
- 🧠 **IA Locale Intégrée (Ollama / Moteur de règles)** : Assistance automatique à l'analyse de causes (Ishikawa 5M & 5 Pourquoi) sans envoyer un seul octet sur le cloud.

---

## ⚖️ Pourquoi remplacer Excel par QSE Studio ?

| Fonctionnalité | 📊 Tableur Excel / Drive | ☁️ SaaS Propriétaire Payant | 🛡️ QSE Studio |
|---|---|---|---|
| **Coût d'utilisation** | Inclus dans Office | 200€ à 1500€ / mois | **100% Gratuit & Open Source** |
| **Souveraineté des données** | Fichiers éparpillés | Cloud tiers (US) | **100% Local (SQLite) ou Auto-hébergé** |
| **Traçabilité ISO 9001/45001** | Falsifiable | Oui | **Audit Trail Inaltérable (INSERT-Only JSON)** |
| **Ergonomie Terrain** | Complexe sur mobile | Souvent lourd | **Interface fluide & Application Desktop (.exe)** |
| **Assistance IA** | Non | Option payante | **IA Locale intégrée (Ollama / Failover)** |

---

## ✨ Fonctionnalités Phares (v0.2.0)

### 📊 1. Tableau de Bord KPI "Signal > Bruit"
- **Alerte visuelle sur les actions CAPA en retard** : Détection immédiate des jalons dépassés (`⚠️`).
- **Graphique de répartition d'Ishikawa** : Visualisation en temps réel des catégories de panne dominantes (*Matériel, Méthode, Matière, Main d'œuvre, Milieu*).
- **Temps moyen de résolution** : Suivi de l'efficacité globale du service QSE.

### 🔍 2. Analyse des Causes Racines (5M & 5 Pourquoi)
- **Diagramme Ishikawa dynamique SVG** : Sélection interactive des catégories d'anomalie.
- **Formulaire 5 Pourquoi guidé** : Cheminement étape par étape pour identifier la cause profonde.
- **Bouton ✨ Suggérer avec l'IA** : Pré-remplissage intelligent des questions et détection automatique de la catégorie via IA local (Ollama) ou moteur de règles.

### 👥 3. Annuaire Utilisateurs & Onboarding Admin (`/users`)
- **Assistant de Premier Lancement** : Détection de base neuve avec attribution automatique des droits Administrateur.
- **Gestion des Habilitations** : Attribution des rôles métiers (`Administrateur`, `Responsable QSE`, `Opérateur Terrain`, `Auditeur`).

### ✅ 4. Kanban CAPA Interactif & Audit Trail ISO
- **Changement de statut en 1 clic** : Boutons d'action rapide (`▶ En cours`, `✓ Terminer`, `✕ Annuler`, `↺ Ré-ouvrir`).
- **Traçabilité ISO 9001/45001** : Enregistrement inaltérable de chaque modification et mouvement dans le Journal d'Audit.
- **Exportation PDF** : Fiche imprimable conforme aux normes d'audit.

---

## 🚀 Démarrage Rapide

### Option A : Application Desktop Windows (.exe)
Aucune installation de serveur ou de dépendance requise.
1. Rendez-vous dans la section [Releases](https://github.com/nhue-lab/qse-studio/releases).
2. Téléchargez le fichier **`QSE-Studio-Setup.exe`** de la version `v0.2.0`.
3. Lancez l'application : elle s'exécute directement sur votre PC avec une base de données local SQLite.

### Option B : Mode Développeur / Auto-Hébergé

```bash
# 1. Cloner le dépôt
git clone https://github.com/nhue-lab/qse-studio.git
cd qse-studio/web-client

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur **`http://localhost:3000`**.

---

## 🗺️ Roadmap de Développement

- [x] **v0.1.0** : MVP State Machine NC, Diagramme Ishikawa SVG & Export PDF.
- [x] **v0.2.0** : Annuaire Utilisateurs, Onboarding Admin, Kanban CAPA interactif & KPIs Signal.
- [ ] **v0.3.0** : Module d'Audits Internes & Grilles de contrôle ISO 9001 / 14001 / 45001.
- [ ] **v0.4.0** : Module d'Évaluation des Risques Professionnels (DUERP).

---

## 🤝 Contribution & Communauté

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une *Issue* ou à soumettre une *Pull Request*.

Si ce projet vous est utile, **pensez à lui donner une ⭐ Star sur GitHub** pour soutenir le développement open source !

---

## 📄 Licence

Ce projet est sous licence **AGPL-3.0** — Voir le fichier [LICENSE](./LICENSE) pour plus de détails.
