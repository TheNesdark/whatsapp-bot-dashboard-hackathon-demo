import { Database } from 'bun:sqlite';
import { REGISTRATION_ACTIVE_STATUSES } from '@shared/registration';
import { DEFAULT_SETTINGS } from '@server/constants/settings';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';

// ── Conexión y pragmas de rendimiento ────────────────────────────────────────
const dbDir = 'db';
if (!existsSync(dbDir)) {
  mkdirSync(dbDir);
}
const db = new Database(path.join(dbDir, 'whatsapp_bot.db'));

db.run('PRAGMA journal_mode = WAL;');
db.run('PRAGMA synchronous = NORMAL;');
db.run('PRAGMA cache_size = -32000;');
db.run('PRAGMA foreign_keys = ON;');

// ── Esquema ──────────────────────────────────────────────────────────────────
db.exec(`
  -- Instancias de WhatsApp (cada una con su número de teléfono)
  CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    phone_number_id TEXT,
    api_url         TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Mensajes entrantes
  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    from_number TEXT    NOT NULL,
    body        TEXT    NOT NULL,
    lid         TEXT,
    instance_id INTEGER REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Registros/solicitudes de cita
  CREATE TABLE IF NOT EXISTS registrations (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    whatsapp_number  TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending',
    attended_by      TEXT,
    instance_id      INTEGER REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Datos dinámicos de los registros
  CREATE TABLE IF NOT EXISTS registration_data (
    registration_id  INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    variable_key     TEXT NOT NULL,
    value            TEXT NOT NULL,
    PRIMARY KEY (registration_id, variable_key)
  );

  -- Configuración del sistema
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  -- Operadores/agentes
  CREATE TABLE IF NOT EXISTS operators (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE,
    is_active  INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Solicitudes de ayuda de operador
  CREATE TABLE IF NOT EXISTS help_requests (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number  TEXT    NOT NULL,
    full_name     TEXT,
    cedula        TEXT,
    instance_id   INTEGER REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
    status        TEXT    NOT NULL DEFAULT 'pending',
    previous_step TEXT,
    previous_data TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Sesiones de usuario (para persistencia de estados)
  CREATE TABLE IF NOT EXISTS user_sessions (
    instance_id   INTEGER NOT NULL,
    phone_number  TEXT NOT NULL,
    state_json    TEXT NOT NULL,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (instance_id, phone_number)
  );

  -- Índices
  CREATE INDEX IF NOT EXISTS idx_messages_from       ON messages(from_number);
  CREATE INDEX IF NOT EXISTS idx_messages_created    ON messages(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_instance   ON messages(instance_id);
  CREATE INDEX IF NOT EXISTS idx_reg_status          ON registrations(status);
  CREATE INDEX IF NOT EXISTS idx_reg_whatsapp        ON registrations(whatsapp_number);
  CREATE INDEX IF NOT EXISTS idx_reg_created         ON registrations(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_reg_instance        ON registrations(instance_id);
  CREATE UNIQUE INDEX IF NOT EXISTS uq_active_reg_phone ON registrations(whatsapp_number) WHERE status IN ('pending', 'confirming', 'attending', 'accepted');
  CREATE INDEX IF NOT EXISTS idx_instances_phone     ON whatsapp_instances(phone_number_id);
  CREATE INDEX IF NOT EXISTS idx_help_status         ON help_requests(status);
  CREATE INDEX IF NOT EXISTS idx_help_phone          ON help_requests(phone_number);
  CREATE UNIQUE INDEX IF NOT EXISTS uq_instances_phone_nonnull ON whatsapp_instances(phone_number_id) WHERE phone_number_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_reg_data_reg        ON registration_data(registration_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_updated    ON user_sessions(updated_at);
`);
// ── Configuración por defecto ─────────────────────────────────────────────────
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  insertSetting.run(key, value);
}

