'use client';

import React, { useEffect, useState } from 'react';
import { getDataProvider, getServerUrl, setServerUrl } from '../services/provider-manager';
import { NonConformity, DashboardMetrics } from '../services/data-provider';
import { OnboardingModal } from '../components/OnboardingModal';
import { QRCodeModal } from '../components/QRCodeModal';

export default function Dashboard() {
  const [ncs, setNcs] = useState<NonConformity[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrlState] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Formulaire modal state NC
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState<'minor' | 'major' | 'critical'>('minor');
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const provider = getDataProvider();

      const userExists = await provider.hasUsers();
      if (!userExists) {
        setShowOnboarding(true);
      }

      const list = await provider.getNCList();
      const m = await provider.getDashboardMetrics();
      setNcs(list);
      setMetrics(m);
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord :', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (typeof window !== 'undefined') {
      setServerUrlState(getServerUrl() || '');
    }
  }, []);

  const handleCreateNC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) return;

    setSubmitting(true);
    try {
      const provider = getDataProvider();
      await provider.createNC(newTitle, newDescription, newSeverity);
      setShowModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewSeverity('minor');
      fetchDashboardData();
    } catch (err) {
      alert('Erreur lors de la création de la NC');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setServerUrl(serverUrl.trim() !== '' ? serverUrl.trim() : null);
    setShowConfig(false);
    fetchDashboardData();
  };

  const handleExportCSV = () => {
    if (ncs.length === 0) {
      alert('Aucune donnée à exporter.');
      return;
    }

    const headers = ['ID', 'Titre', 'Description', 'Gravite', 'Statut', 'Date Detection', 'Actions Realisees', 'Actions Totales'];
    const rows = ncs.map(nc => [
      `NC-${nc.id.substring(0, 8)}`,
      `"${nc.title.replace(/"/g, '""')}"`,
      `"${nc.description.replace(/"/g, '""')}"`,
      nc.severity.toUpperCase(),
      nc.status.toUpperCase(),
      new Date(nc.detected_at).toLocaleDateString('fr-FR'),
      nc.completed_actions || 0,
      nc.total_actions || 0
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `registre_non_conformites_qse_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'declared': return 'Déclarée';
      case 'analyzing': return 'Analyse (5P/Ishikawa)';
      case 'actions_open': return 'Actions en cours';
      case 'verifying': return 'Vérification d\'efficacité';
      case 'closed': return 'Clôturée';
      default: return status;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'minor': return 'Mineure';
      case 'major': return 'Majeure';
      case 'critical': return 'Critique';
      default: return severity;
    }
  };

  return (
    <div className="container">
      {/* Onboarding Admin Modal au premier lancement */}
      {showOnboarding && (
        <OnboardingModal 
          onComplete={() => {
            setShowOnboarding(false);
            fetchDashboardData();
          }} 
        />
      )}

      {/* Modal QR Code Imprimable */}
      {showQRModal && (
        <QRCodeModal onClose={() => setShowQRModal(false)} />
      )}

      <div className="section-header">
        <div>
          <h1 className="dashboard-title">Tableau de Bord QSE</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Indicateurs clés de performance (KPI) et pilotage des actions correctives.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className="btn-secondary" 
            onClick={() => setShowQRModal(true)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            📱 QR Code Terrain
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => setShowConfig(true)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            ⚙️ Paramètres
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Mode : {serverUrl ? '🏢 Connecté (Serveur)' : '💻 Autonome (Local)'}
          </span>
        </div>
      </div>

      {/* Cartes KPI "Signal > Bruit" */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-title">NC Actives / Ouvertes</div>
          <div className="kpi-value" style={{ color: 'var(--status-actions)' }}>
            {metrics ? metrics.activeNC : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Sur {metrics ? metrics.totalNC : 0} déclarées au total
          </div>
        </div>

        <div className="kpi-card" style={{ borderColor: metrics && metrics.overdueActions > 0 ? '#ef4444' : 'var(--border-color)' }}>
          <div className="kpi-title">Actions CAPA en Retard</div>
          <div className="kpi-value" style={{ color: metrics && metrics.overdueActions > 0 ? '#ef4444' : '#10b981' }}>
            {metrics ? metrics.overdueActions : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: metrics && metrics.overdueActions > 0 ? '#ef4444' : 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {metrics && metrics.overdueActions > 0 ? '⚠️ Action immédiate requise' : '✓ Aucune action hors délai'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Gravité Critique</div>
          <div className="kpi-value" style={{ color: '#ef4444' }}>
            {metrics ? metrics.criticalNC : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Dangers / Arrêts immédiats
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Temps Moyen de Résolution</div>
          <div className="kpi-value" style={{ color: 'var(--accent-blue)' }}>
            {metrics ? `${metrics.averageResolutionDays} j` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Délai moyen de clôture
          </div>
        </div>
      </div>

      {/* ISHIKAWA CAUSES DISTRIBUTION (SIGNAL KPI) */}
      {metrics && metrics.ishikawaDistribution && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            📌 Répartition des Origines de Panne / NC (Diagramme d'Ishikawa)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {Object.entries(metrics.ishikawaDistribution).map(([category, count]) => {
              const percentage = metrics.totalNC > 0 ? Math.round((count / metrics.totalNC) * 100) : 0;
              return (
                <div key={category} style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                    <span>{category}</span>
                    <span style={{ fontWeight: 700 }}>{count} ({percentage}%)</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--accent-blue)', borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des Non-Conformités */}
      <div className="nc-list-section">
        <div className="section-header">
          <h2 className="section-title">Non-Conformités & CAPA Récentes</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={handleExportCSV}>
              📊 Exporter Excel / CSV
            </button>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              + Déclarer une NC
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Chargement en cours...</p>
        ) : ncs.length === 0 ? (
          <div className="empty-state">
            <p>Aucune non-conformité déclarée pour le moment.</p>
          </div>
        ) : (
          <table className="nc-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Détectée le</th>
                <th>Gravité</th>
                <th>Statut (State Machine)</th>
                <th>Actions CAPA</th>
              </tr>
            </thead>
            <tbody>
              {ncs.map((nc) => (
                <tr key={nc.id}>
                  <td style={{ fontWeight: 600 }}>
                    <a href={`/nc?id=${nc.id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                      {nc.title}
                    </a>
                  </td>
                  <td>{formatDate(nc.detected_at)}</td>
                  <td>
                    <div className={`severity severity-${nc.severity}`}>
                      <div className="severity-dot"></div>
                      <span>{getSeverityLabel(nc.severity)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${nc.status}`}>
                      {getStatusLabel(nc.status)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {nc.completed_actions || 0} / {nc.total_actions || 0} faites
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CONFIGURATION SERVEUR */}
      {showConfig && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Paramètres de connexion</h2>
            <form onSubmit={handleSaveConfig}>
              <div className="form-group">
                <label>Adresse du serveur QSE Studio</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ex: http://localhost:5000 (Laissez vide pour le mode local)"
                  value={serverUrl}
                  onChange={(e) => setServerUrlState(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                  Laissez ce champ vide pour travailler en mode solo et enregistrer vos données sur votre PC (SQLite).
                </span>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowConfig(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREATION NC */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Déclarer une Non-Conformité</h2>
            <form onSubmit={handleCreateNC}>
              <div className="form-group">
                <label>Titre de l'anomalie</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ex: Fuite d'huile sur la presse plieuse #4"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Description détaillée</label>
                <textarea 
                  className="form-control" 
                  rows={4}
                  placeholder="Décrivez précisément ce qui a été constaté sur le terrain..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Niveau de gravité</label>
                <select 
                  className="form-control"
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                >
                  <option value="minor">Mineure (pas de risque immédiat)</option>
                  <option value="major">Majeure (impact de production / risque moyen)</option>
                  <option value="critical">Critique (danger immédiat / arrêt requis)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Enregistrement...' : 'Valider & Déclarer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
