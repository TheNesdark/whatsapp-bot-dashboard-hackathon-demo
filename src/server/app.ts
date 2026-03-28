import express from 'express';
import type { Express } from 'express';
import { apiRouter } from '@server/routes/index';
import { webhookRoutes } from '@server/routes/webhook.routes';
import { multerErrorHandler } from '@server/middlewares/upload';
import { authCheckController, apiAuthMiddleware } from '@server/middlewares/auth';

/**
 * Crea y configura la aplicación Express.
 * Orden: JSON → Auth check (público) → API protegida → Webhook → Manejo errores Multer.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Auth: endpoint público para saber si el dashboard requiere contraseña
  app.get('/api/auth/check', authCheckController);

  // API REST (todas bajo /api, protegidas por contraseña si está activada)
  app.use('/api', apiAuthMiddleware);
  app.use('/api', apiRouter);

  // Webhook de WhatsApp (verificación y mensajes entrantes)
  app.use('/webhook', webhookRoutes);

  // Manejo global de errores de Multer (subida de archivos)
  app.use(multerErrorHandler);

  return app;
}

/**
 * Monta el frontend: Vite en desarrollo (si se pasa DV), archivos estáticos por defecto.
 */
export async function attachFrontend(app: Express): Promise<void> {
  if (process.env.DV === 'true') {
    // Dynamically import only if requested
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: { ignored: ['**/sessions/**', '**/uploads/**'] },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // En producción, servir estáticos
    app.use(express.static('dist'));
  }
}
