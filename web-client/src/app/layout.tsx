import './global.css';
import Link from 'next/link';

export const metadata = {
  title: 'QSE Studio - Management Qualité, Sécurité & Environnement',
  description: 'Plateforme open source moderne pour les responsables QSE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="logo-container">
                <div className="logo-icon"></div>
                <span className="logo-text">QSE Studio</span>
              </div>
            </Link>
            
            <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', fontWeight: 500 }}>
              <Link href="/" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                📊 Tableau de bord
              </Link>
              <Link href="/users" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                👥 Utilisateurs
              </Link>
            </nav>
          </div>

          <div className="user-badge">
            Actif : Administrateur QSE
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
