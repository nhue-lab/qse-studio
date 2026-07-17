import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config';
import { db, testConnection } from './db';
import { ncRoutes } from './routes/nc';
import { actionRoutes } from './routes/actions';

const fastify = Fastify({
  logger: true
});

// Enregistrement des plugins Fastify
fastify.register(cors, {
  origin: '*', // En développement, autoriser toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

fastify.register(jwt, {
  secret: config.jwtSecret
});

// Route Healthcheck
fastify.get('/health', async (request, reply) => {
  try {
    const isDbConnected = await testConnection();
    return {
      status: isDbConnected ? 'healthy' : 'unhealthy',
      env: config.nodeEnv,
      timestamp: new Date().toISOString(),
      database: isDbConnected ? 'connected' : 'disconnected'
    };
  } catch (error) {
    return reply.status(500).send({ status: 'unhealthy', error: String(error) });
  }
});

// Route Utilisateurs (pour la démo)
fastify.get('/api/users', async (request, reply) => {
  try {
    const result = await db.query('SELECT id, email, first_name, last_name, role FROM public.users ORDER BY first_name ASC');
    return result.rows;
  } catch (error) {
    fastify.log.error({ err: error }, 'Échec de la récupération des utilisateurs');
    return reply.status(500).send({ error: 'Erreur serveur' });
  }
});

// Enregistrement des routes d'API
fastify.register(ncRoutes);
fastify.register(actionRoutes);

// Lancement du serveur Fastify
const start = async () => {
  try {
    console.log('[Startup] Tentative de connexion à la base de données...');
    await testConnection();

    await fastify.listen({ port: config.port, host: config.host });
    console.log(`[Server] QSE Studio API démarrée avec succès sur http://${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
