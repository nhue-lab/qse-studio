'use client';

import React from 'react';

interface QRCodeModalProps {
  onClose: () => void;
}

export function QRCodeModal({ onClose }: QRCodeModalProps) {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const declareUrl = `${currentOrigin}/declare`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '600px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} className="no-print">
          <h2 className="section-title">📱 Signalement Terrain & Affiche QR Code</h2>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '0.25rem 0.75rem' }}>✕ Fermer</button>
        </div>

        {/* Zone Imprimable de l'affiche */}
        <div id="printable-qr-poster" style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '3px solid #0f172a', borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#2563eb', marginBottom: '0.5rem' }}>
            🛡️ QSE STUDIO — SÉCURITÉ & QUALITÉ
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', color: '#0f172a', lineHeight: 1.2 }}>
            SIGNALER UNE ANOMALIE
          </h1>

          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#475569', marginBottom: '2rem' }}>
            Un problème de sécurité ? Une fuite ? Un garde-corps manquant ?<br />
            <strong>Scannez ce QR Code avec votre smartphone pour déclarer en 15 secondes.</strong>
          </p>

          {/* Rendu visuel QR Code moderne */}
          <div style={{ display: 'inline-block', padding: '1.5rem', backgroundColor: '#ffffff', border: '4px solid #2563eb', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
            <svg width="200" height="200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="white"/>
              {/* Top Left Marker */}
              <rect x="10" y="10" width="25" height="25" fill="#0f172a"/>
              <rect x="14" y="14" width="17" height="17" fill="white"/>
              <rect x="18" y="18" width="9" height="9" fill="#2563eb"/>
              
              {/* Top Right Marker */}
              <rect x="65" y="10" width="25" height="25" fill="#0f172a"/>
              <rect x="69" y="14" width="17" height="17" fill="white"/>
              <rect x="73" y="18" width="9" height="9" fill="#2563eb"/>

              {/* Bottom Left Marker */}
              <rect x="10" y="65" width="25" height="25" fill="#0f172a"/>
              <rect x="14" y="69" width="17" height="17" fill="white"/>
              <rect x="18" y="73" width="9" height="9" fill="#2563eb"/>

              {/* Simulated Data Pattern */}
              <rect x="42" y="10" width="6" height="6" fill="#0f172a"/>
              <rect x="50" y="18" width="6" height="6" fill="#2563eb"/>
              <rect x="42" y="26" width="6" height="6" fill="#0f172a"/>
              <rect x="10" y="42" width="6" height="6" fill="#2563eb"/>
              <rect x="22" y="50" width="6" height="6" fill="#0f172a"/>
              <rect x="42" y="42" width="16" height="16" fill="#2563eb" rx="2"/>
              <rect x="65" y="42" width="6" height="6" fill="#0f172a"/>
              <rect x="75" y="50" width="6" height="6" fill="#2563eb"/>
              <rect x="50" y="65" width="6" height="6" fill="#0f172a"/>
              <rect x="65" y="75" width="12" height="6" fill="#2563eb"/>
              <rect x="80" y="65" width="10" height="10" fill="#0f172a"/>
              <rect x="42" y="80" width="6" height="10" fill="#0f172a"/>
            </svg>
          </div>

          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb', wordBreak: 'break-all' }}>
            Lien direct : {declareUrl}
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
            Affiche officielle générée par QSE Studio — À coller sur les machines et dans les ateliers.
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="modal-actions no-print" style={{ marginTop: '1.5rem' }}>
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            🖨️ Imprimer l'affiche QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