// ── Prepared statements ──────────────────────────────────────────────────────
export const stmts = {
  // Messages
  insertMessage: db.prepare('INSERT INTO messages (from_number, body, lid, instance_id, created_at) VALUES (?, ?, ?, ?, ?)'),
  selectMessageByLidAndInstance: db.prepare('SELECT id FROM messages WHERE lid = ? AND instance_id = ? LIMIT 1'),
  selectAllMessages: db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?'),
  selectMessagesByInstance: db.prepare('SELECT * FROM messages WHERE instance_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'),
  
  // New: Select messages for a specific contact (normalized)
  selectMessagesByContact: db.prepare(`
    SELECT * FROM messages 
    WHERE from_number = ? 
       OR from_number = 'Bot -> ' || ?
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `),

  // New: Select the latest message for each contact to build the thread list efficiently
  selectLatestMessagesPerContact: db.prepare(`
    SELECT * FROM messages 
    WHERE id IN (
        SELECT MAX(id) 
        FROM messages 
        GROUP BY 
            CASE 
                WHEN from_number LIKE 'Bot -> %' THEN SUBSTR(from_number, 8)
                ELSE from_number 
            END
    )
    ORDER BY created_at DESC
  `),

  // Registrations
  insertRegistration: db.prepare(
    'INSERT INTO registrations (whatsapp_number, instance_id) VALUES (?, ?)'
  ),
  insertRegistrationData: db.prepare(
    'INSERT INTO registration_data (registration_id, variable_key, value) VALUES (?, ?, ?)'
  ),
  selectAllRegistrations: db.prepare('SELECT * FROM registrations ORDER BY created_at DESC LIMIT 1000'),
  selectRegistrationsByInstance: db.prepare('SELECT * FROM registrations WHERE instance_id = ? ORDER BY created_at DESC LIMIT 1000'),
  selectRegistrationById: db.prepare('SELECT id, status, instance_id, attended_by, whatsapp_number FROM registrations WHERE id = ?'),
  selectRegistrationData: db.prepare('SELECT variable_key, value FROM registration_data WHERE registration_id = ?'),
  selectRegistrationConversationById: db.prepare(
    'SELECT id, status, instance_id, whatsapp_number FROM registrations WHERE id = ? LIMIT 1',
  ),
  selectRegistrationByPhone: db.prepare(
    'SELECT id, status FROM registrations WHERE whatsapp_number = ? AND status IN (?, ?) ORDER BY created_at DESC LIMIT 1'
  ),
  selectRegistrationByPhoneInProgress: db.prepare(
    `SELECT id, status FROM registrations WHERE whatsapp_number = ? AND status IN (${REGISTRATION_ACTIVE_STATUSES.map(() => '?').join(', ')}) ORDER BY created_at DESC LIMIT 1`
  ),
  updateRegistrationStatus: db.prepare('UPDATE registrations SET status = ? WHERE id = ?'),
  updateRegistrationStatusConditional: db.prepare('UPDATE registrations SET status = ? WHERE id = ? AND status = ?'),
  claimRegistration: db.prepare(`UPDATE registrations SET status = 'attending', attended_by = ? WHERE id = ? AND status IN ('pending')`),
  releaseRegistration: db.prepare(`UPDATE registrations SET status = 'pending', attended_by = NULL WHERE id = ? AND status = 'attending'`),
  setAttendedByIfNull: db.prepare('UPDATE registrations SET attended_by = ? WHERE id = ? AND attended_by IS NULL'),

  // Settings
  selectAllSettings: db.prepare('SELECT * FROM settings'),
  selectSettingByKey: db.prepare('SELECT value FROM settings WHERE key = ?'),
  upsertSetting: db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'),

  // Instances
  selectAllInstances: db.prepare('SELECT * FROM whatsapp_instances ORDER BY id ASC'),
  selectInstanceById: db.prepare('SELECT * FROM whatsapp_instances WHERE id = ?'),
  selectInstanceByPhoneId: db.prepare('SELECT * FROM whatsapp_instances WHERE phone_number_id = ?'),
  insertInstance: db.prepare('INSERT INTO whatsapp_instances (name, phone_number_id, api_url) VALUES (?, ?, ?)'),
  deleteInstance: db.prepare('DELETE FROM whatsapp_instances WHERE id = ?'),
  updateInstanceActive: db.prepare('UPDATE whatsapp_instances SET is_active = ? WHERE id = ?'),

  // Operators
  selectAllOperators: db.prepare('SELECT * FROM operators WHERE is_active = 1 ORDER BY name ASC'),
  insertOperator: db.prepare('INSERT INTO operators (name) VALUES (?)'),
  deleteOperator: db.prepare('DELETE FROM operators WHERE id = ?'),
  deactivateOperator: db.prepare('UPDATE operators SET is_active = 0 WHERE id = ?'),

  // Help Requests
  insertHelpRequest: db.prepare('INSERT INTO help_requests (phone_number, full_name, cedula, instance_id, status, previous_step, previous_data) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  selectAllHelpRequests: db.prepare('SELECT * FROM help_requests WHERE status = ? ORDER BY created_at DESC'),
  selectHelpRequestByPhone: db.prepare('SELECT * FROM help_requests WHERE phone_number = ? AND status IN (\'pending\', \'muted\') ORDER BY created_at DESC LIMIT 1'),
  selectHelpRequestById: db.prepare('SELECT * FROM help_requests WHERE id = ?'),
  updateHelpRequestStatus: db.prepare('UPDATE help_requests SET status = ? WHERE id = ?'),
  deleteHelpRequest: db.prepare('DELETE FROM help_requests WHERE id = ?'),

  // Sessions
  upsertSession: db.prepare('INSERT OR REPLACE INTO user_sessions (instance_id, phone_number, state_json, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'),
  selectSession: db.prepare('SELECT state_json FROM user_sessions WHERE instance_id = ? AND phone_number = ?'),
  deleteSession: db.prepare('DELETE FROM user_sessions WHERE instance_id = ? AND phone_number = ?'),
  selectAllSessions: db.prepare('SELECT * FROM user_sessions'),
  clearOldSessions: db.prepare('DELETE FROM user_sessions WHERE updated_at < datetime(\'now\', ?)')
};

export default db;
