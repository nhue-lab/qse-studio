'use client';

import React, { useEffect, useState } from 'react';
import { getDataProvider, getServerUrl, setServerUrl } from '../services/provider-manager';
import { NonConformity } from '../services/data-provider';

export default function Dashboard() {
  const [ncs, setNcs] = useState<NonConformity[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrlState] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Formulaire modal state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState<'minor' | 'major' | 'critical'>('minor');
  const [submitting, setSubmitting] = useState(false);

  const fetchNCs = async () => {
    setLoading(true);
    try {
      const provider = getDataProvider();
      const list = await provider.getNCList();
      setNcs(list);
    } catch (error) {
      console.error('Erreur lors du chargement des NC :', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNCs();
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
      fetchNCs(); // Rafraîchir
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
    fetchNCs(); // Recharger avec le nouveau provider
  };

  const totalNC = ncs.length;
  const criticalNC = ncs.filter(nc => nc.severity === 'critical').length;
  const activeNC = ncs.filter(nc => nc.status !== 'closed').length;

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
      <div className="section-header">
        <h1 className="dashboard-title">Tableau de Bord QSE</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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

      {/* Cartes KPI */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Non-Conformités</div>
          <div className="kpi-value">{totalNC}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">NC en Cours (Actives)</div>
          <div className="kpi-value" style={{ color: 'var(--status-actions)' }}>{activeNC}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Gravité Critique</div>
          <div className="kpi-value" style={{ color: '#ef4444' }}>{criticalNC}</div>
        </div>
      </div>

      {/* Liste des Non-Conformités */}
      <div className="nc-list-section">
        <div className="section-header">
          <h2 className="section-title">Non-Conformités & CAPA Récentes</h2>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Déclarer une NC
          </button>
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
