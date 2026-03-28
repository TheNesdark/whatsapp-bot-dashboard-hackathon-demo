/**
 * Punto de arranque del servidor.
 * Flujo: crear app Express → iniciar instancias de WhatsApp → montar frontend → escuchar HTTP → WebSocket.
 */
import db from './src/server/db/db.js';
import { initWsServer, closeWsServer } from './src/server/services/wsServer.js';
import { createApp, attachFrontend } from './src/server/app.js';
import { instanceManager } from './src/server/services/whatsapp/instanceManager.js';
import { bootstrapActiveInstances } from './src/server/bootstrap.js';

const PORT = Number(process.env.PORT) || 3002;

const app = createApp();
bootstrapActiveInstances();
instanceManager.loadAllSessionsFromDb();

// Iniciar tarea periódica de limpieza de sesiones (cada minuto)
setInterval(() => {
  instanceManager.cleanupInactiveSessions();
}, 60000);

await attachFrontend(app);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] http://localhost:${PORT}`);
});

initWsServer(server);

const shutdown = () => {
  console.log('\n[Server] Apagando...');
  closeWsServer();
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
