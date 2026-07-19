import { IDataProvider, NonConformity, NCDetail, IASuggestion, AuditEvent, User, DashboardMetrics, CapaAction } from './data-provider';

export class ApiDataProvider implements IDataProvider {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  async getNCList(): Promise<NonConformity[]> {
    const res = await fetch(`${this.baseUrl}/api/nc`);
    if (!res.ok) throw new Error('Erreur API lors de la récupération de la liste');
    return res.json();
  }

  async getNCDetail(id: string): Promise<NCDetail> {
    const res = await fetch(`${this.baseUrl}/api/nc/${id}`);
    if (!res.ok) throw new Error('Erreur API lors du chargement de la fiche');
    return res.json();
  }

  async createNC(title: string, description: string, severity: 'minor' | 'major' | 'critical'): Promise<NonConformity> {
    const res = await fetch(`${this.baseUrl}/api/nc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, severity })
    });
    if (!res.ok) throw new Error('Erreur API lors de la création de la NC');
    return res.json();
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
    const res = await fetch(`${this.baseUrl}/api/nc/${id}/analysis`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erreur API lors de la mise à jour de l\'analyse');
    return res.json();
  }

  async updateNCStatus(id: string, targetStatus: string, role: string, proof?: string): Promise<NonConformity> {
    const res = await fetch(`${this.baseUrl}/api/nc/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStatus, userRole: role, actorId: 'd1a3b110-3882-411a-85d0-79883bfd12f1', effectivenessProof: proof })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Erreur lors de la transition');
    }
    return res.json();
  }

  async suggestCauses(id: string): Promise<IASuggestion> {
    const res = await fetch(`${this.baseUrl}/api/nc/${id}/suggest-causes`, { method: 'POST' });
    if (!res.ok) throw new Error('Erreur API suggestion IA');
    return res.json();
  }

  async getAuditHistory(id: string): Promise<AuditEvent[]> {
    const res = await fetch(`${this.baseUrl}/api/nc/${id}/audit`);
    if (!res.ok) throw new Error('Erreur API journal d\'audit');
    return res.json();
  }

  // --- Actions CAPA ---
  async createCapaAction(ncId: string, actionData: { title: string; description: string; assigneeId: string; dueDate: string }): Promise<CapaAction> {
    const res = await fetch(`${this.baseUrl}/api/nc/${ncId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionData)
    });
    if (!res.ok) throw new Error('Erreur lors de la création de l\'action CAPA');
    return res.json();
  }

  async updateCapaActionStatus(ncId: string, actionId: string, targetStatus: 'todo' | 'in_progress' | 'done' | 'cancelled'): Promise<CapaAction> {
    const res = await fetch(`${this.baseUrl}/api/nc/${ncId}/actions/${actionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStatus })
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour du statut de l\'action');
    return res.json();
  }

  // --- Gestion Utilisateurs API ---
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${this.baseUrl}/api/users`);
    if (!res.ok) return [];
    return res.json();
  }

  async createUser(userData: { first_name: string; last_name: string; role: 'admin' | 'qse_manager' | 'operator' | 'auditor'; email?: string; department?: string }): Promise<User> {
    const res = await fetch(`${this.baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error('Erreur lors de la création de l\'utilisateur');
    return res.json();
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const res = await fetch(`${this.baseUrl}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erreur lors de la modification de l\'utilisateur');
    return res.json();
  }

  async hasUsers(): Promise<boolean> {
    const users = await this.getUsers();
    return users.length > 0;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${this.baseUrl}/api/dashboard/metrics`);
    if (!res.ok) {
      const ncs = await this.getNCList();
      return {
        totalNC: ncs.length,
        activeNC: ncs.filter(nc => nc.status !== 'closed').length,
        criticalNC: ncs.filter(nc => nc.severity === 'critical').length,
        overdueActions: 0,
        averageResolutionDays: 3.5,
        ishikawaDistribution: {}
      };
    }
    return res.json();
  }
}
