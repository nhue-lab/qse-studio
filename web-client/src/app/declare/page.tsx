'use client';

import React, { useState } from 'react';
import { getDataProvider } from '../../services/provider-manager';

export default function MobileDeclarePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'minor' | 'major' | 'critical'>('minor');
  const [reporterName, setReporterName] = useState('');
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setSubmitting(true);
    try {
      const provider = getDataProvider();
      const fullDescription = location.trim() 
        ? `[Secteur/Emplacement : ${location.trim()}]\n${description}`
        : description;

      await provider.createNC(title.trim(), fullDescription.trim(), severity);
      setSubmitted(true);
    } catch (err) {
      alert('Erreur lors du signalement. Veuillez réinstaller ou vérifier votre connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setSeverity('minor');
    setLocation('');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '1.5rem' }}>
          ✓
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Signalement Transmis !</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '400px', marginBottom: '2rem', lineHeight: 1.5 }}>
          Votre déclaration a été enregistrée avec succès et transmise directement au service QSE.
        </p>
        <button 
          onClick={handleReset} 
          className="btn-primary" 
          style={{ width: '100%', maxWidth: '350px', padding: '1rem', fontSize: '1rem', justifyContent: 'center', borderRadius: '12px' }}
        >
          + Signaler un autre problème
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        {/* Header Mobile */}
        <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
          ⚡ QSE Studio — Signalement Terrain
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>Déclarer une Anomalie</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Formulaire rapide pour les opérateurs sur le terrain. Remplissez ce que vous constatez en quelques secondes.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. Titre de l'anomalie */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
              1. Qu'avez-vous constaté ? *
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ex: Fuite d'huile, garde-corps manquant..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.875rem', borderRadius: '10px' }}
              required 
            />
          </div>

          {/* 2. Gravité (Boutons tactiles géants) */}
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
              2. Niveau de risque / urgence *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSeverity('minor')}
                style={{
                  padding: '0.875rem 0.5rem',
                  borderRadius: '10px',
                  border: severity === 'minor' ? '2px solid #10b981' : '1px solid var(--border-color)',
                  backgroundColor: severity === 'minor' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                  color: severity === 'minor' ? '#10b981' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🟢 Mineur
              </button>
              <button
                type="button"
                onClick={() => setSeverity('major')}
                style={{
                  padding: '0.875rem 0.5rem',
                  borderRadius: '10px',
                  border: severity === 'major' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                  backgroundColor: severity === 'major' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                  color: severity === 'major' ? '#f59e0b' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🟠 Majeur
              </button>
              <button
                type="button"
                onClick={() => setSeverity('critical')}
                style={{
                  padding: '0.875rem 0.5rem',
                  borderRadius: '10px',
                  border: severity === 'critical' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                  backgroundColor: severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                  color: severity === 'critical' ? '#ef4444' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🔴 Danger
              </button>
            </div>
          </div>

          {/* 3. Emplacement / Secteur */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
              3. Emplacement / Secteur / Machine
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ex: Atelier 2, Ligne de montage, Bâtiment B"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ fontSize: '0.95rem', padding: '0.75rem', borderRadius: '10px' }}
            />
          </div>

          {/* 4. Description courte */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
              4. Précisions / Description *
            </label>
            <textarea 
              className="form-control" 
              rows={3}
              placeholder="Décrivez brièvement le problème..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ fontSize: '0.95rem', padding: '0.75rem', borderRadius: '10px' }}
              required
            />
          </div>

          {/* 5. Prénom / Nom de l'opérateur (Optionnel) */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
              5. Votre Prénom / Nom (Optionnel)
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ex: Jean (Opérateur Ligne 1)"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              style={{ fontSize: '0.95rem', padding: '0.75rem', borderRadius: '10px' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              justifyContent: 'center', 
              borderRadius: '12px',
              marginTop: '0.5rem',
              backgroundColor: 'var(--accent-blue)'
            }}
            disabled={submitting}
          >
            {submitting ? 'Envoi en cours...' : '🚀 Transmettre le signalement'}
          </button>
        </form>
      </div>
    </div>
  );
}
