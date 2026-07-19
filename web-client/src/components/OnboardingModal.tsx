'use client';

import React, { useState } from 'react';
import { getDataProvider } from '../services/provider-manager';
import { User } from '../services/data-provider';

interface OnboardingModalProps {
  onComplete: (user: User) => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Qualité & HSE');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;

    setSubmitting(true);
    try {
      const provider = getDataProvider();
      const newAdmin = await provider.createUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: 'admin', // Premier utilisateur -> Rôle Administrateur automatique
        email: email.trim() || undefined,
        department: department.trim() || undefined
      });
      onComplete(newAdmin);
    } catch (err) {
      alert('Erreur lors de la création de l\'administrateur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '500px', borderTop: '4px solid var(--accent-blue)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h2 className="section-title" style={{ fontSize: '1.4rem' }}>Premier Lancement — QSE Studio</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Aucun utilisateur n'est configuré. Veuillez créer le compte du **Responsable QSE / Administrateur principal**.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Prénom *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ex: Marc"
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
                placeholder="Ex: Dupont"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Adresse E-mail professionnelle</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="marc.dupont@usine.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Service / Département</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ex: Direction Qualité, HSE"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent-blue)', marginBottom: '1.5rem' }}>
            👑 Ce premier compte obtiendra automatiquement le rôle <strong>Administrateur</strong> avec tous les droits de gestion et de validation QSE.
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
            disabled={submitting}
          >
            {submitting ? 'Création de l\'administrateur...' : 'Initialiser l\'application & Continuer'}
          </button>
        </form>
      </div>
    </div>
  );
}
