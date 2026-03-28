import { Request, Response, NextFunction } from 'express';
import { stmts } from '@server/db/db';
import { safeCompareSecret } from '@server/utils/security';
import type { AuthConfig } from '@server/types';

function getAuthConfig(): AuthConfig {
  const enabled = (stmts.selectSettingByKey.get('dashboard_password_enabled') as { value: string } | undefined)?.value === 'true';
  const key = (stmts.selectSettingByKey.get('dashboard_password') as { value: string } | undefined)?.value ?? '';
  return { enabled: enabled && !!key, key };
}

export function authCheckController(_req: Request, res: Response): void {
  res.json({ enabled: getAuthConfig().enabled });
}

export function apiAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const { enabled, key } = getAuthConfig();
  if (!enabled) {
    next();
    return;
  }

  const provided = req.headers['x-api-key'];
  const token = typeof provided === 'string' ? provided : '';

  if (token && safeCompareSecret(token, key)) {
    next();
    return;
  }

  res.status(401).json({ error: 'No autorizado' });
}
