import { IDataProvider, NonConformity, NCDetail, IASuggestion, AuditEvent, User, DashboardMetrics, CapaAction } from './data-provider';

let mockUsers: User[] = [
  {
    id: 'u1',
    first_name: 'Marc',
    last_name: 'QSE',
    role: 'admin',
    email: 'marc.qse@usine-exemple.fr',
    department: 'Qualité & Sécurité',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'u2',
    first_name: 'Sophie',
    last_name: 'Martin',
    role: 'qse_manager',
    email: 'sophie.martin@usine-exemple.fr',
    department: 'Sécurité & Environnement',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'u3',
    first_name: 'Jean',
    last_name: 'Dupond',
    role: 'operator',
    email: 'jean.dupond@usine-exemple.fr',
    department: 'Production',
    is_active: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

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
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
    ishikawa_category: 'Milieu',
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

export class SqliteDataProvider implements IDataProvider {
  private isTauriAvailable = false;
  private tauriDb: any = null;

  constructor() {
    if (typeof window !== 'undefined' && (window as any).__TAURI_METADATA__) {
      this.isTauriAvailable = true;
      this.initTauriSqlite();
    }
  }

  private async initTauriSqlite() {
    try {
      const Database = (await import('@tauri-apps/plugin-sql')).default;
      this.tauriDb = await Database.load('sqlite:qse_studio.db');
      
      await this.tauriDb.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          role TEXT NOT NULL,
          email TEXT,
          department TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL
        );
      `);

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

      await this.tauriDb.execute(`
        CREATE TABLE IF NOT EXISTS capa_actions (
          id TEXT PRIMARY KEY,
          nc_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL,
          assignee_first_name TEXT NOT NULL,
          assignee_last_name TEXT NOT NULL,
          due_date TEXT NOT NULL
        );
      `);
      
      const userRows = await this.tauriDb.select('SELECT COUNT(*) as count FROM users');
      if (userRows[0].count === 0) {
        for (const u of mockUsers) {
          await this.tauriDb.execute(
            `INSERT INTO users (id, first_name, last_name, role, email, department, is_active, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [u.id, u.first_name, u.last_name, u.role, u.email, u.department, u.is_active ? 1 : 0, u.created_at]
          );
        }
      }

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
      const nc = rows[0];
      const actions = await this.tauriDb.select('SELECT * FROM capa_actions WHERE nc_id = $1', [id]);
      return { ...nc, actions };
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
      completed_actions: 0,
      actions: []
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
    const detail = await this.getNCDetail(id);
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

  // --- Actions CAPA & Traçabilité Audit ---
  async createCapaAction(ncId: string, actionData: { title: string; description: string; assigneeId: string; dueDate: string }): Promise<CapaAction> {
    const users = await this.getUsers();
    const assignee = users.find(u => u.id === actionData.assigneeId) || { first_name: 'Agent', last_name: 'QSE' };

    const newAction: CapaAction = {
      id: `act_${Date.now()}`,
      title: actionData.title,
      description: actionData.description,
      status: 'todo',
      assignee_first_name: assignee.first_name,
      assignee_last_name: assignee.last_name,
      due_date: actionData.dueDate
    };

    if (this.isTauriAvailable && this.tauriDb) {
      await this.tauriDb.execute(
        `INSERT INTO capa_actions (id, nc_id, title, description, status, assignee_first_name, assignee_last_name, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newAction.id, ncId, newAction.title, newAction.description, newAction.status, newAction.assignee_first_name, newAction.assignee_last_name, newAction.due_date]
      );
    } else {
      const nc = mockNCs.find(n => n.id === ncId);
      if (nc) {
        if (!nc.actions) nc.actions = [];
        nc.actions.push(newAction);
        nc.total_actions = nc.actions.length;
      }
    }

    // Enregistrement de l'événement dans le journal d'audit
    if (!mockAuditLogs[ncId]) mockAuditLogs[ncId] = [];
    mockAuditLogs[ncId].unshift({
      id: `e_${Date.now()}`,
      action: 'action_created',
      actor_first_name: 'Administrateur',
      actor_last_name: 'QSE',
      new_value: { title: newAction.title, status: 'À faire', assignee: `${assignee.first_name} ${assignee.last_name}` },
      created_at: new Date().toISOString()
    });

    return newAction;
  }

  async updateCapaActionStatus(ncId: string, actionId: string, targetStatus: 'todo' | 'in_progress' | 'done' | 'cancelled'): Promise<CapaAction> {
    let updatedAction: CapaAction | null = null;
    let oldStatusLabel = '';
    const statusLabels: Record<string, string> = {
      todo: 'À faire',
      in_progress: 'En cours',
      done: 'Terminée',
      cancelled: 'Annulée'
    };

    if (this.isTauriAvailable && this.tauriDb) {
      await this.tauriDb.execute(
        `UPDATE capa_actions SET status = $1 WHERE id = $2 AND nc_id = $3`,
        [targetStatus, actionId, ncId]
      );
      const rows = await this.tauriDb.select('SELECT * FROM capa_actions WHERE id = $1', [actionId]);
      if (rows.length > 0) updatedAction = rows[0];
    } else {
      const nc = mockNCs.find(n => n.id === ncId);
      if (nc && nc.actions) {
        const act = nc.actions.find(a => a.id === actionId);
        if (act) {
          oldStatusLabel = statusLabels[act.status] || act.status;
          act.status = targetStatus;
          nc.completed_actions = nc.actions.filter(a => a.status === 'done').length;
          updatedAction = { ...act };
        }
      }
    }

    if (!updatedAction) throw new Error('Action CAPA introuvable');

    // Traçabilité Audit Trail
    if (!mockAuditLogs[ncId]) mockAuditLogs[ncId] = [];
    mockAuditLogs[ncId].unshift({
      id: `e_${Date.now()}`,
      action: 'action_status_changed',
      actor_first_name: 'Administrateur',
      actor_last_name: 'QSE',
      previous_value: { action: updatedAction.title, status: oldStatusLabel },
      new_value: { action: updatedAction.title, status: statusLabels[targetStatus] || targetStatus },
      created_at: new Date().toISOString()
    });

    return updatedAction;
  }

  // --- Gestion Utilisateurs ---
  async getUsers(): Promise<User[]> {
    if (this.isTauriAvailable && this.tauriDb) {
      const rows = await this.tauriDb.select('SELECT * FROM users ORDER BY created_at ASC');
      return rows.map((r: any) => ({ ...r, is_active: Boolean(r.is_active) }));
    }
    return mockUsers;
  }

  async createUser(userData: { first_name: string; last_name: string; role: 'admin' | 'qse_manager' | 'operator' | 'auditor'; email?: string; department?: string }): Promise<User> {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      ...userData,
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (this.isTauriAvailable && this.tauriDb) {
      await this.tauriDb.execute(
        `INSERT INTO users (id, first_name, last_name, role, email, department, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newUser.id, newUser.first_name, newUser.last_name, newUser.role, newUser.email || null, newUser.department || null, 1, newUser.created_at]
      );
      return newUser;
    }

    mockUsers.push(newUser);
    return newUser;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    if (this.isTauriAvailable && this.tauriDb) {
      const existing = await this.tauriDb.select('SELECT * FROM users WHERE id = $1', [id]);
      if (existing.length === 0) throw new Error('Utilisateur introuvable');
      const updated = { ...existing[0], ...data };
      await this.tauriDb.execute(
        `UPDATE users SET first_name=$1, last_name=$2, role=$3, email=$4, department=$5, is_active=$6 WHERE id=$7`,
        [updated.first_name, updated.last_name, updated.role, updated.email, updated.department, updated.is_active ? 1 : 0, id]
      );
      return updated;
    }

    const idx = mockUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      mockUsers[idx] = { ...mockUsers[idx], ...data };
      return mockUsers[idx];
    }
    throw new Error('Utilisateur introuvable');
  }

  async hasUsers(): Promise<boolean> {
    const users = await this.getUsers();
    return users.length > 0;
  }

  // --- Dashboard KPI Métriques (Signal > Bruit) ---
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const ncs = await this.getNCList();
    const totalNC = ncs.length;
    const activeNC = ncs.filter(nc => nc.status !== 'closed').length;
    const criticalNC = ncs.filter(nc => nc.severity === 'critical').length;

    let overdueActions = 0;
    const now = new Date().getTime();

    const ishikawaDistribution: Record<string, number> = {
      'Matière': 0,
      'Matériel': 0,
      'Méthode': 0,
      'Main d\'œuvre': 0,
      'Milieu': 0,
      'Non défini': 0
    };

    ncs.forEach(nc => {
      const cat = nc.ishikawa_category || 'Non défini';
      ishikawaDistribution[cat] = (ishikawaDistribution[cat] || 0) + 1;

      if (nc.actions) {
        nc.actions.forEach(act => {
          if (act.status !== 'done' && act.status !== 'cancelled' && act.due_date) {
            if (new Date(act.due_date).getTime() < now) {
              overdueActions++;
            }
          }
        });
      }
    });

    const averageResolutionDays = totalNC > 0 ? 4.2 : 0;

    return {
      totalNC,
      activeNC,
      criticalNC,
      overdueActions,
      averageResolutionDays,
      ishikawaDistribution
    };
  }
}
