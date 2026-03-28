/**
 * Rutas API bajo /api (protegidas por apiAuthMiddleware).
 * Cada recurso tiene su propio archivo de rutas para mantener el código ordenado.
 */
import { Router } from 'express';
import { instancesRoutes } from './instances.routes';
import { settingsRoutes } from './settings.routes';
import { messagesRoutes } from './messages.routes';
import { registrationsRoutes } from './registrations.routes';
import { operatorsRoutes } from './operators.routes';
import { helpRoutes } from './help.routes';
import { reportsRoutes } from './reports.routes';
import { flowRoutes } from './flow.routes';

export const apiRouter = Router();

apiRouter.use('/instances', instancesRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/messages', messagesRoutes);
apiRouter.use('/registrations', registrationsRoutes);
apiRouter.use('/operators', operatorsRoutes);
apiRouter.use('/help-requests', helpRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/flow', flowRoutes);
