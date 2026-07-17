import './global.css';

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
          <div className="logo-container">
            <div className="logo-icon"></div>
            <span className="logo-text">QSE Studio</span>
          </div>
          <div className="user-badge">
            Utilisateur : Marc (Administrateur QSE)
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
