import { Pool } from 'pg';
import { config } from './config';

// Création du pool de connexion PostgreSQL
export const db = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 20, // Nombre max de clients dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Fonction pour tester la connectivité
export async function testConnection(): Promise<boolean> {
  try {
    const client = await db.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    console.log(`[Database] Connexion PostgreSQL établie avec succès à ${config.db.host}:${config.db.port}. Horodatage : ${res.rows[0].now}`);
    return true;
  } catch (err) {
    console.error('[Database] Échec de la connexion à PostgreSQL :', err);
    return false;
  }
}
