'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import './detail.css';
import { IshikawaDiagram } from '../../components/IshikawaDiagram';
import { getDataProvider } from '../../services/provider-manager';
import { NCDetail, AuditEvent, IASuggestion, User, CapaAction } from '../../services/data-provider';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  declared: 'Déclarée',
  analyzing: 'Analyse des causes (5P/Ishikawa)',
  actions_open: 'Actions en cours',
  verifying: 'Vérification d\'efficacité',
  closed: 'Clôturée'
};

function NCDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [nc, setNc] = useState<NCDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'actions' | 'audit'>('analysis');
  const [iaSuggestion, setIaSuggestion] = useState<IASuggestion | null>(null);
  const [iaSuggesting, setIaSuggesting] = useState(false);

  // Modal Création Action CAPA
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [actionAssigneeId, setActionAssigneeId] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // État local du formulaire d'analyse
  const [whyValues, setWhyValues] = useState(['', '', '', '', '']);
  const [rootCause, setRootCause] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchData = async () => {
    if (!id) return;
    try {
      const provider = getDataProvider();
      const detail = await provider.getNCDetail(id);
      setNc(detail);
      setWhyValues([
        detail.why_1 || '',
        detail.why_2 || '',
        detail.why_3 || '',
        detail.why_4 || '',
        detail.why_5 || ''
      ]);
      setRootCause(detail.root_cause || '');
      setSelectedCategory(detail.ishikawa_category || '');

      const history = await provider.getAuditHistory(id);
      setAuditLog(history);

      const userList = await provider.getUsers();
      setUsers(userList);
      if (userList.length > 0 && !actionAssigneeId) {
        setActionAssigneeId(userList[0].id);
      }
    } catch (error) {
      console.error('Erreur de récupération des détails de la NC :', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSuggestIA = async () => {
    if (!nc || !id) return;
    setIaSuggesting(true);
    try {
      const provider = getDataProvider();
      const suggestion = await provider.suggestCauses(id);
      setIaSuggestion(suggestion);
      setSelectedCategory(suggestion.category);
      
      const newWhys = [...whyValues];
      suggestion.suggestedWhys.forEach((why: string, i: number) => {
        if (!newWhys[i]) newWhys[i] = why;
      });
      setWhyValues(newWhys);
    } catch (err) {
      console.error('Erreur suggestion IA :', err);
    } finally {
      setIaSuggesting(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!nc || !id) return;
    try {
      const provider = getDataProvider();
      await provider.updateNCAnalysis(id, {
        why_1: whyValues[0],
        why_2: whyValues[1],
        why_3: whyValues[2],
        why_4: whyValues[3],
        why_5: whyValues[4],
        root_cause: rootCause,
        ishikawa_category: selectedCategory
      });
      alert('Analyse sauvegardée avec succès !');
      fetchData();
    } catch (err) {
      alert('Erreur lors de la sauvegarde de l\'analyse');
    }
  };

  const handleTransitionStatus = async (targetStatus: string, proof?: string) => {
    if (!nc || !id) return;
    try {
      const provider = getDataProvider();
      await provider.updateNCStatus(id, targetStatus, 'admin', proof);
      alert(`Passage au statut [${STATUS_LABELS[targetStatus]}] réussi !`);
      fetchData();
    } catch (err: any) {
      alert(`Erreur de transition : ${err.message}`);
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !actionTitle || !actionAssigneeId || !actionDueDate) return;

    setSubmittingAction(true);
    try {
      const provider = getDataProvider();
      await provider.createCapaAction(id, {
        title: actionTitle.trim(),
        description: actionDesc.trim(),
        assigneeId: actionAssigneeId,
        dueDate: actionDueDate
      });
      setShowActionModal(false);
      setActionTitle('');
      setActionDesc('');
      fetchData();
    } catch (err) {
      alert('Erreur lors de la création de l\'action');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleActionStatusChange = async (actionId: string, targetStatus: 'todo' | 'in_progress' | 'done' | 'cancelled') => {
    if (!id) return;
    try {
      const provider = getDataProvider();
      await provider.updateCapaActionStatus(id, actionId, targetStatus);
      fetchData();
    } catch (err) {
      alert('Erreur lors du changement de statut de l\'action');
    }
  };

  const kanbanColumns = [
    { key: 'todo', label: 'À faire', color: '#6b7280' },
    { key: 'in_progress', label: 'En cours', color: 'var(--accent-blue)' },
    { key: 'done', label: 'Terminée', color: '#10b981' },
    { key: 'cancelled', label: 'Annulée', color: '#ef4444' }
  ];

  const isOverdue = (dateStr: string, status: string) => {
    if (status === 'done' || status === 'cancelled') return false;
    return new Date(dateStr).getTime() < new Date().getTime();
  };

  if (!id) return <div className="container"><p style={{ color: '#ef4444' }}>Identifiant NC manquant.</p></div>;
  if (loading) return <div className="container"><p style={{ color: 'var(--text-secondary)', marginTop: '2rem' }}>Chargement de la fiche NC...</p></div>;
  if (!nc) return <div className="container"><p style={{ color: '#ef4444' }}>NC introuvable.</p></div>;

  return (
    <div className="container">
      <a href="/" className="back-link">
        ← Retour au tableau de bord
      </a>

      {/* En-tête */}
      <div className="nc-header">
        <div className="nc-header-top">
          <h1 className="nc-title">{nc.title}</h1>
          <span className={`badge badge-${nc.status}`}>{STATUS_LABELS[nc.status] || nc.status}</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{nc.description}</p>
        <div className="nc-meta">
          <span><strong>Réf. :</strong> NC-{nc.id.substring(0, 8)}</span>
          <span><strong>Détectée le :</strong> {new Date(nc.detected_at).toLocaleDateString('fr-FR')}</span>
          <span><strong>Gravité :</strong> {nc.severity.toUpperCase()}</span>
        </div>

        {/* Boutons d'actions de statut de la NC */}
        <div className="state-actions" style={{ marginTop: '1.5rem' }}>
          {nc.status === 'declared' && (
            <button className="btn-transition" onClick={() => handleTransitionStatus('analyzing')}>
              ▶ Commencer l'analyse des causes
            </button>
          )}
          {nc.status === 'analyzing' && (
            <button className="btn-transition" onClick={() => handleTransitionStatus('actions_open')}>
              🔓 Valider le plan d'actions (Guardrails)
            </button>
          )}
          {nc.status === 'actions_open' && (
            <button className="btn-transition" onClick={() => handleTransitionStatus('verifying')}>
              🔎 Passer en vérification d'efficacité
            </button>
          )}
          {nc.status === 'verifying' && (
            <button 
              className="btn-transition" 
              onClick={() => {
                const proof = prompt("Veuillez saisir la preuve d'efficacité (requis) :");
                if (proof) handleTransitionStatus('closed', proof);
              }}
            >
              🔒 Clôturer la Non-Conformité
            </button>
          )}
          
          <a
            href={`http://localhost:5000/api/nc/${nc.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ textDecoration: 'none', marginLeft: 'auto' }}
          >
            📄 Exporter la fiche PDF
          </a>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
          🔍 Analyse des causes (5P + Ishikawa)
        </button>
        <button className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`} onClick={() => setActiveTab('actions')}>
          ✅ Plan d'actions CAPA ({nc.actions?.length || 0})
        </button>
        <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          📋 Journal d'audit ({auditLog.length})
        </button>
      </div>

      {/* Onglet : Analyse */}
      {activeTab === 'analysis' && (
        <>
          <div className="detail-section">
            <div className="section-header">
              <h2 className="section-title">Diagramme Ishikawa (5M)</h2>
              <button className="ia-suggest-btn" onClick={handleSuggestIA} disabled={iaSuggesting}>
                {iaSuggesting ? '⏳ Analyse en cours...' : '✨ Suggérer avec l\'IA'}
                {iaSuggestion && (
                  <span className={`ia-source-badge ${iaSuggestion.source === 'ollama_ai' ? 'ollama' : 'rules'}`}>
                    {iaSuggestion.source === 'ollama_ai' ? 'Ollama AI' : 'Règles'}
                  </span>
                )}
              </button>
            </div>

            {iaSuggestion && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', borderLeft: '3px solid var(--accent-blue)', fontSize: '0.875rem' }}>
                <strong>Catégorie suggérée :</strong> {iaSuggestion.category}
              </div>
            )}

            <div className="ishikawa-container">
              <IshikawaDiagram
                activeCategory={selectedCategory}
                onCategoryClick={setSelectedCategory}
              />
            </div>
          </div>

          <div className="detail-section">
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Analyse 5 Pourquoi</h2>
            <div className="why-form">
              {whyValues.map((val, i) => (
                <div key={i} className={`why-step ${val.trim() ? 'filled' : ''}`}>
                  <div className="why-step-number">{i + 1}</div>
                  <div className="why-step-content">
                    <div className="why-step-label">POURQUOI {i + 1}</div>
                    <textarea
                      className="why-step-input"
                      rows={2}
                      placeholder={`Parce que...`}
                      value={val}
                      onChange={(e) => {
                        const newVals = [...whyValues];
                        newVals[i] = e.target.value;
                        setWhyValues(newVals);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>Cause racine identifiée</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Synthèse de la cause profonde..."
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleSaveAnalysis}>
                💾 Sauvegarder l'analyse
              </button>
            </div>
          </div>
        </>
      )}

      {/* Onglet : Actions CAPA */}
      {activeTab === 'actions' && (
        <div className="detail-section">
          <div className="section-header">
            <h2 className="section-title">Plan d'Actions CAPA</h2>
            <button className="btn-primary" onClick={() => setShowActionModal(true)}>
              + Ajouter une action
            </button>
          </div>

          {nc.actions && nc.actions.length > 0 ? (
            <div className="kanban-board" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {kanbanColumns.map(col => (
                <div key={col.key} className="kanban-column">
                  <div className="kanban-column-header" style={{ color: col.color }}>
                    {col.label} ({nc.actions!.filter(a => a.status === col.key).length})
                  </div>
                  {nc.actions!.filter(a => a.status === col.key).map(action => {
                    const overdue = isOverdue(action.due_date, action.status);
                    return (
                      <div key={action.id} className="kanban-card" style={{ borderColor: overdue ? '#ef4444' : undefined }}>
                        <div className="kanban-card-title">{action.title}</div>
                        {action.description && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            {action.description}
                          </p>
                        )}
                        <div className="kanban-card-meta">
                          <div>👤 {action.assignee_first_name} {action.assignee_last_name}</div>
                          <div style={{ color: overdue ? '#ef4444' : 'inherit', fontWeight: overdue ? 700 : 400 }}>
                            📅 {new Date(action.due_date).toLocaleDateString('fr-FR')} {overdue && '⚠️ (En retard)'}
                          </div>
                        </div>

                        {/* Boutons de changement de statut rapide */}
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                          {action.status === 'todo' && (
                            <>
                              <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleActionStatusChange(action.id, 'in_progress')}>
                                ▶ En cours
                              </button>
                              <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#ef4444' }} onClick={() => handleActionStatusChange(action.id, 'cancelled')}>
                                ✕ Annuler
                              </button>
                            </>
                          )}
                          {action.status === 'in_progress' && (
                            <>
                              <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#10b981' }} onClick={() => handleActionStatusChange(action.id, 'done')}>
                                ✓ Terminer
                              </button>
                              <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleActionStatusChange(action.id, 'todo')}>
                                ↺ À faire
                              </button>
                              <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#ef4444' }} onClick={() => handleActionStatusChange(action.id, 'cancelled')}>
                                ✕ Annuler
                              </button>
                            </>
                          )}
                          {action.status === 'done' && (
                            <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleActionStatusChange(action.id, 'in_progress')}>
                              ↺ Ré-ouvrir
                            </button>
                          )}
                          {action.status === 'cancelled' && (
                            <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleActionStatusChange(action.id, 'todo')}>
                              ↺ Ré-activer
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Aucune action CAPA définie pour cette NC.</p>
            </div>
          )}
        </div>
      )}

      {/* Onglet : Journal d'audit */}
      {activeTab === 'audit' && (
        <div className="detail-section">
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Journal d'audit</h2>
          <div className="audit-timeline">
            {auditLog.map(event => (
              <div key={event.id} className="audit-event">
                <div className="audit-event-action">
                  {event.action === 'created' && '✅ NC créée'}
                  {event.action === 'status_changed' && `🔄 Statut de la NC modifié : ${STATUS_LABELS[event.previous_value?.status || ''] || event.previous_value?.status} ➔ ${STATUS_LABELS[event.new_value?.status || ''] || event.new_value?.status}`}
                  {event.action === 'field_updated' && '✏️ Analyse des causes modifiée'}
                  {event.action === 'action_created' && `📌 Action créée : "${event.new_value?.title}" (Assigné à : ${event.new_value?.assignee})`}
                  {event.action === 'action_status_changed' && `⚡ Action "${event.previous_value?.action}" : ${event.previous_value?.status || 'État précédent'} ➔ ${event.new_value?.status}`}
                </div>
                <div className="audit-event-meta">
                  Par {event.actor_first_name} {event.actor_last_name} · {new Date(event.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {auditLog.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aucune entrée dans le journal.</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL CREATION ACTION CAPA */}
      {showActionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Nouvelle Action CAPA</h2>
            <form onSubmit={handleCreateAction}>
              <div className="form-group">
                <label>Intitulé de l'action *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ex: Remplacement du composant défectueux et formation"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Description des travaux / consignes</label>
                <textarea 
                  className="form-control" 
                  rows={3}
                  placeholder="Détails de l'intervention à réaliser..."
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Assigner à (Utilisateur Annuaire) *</label>
                  <select 
                    className="form-control"
                    value={actionAssigneeId}
                    onChange={(e) => setActionAssigneeId(e.target.value)}
                    required
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} ({u.role === 'admin' ? 'Admin' : u.role === 'qse_manager' ? 'QSE' : 'Opérateur'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date limite d'exécution *</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={actionDueDate}
                    onChange={(e) => setActionDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowActionModal(false)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submittingAction}
                >
                  {submittingAction ? 'Enregistrement...' : 'Ajouter l\'action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NCDetailPage() {
  return (
    <Suspense fallback={<div className="container"><p>Chargement de la page...</p></div>}>
      <NCDetailContent />
    </Suspense>
  );
}
