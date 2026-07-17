'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import './detail.css';
import { IshikawaDiagram } from '../../components/IshikawaDiagram';
import { getDataProvider } from '../../services/provider-manager';
import { NCDetail, AuditEvent, IASuggestion } from '../../services/data-provider';

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
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'actions' | 'audit'>('analysis');
  const [iaSuggestion, setIaSuggestion] = useState<IASuggestion | null>(null);
  const [iaSuggesting, setIaSuggesting] = useState(false);

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

  const kanbanColumns = [
    { key: 'todo', label: 'À faire' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'done', label: 'Terminée' }
  ];

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

        {/* Boutons d'actions */}
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

      {/* Onglet : Actions */}
      {activeTab === 'actions' && (
        <div className="detail-section">
          <div className="section-header">
            <h2 className="section-title">Plan d'Actions CAPA</h2>
            <button className="btn-primary">+ Ajouter une action</button>
          </div>

          {nc.actions && nc.actions.length > 0 ? (
            <div className="kanban-board">
              {kanbanColumns.map(col => (
                <div key={col.key} className="kanban-column">
                  <div className="kanban-column-header">{col.label}</div>
                  {nc.actions!.filter(a => a.status === col.key).map(action => (
                    <div key={action.id} className="kanban-card">
                      <div className="kanban-card-title">{action.title}</div>
                      <div className="kanban-card-meta">
                        👤 {action.assignee_first_name} {action.assignee_last_name}<br />
                        📅 {new Date(action.due_date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))}
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
                  {event.action === 'status_changed' && `🔄 Statut modifié : ${STATUS_LABELS[event.previous_value?.status || ''] || event.previous_value?.status} ➔ ${STATUS_LABELS[event.new_value?.status || ''] || event.new_value?.status}`}
                  {event.action === 'field_updated' && '✏️ Analyse des causes modifiée'}
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
