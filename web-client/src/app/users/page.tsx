'use client';

import React, { useEffect, useState } from 'react';
import { getDataProvider } from '../../services/provider-manager';
import { User } from '../../services/data-provider';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<'admin' | 'qse_manager' | 'operator' | 'auditor'>('operator');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const provider = getDataProvider();
      const list = await provider.getUsers();
      setUsers(list);
    } catch (err) {
      console.error('Erreur chargement utilisateurs :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;

    setSubmitting(true);
    try {
      const provider = getDataProvider();
      await provider.createUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role,
        email: email.trim() || undefined,
        department: department.trim() || undefined
      });
      setShowModal(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setDepartment('');
      setRole('operator');
      fetchUsers();
    } catch (err) {
      alert('Erreur lors de la création de l\'utilisateur');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>👑 Administrateur</span>;
      case 'qse_manager':
        return <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>🛡️ Responsable QSE</span>;
      case 'auditor':
        return <span className="badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>🔍 Auditeur</span>;
      case 'operator':
      default:
        return <span className="badge" style={{ backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280' }}>👤 Opérateur Terrain</span>;
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="container">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="dashboard-title">Annuaire & Gestion des Utilisateurs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Définissez les rôles et permissions pour l'attribution des actions CAPA et la validation des analyses.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Ajouter un utilisateur
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Chargement en cours...</p>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <p>Aucun utilisateur configuré.</p>
        </div>
      ) : (
        <table className="nc-table">
          <thead>
            <tr>
              <th>Nom & Prénom</th>
              <th>E-mail</th>
              <th>Service / Département</th>
              <th>Rôle & Habilitation</th>
              <th>Statut</th>
              <th>Date d'ajout</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>
                  {u.first_name} {u.last_name}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{u.email || '—'}</td>
                <td>{u.department || '—'}</td>
                <td>{getRoleBadge(u.role)}</td>
                <td>
                  <span style={{ fontSize: '0.8rem', color: u.is_active ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {u.is_active ? '● Actif' : '○ Inactif'}
                  </span>
                </td>
                <td>{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL CREATION UTILISATEUR */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Nouveau Membre de l'Équipe</h2>
            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Prénom *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: Paul"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: Durand"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Rôle QSE & Habilitation *</label>
                <select 
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="operator">Opérateur Terrain (Déclarer des NC, exécuter des actions)</option>
                  <option value="qse_manager">Responsable QSE (Analyser 5P/Ishikawa, valider les clôtures)</option>
                  <option value="auditor">Auditeur Interne / Externe (Lecture seule & Audit trail)</option>
                  <option value="admin">Administrateur Système (Gestion complète & configuration)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Adresse E-mail</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="paul.durand@usine.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Service / Département</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ex: Maintenance, Atelier 2, HSE"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
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
                  {submitting ? 'Création...' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
