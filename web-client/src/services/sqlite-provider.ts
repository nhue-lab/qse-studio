import { IDataProvider, NonConformity, NCDetail, IASuggestion, AuditEvent, CapaAction } from './data-provider';
import { ApiDataProvider } from './api-provider';

// Mode Démo volatil en mémoire
let mockNCs: NCDetail[] = [
  {
    id: 'a2c3b110-3882-411a-85d0-79883bfd22f1',
    title: "Fuite d'huile hydraulique sur Presse Plieuse #4",
    description: "Une fuite importante d'huile hydraulique a été détectée sous la presse plieuse n°4 lors de la prise de poste. Risque de glissade immédiat et baisse de pression sur la machine.",
    status: 'analyzing',
    severity: 'major',
    detected_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reporter_first_name: 'Jean',
    reporter_last_name: 'Dupond',
    ishikawa_category: 'Matériel',
    why_1: "Pourquoi l'huile est au sol ? Car le réservoir fuit.",
    why_2: "Pourquoi le réservoir fuit ? Car le joint du raccord est usé.",
    why_3: "Pourquoi le joint est usé ? Car il n'a pas été remplacé lors de la dernière maintenance.",
    why_4: '',
    why_5: '',
    root_cause: '',
    total_actions: 1,
    completed_actions: 0,
    actions: [
      {
        id: 'a1',
        title: 'Remplacement du joint et nettoyage',
        description: 'Changer le joint du raccord hydraulique et nettoyer la flaque d\'huile.',
        status: 'todo',
        assignee_first_name: 'Jean',
        assignee_last_name: 'Dupond',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]
  },
  {
    id: 'a2c3b110-3882-411a-85d0-79883bfd22f2',
    title: "Absence de garde-corps sur trémie au 2ème étage",
    description: "Lors de l'inspection sécurité hebdomadaire du chantier Résidence Les Pins, il a été constaté qu'une trémie de passage de gaine technique au 2ème étage n'était pas protégée par un garde-corps.",
    status: 'declared',
    severity: 'critical',
    detected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    reporter_first_name: 'Sophie',
    reporter_last_name: 'Martin',
    total_actions: 1,
    completed_actions: 0,
    actions: [
      {
        id: 'a2',
        title: 'Installation immédiate de protection collective',
        description: 'Mettre en place un garde-corps temporaire réglementaire.',
        status: 'in_progress',
        assignee_first_name: 'Sophie',
        assignee_last_name: 'Martin',
        due_date: new Date().toISOString(),
      }
    ]
  }
];

let mockAuditLogs: Record<string, AuditEvent[]> = {
  'a2c3b110-3882-411a-85d0-79883bfd22f1': [
    {
      id: 'e1',
      action: 'created',
      actor_first_name: 'Jean',
      actor_last_name: 'Dupond',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'e2',
      action: 'status_changed',
      actor_first_name: 'Marc',
      actor_last_name: 'QSE',
      previous_value: { status: 'declared' },
      new_value: { status: 'analyzing' },
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

/**
 * Provider unifié SQLite / Simulation.
 * Gère le mode solo en utilisant SQLite si Tauri est actif,
 * sinon retombe gracieusement sur un état en mémoire RAM (mode démo).
 */
export class SqliteDataProvider implements IDataProvider {
  private isTauriAvailable = false;
  private tauriDb: any = null;

  constructor() {
    // Détection de l'environnement Tauri à l'exécution
    if (typeof window !== 'undefined' && (window as any).__TAURI_METADATA__) {
      this.isTauriAvailable = true;
      this.initTauriSqlite();
    }
  }

  private async initTauriSqlite() {
    try {
      // Import dynamique de Tauri Database Plugin
      const Database = (await import('@tauri-apps/plugin-sql')).default;
      this.tauriDb = await Database.load('sqlite:qse_studio.db');
      console.log('[SQLite] Base locale SQLite chargée avec succès via Tauri.');
      
      // Création des tables si elles n'existent pas
      await this.tauriDb.execute(`
        CREATE TABLE IF NOT EXISTS non_conformities (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL,
          severity TEXT NOT NULL,
          detected_at TEXT NOT NULL,
          why_1 TEXT, why_2 TEXT, why_3 TEXT, why_4 TEXT, why_5 TEXT,
          root_cause TEXT, ishikawa_category TEXT, effectiveness_proof TEXT
        );
      `);
      
      // Charger les données initiales de démo si la table est vide
      const rows = await this.tauriDb.select('SELECT COUNT(*) as count FROM non_conformities');
      if (rows[0].count === 0) {
        for (const nc of mockNCs) {
          await this.tauriDb.execute(
            `INSERT INTO non_conformities (id, title, description, status, severity, detected_at, why_1, why_2, why_3, ishikawa_category)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [nc.id, nc.title, nc.description, nc.status, nc.severity, nc.detected_at, nc.why_1, nc.why_2, nc.why_3, nc.ishikawa_category]
          );
        }
      }
    } catch (err) {
      console.error('[SQLite] Échec de l\'initialisation de la base SQLite Tauri :', err);
      this.isTauriAvailable = false;
    }
  }

  async getNCList(): Promise<NonConformity[]> {
    if (this.isTauriAvailable && this.tauriDb) {
      const rows = await this.tauriDb.select('SELECT * FROM non_conformities ORDER BY detected_at DESC');
      return rows;
    }
    return mockNCs;
  }

  async getNCDetail(id: string): Promise<NCDetail> {
    if (this.isTauriAvailable && this.tauriDb) {
      const rows = await this.tauriDb.select('SELECT * FROM non_conformities WHERE id = $1', [id]);
      if (rows.length === 0) throw new Error('NC introuvable');
      return rows[0];
    }
    const found = mockNCs.find(nc => nc.id === id);
    if (!found) throw new Error('NC introuvable');
    return found;
  }

  async createNC(title: string, description: string, severity: 'minor' | 'major' | 'critical'): Promise<NonConformity> {
    const newNC: NonConformity = {
      id: `nc_${Date.now()}`,
      title,
      description,
      status: 'declared',
      severity,
      detected_at: new Date().toISOString(),
      reporter_first_name: 'Marc',
      reporter_last_name: 'QSE',
      total_actions: 0,
      completed_actions: 0
    };

    if (this.isTauriAvailable && this.tauriDb) {
      await this.tauriDb.execute(
        `INSERT INTO non_conformities (id, title, description, status, severity, detected_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newNC.id, newNC.title, newNC.description, newNC.status, newNC.severity, newNC.detected_at]
      );
      return newNC;
    }

    mockNCs = [newNC as NCDetail, ...mockNCs];
    return newNC;
  }

  async updateNCAnalysis(
    id: string, 
    data: {
      why_1?: string;
      why_2?: string;
      why_3?: string;
      why_4?: string;
      why_5?: string;
      root_cause?: string;
      ishikawa_category?: string;
    }
  ): Promise<NCDetail> {
    if (this.isTauriAvailable && this.tauriDb) {
      await this.tauriDb.execute(
        `UPDATE non_conformities
         SET why_1 = COALESCE($1, why_1), why_2 = COALESCE($2, why_2), why_3 = COALESCE($3, why_3),
             why_4 = COALESCE($4, why_4), why_5 = COALESCE($5, why_5),
             root_cause = COALESCE($6, root_cause), ishikawa_category = COALESCE($7, ishikawa_category)
         WHERE id = $8`,
        [data.why_1, data.why_2, data.why_3, data.why_4, data.why_5, data.root_cause, data.ishikawa_category, id]
      );
      return this.getNCDetail(id);
    }

    const idx = mockNCs.findIndex(nc => nc.id === id);
    if (idx !== -1) {
      mockNCs[idx] = { ...mockNCs[idx], ...data };
      return mockNCs[idx];
    }
    throw new Error('NC introuvable');
  }

  async updateNCStatus(id: string, targetStatus: string, role: string, proof?: string): Promise<NonConformity> {
    if (this.isTauriAvailable && this.tauriDb) {
      await this.tauriDb.execute(
        `UPDATE non_conformities SET status = $1, effectiveness_proof = COALESCE($2, effectiveness_proof) WHERE id = $3`,
        [targetStatus, proof, id]
      );
      return this.getNCDetail(id);
    }

    const idx = mockNCs.findIndex(nc => nc.id === id);
    if (idx !== -1) {
      mockNCs[idx] = { ...mockNCs[idx], status: targetStatus as any, effectiveness_proof: proof || mockNCs[idx].effectiveness_proof };
      return mockNCs[idx];
    }
    throw new Error('NC introuvable');
  }

  async suggestCauses(id: string): Promise<IASuggestion> {
    // Mode local/solo : utilise directement le moteur de règles pour la vitesse et la simplicité
    const detail = await this.getNCDetail(id);
    // Simulation simple de rules-engine
    return {
      category: detail.ishikawa_category || 'Matériel',
      suggestedWhys: [
        "Pourquoi l'équipement est-il en panne ?",
        "Pourquoi le plan de maintenance n'a-t-il pas anticipé l'usure ?"
      ],
      source: 'rules_engine_fallback'
    };
  }

  async getAuditHistory(id: string): Promise<AuditEvent[]> {
    return mockAuditLogs[id] || [];
  }
}
