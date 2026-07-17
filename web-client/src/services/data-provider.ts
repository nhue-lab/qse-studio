export interface NonConformity {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'declared' | 'analyzing' | 'actions_open' | 'verifying' | 'closed';
  severity: 'minor' | 'major' | 'critical';
  detected_at: string;
  reporter_first_name?: string;
  reporter_last_name?: string;
  total_actions?: number;
  completed_actions?: number;
}

export interface CapaAction {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  assignee_first_name: string;
  assignee_last_name: string;
  due_date: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  actor_first_name: string;
  actor_last_name: string;
  previous_value?: any;
  new_value?: any;
  created_at: string;
}

export interface NCDetail extends NonConformity {
  why_1?: string;
  why_2?: string;
  why_3?: string;
  why_4?: string;
  why_5?: string;
  root_cause?: string;
  ishikawa_category?: string;
  effectiveness_proof?: string;
  actions?: CapaAction[];
}

export interface IASuggestion {
  category: string;
  suggestedWhys: string[];
  source: 'ollama_ai' | 'rules_engine_fallback';
}

/**
 * Interface d'accès aux données agnostique (Local SQLite vs API Serveur).
 * Inspirée du pattern Skill / Provider d'agentic-builder.
 */
export interface IDataProvider {
  getNCList(): Promise<NonConformity[]>;
  getNCDetail(id: string): Promise<NCDetail>;
  createNC(title: string, description: string, severity: 'minor' | 'major' | 'critical'): Promise<NonConformity>;
  updateNCAnalysis(
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
  ): Promise<NCDetail>;
  updateNCStatus(id: string, targetStatus: string, role: string, proof?: string): Promise<NonConformity>;
  suggestCauses(id: string): Promise<IASuggestion>;
  getAuditHistory(id: string): Promise<AuditEvent[]>;
}
