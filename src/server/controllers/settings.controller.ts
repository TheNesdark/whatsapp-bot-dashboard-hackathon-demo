import { Request, Response } from 'express';
import db, { stmts } from '@server/db/db';
import { ALLOWED_SETTINGS, MAX_SETTING_VALUE_LENGTH, SETTINGS_JSON_FIELDS } from '@server/constants/settings';
import { saveSettingsSchema } from '@server/schemas/settings';
import { broadcast } from '@server/services/wsServer';
import { instanceManager } from '@server/services/whatsapp/state';

export function getSettingsController(_req: Request, res: Response): void {
  res.json(stmts.selectAllSettings.all());
}

function normalizeSettingValue(key: string, value: unknown): string {
  const stored = SETTINGS_JSON_FIELDS.has(key) ? JSON.stringify(value) : String(value);
  if (stored.length > MAX_SETTING_VALUE_LENGTH) {
    throw new Error(`Valor demasiado largo para setting: ${key}`);
  }
  return stored;
}

function persistAllowedSettings(payload: Record<string, unknown>): void {
  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(payload)) {
      if (!ALLOWED_SETTINGS.has(key) || value == null) continue;
      stmts.upsertSetting.run(key, normalizeSettingValue(key, value));
    }
  });

  transaction();
}

export function saveSettingsController(req: Request, res: Response): void {
  const parsed = saveSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Configuracion invalida' });
    return;
  }

  try {
    persistAllowedSettings(parsed.data as Record<string, unknown>);
    instanceManager.invalidateAllSettingsCaches();
    broadcast('settings:changed', {});
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Valor demasiado largo')) {
      res.status(400).json({ error: msg });
      return;
    }

    console.error('[settings] Error guardando configuracion:', err);
    res.status(500).json({ error: 'Error al guardar configuracion' });
  }
}
