import { IDataProvider } from './data-provider';
import { ApiDataProvider } from './api-provider';
import { SqliteDataProvider } from './sqlite-provider';

let activeProvider: IDataProvider | null = null;

/**
 * Gestionnaire et Sélecteur de Data Provider (inspiré d'agentic-builder).
 * Gère dynamiquement la connexion au serveur distant ou la base locale SQLite.
 */
export function getDataProvider(): IDataProvider {
  if (activeProvider) return activeProvider;

  if (typeof window !== 'undefined') {
    // Vérifier si l'utilisateur a défini une adresse de serveur QSE Studio distant dans son navigateur/logiciel
    const customServerUrl = localStorage.getItem('qse_studio_server_url');

    if (customServerUrl && customServerUrl.trim() !== '') {
      console.log(`[ProviderManager] Utilisation du serveur distant : ${customServerUrl}`);
      activeProvider = new ApiDataProvider(customServerUrl);
      return activeProvider;
    }
  }

  // Par défaut, utiliser le mode autonome local (SQLite / Démo)
  console.log('[ProviderManager] Utilisation de la base de données locale (SQLite/Solo).');
  activeProvider = new SqliteDataProvider();
  return activeProvider;
}

/**
 * Permet de modifier le serveur ciblé (ex: depuis un écran de configuration du .exe)
 */
export function setServerUrl(url: string | null): void {
  if (typeof window !== 'undefined') {
    if (url) {
      localStorage.setItem('qse_studio_server_url', url);
    } else {
      localStorage.removeItem('qse_studio_server_url');
    }
    // Forcer la réinitialisation du provider au prochain appel
    activeProvider = null;
  }
}

/**
 * Récupère l'URL du serveur configuré actuellement (si connecté)
 */
export function getServerUrl(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('qse_studio_server_url');
  }
  return null;
}
