import type { InstanceState } from '@server/types/index';
import { stmts } from '@server/db/db';

export type { InstanceState };

class InstanceManager {
  private instances: Map<number, InstanceState> = new Map();

  constructor() {
    // Limpieza automática de sesiones inactivas cada minuto
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 60_000);
  }

  /** Registra (o actualiza) una instancia */
  register(id: number, name: string, phoneNumberId: string | null = null): InstanceState {
    if (!this.instances.has(id)) {
      this.instances.set(id, {
        id,
        name,
        phoneNumberId,
        userStates: new Map(),
        userStateTimestamps: new Map(),
        recentCleanups: new Map(),
        manualMode: new Map(),
        settingsCache: null,
      });
    } else {
      const existing = this.instances.get(id)!;
      existing.phoneNumberId = phoneNumberId;
    }
    return this.instances.get(id)!;
  }

  get(id: number): InstanceState | undefined {
    return this.instances.get(id);
  }

  getOrThrow(id: number): InstanceState {
    const inst = this.instances.get(id);
    if (!inst) throw new Error(`Instancia ${id} no registrada`);
    return inst;
  }

  has(id: number): boolean {
    return this.instances.has(id);
  }

  unregister(id: number): void {
    this.instances.delete(id);
  }

  getAllIds(): number[] {
    return [...this.instances.keys()];
  }

  /** Busca una instancia por su phoneNumberId */
  findByPhoneNumberId(phoneNumberId: string): InstanceState | undefined {
    for (const inst of this.instances.values()) {
      if (inst.phoneNumberId === phoneNumberId) return inst;
    }
    return undefined;
  }

  // ── Manejo de estado por usuario ─────────────────────────────────────────

  touchState(id: number, userId: string): void {
    const inst = this.instances.get(id);
    if (!inst) return;

    inst.userStateTimestamps.set(userId, Date.now());

    // Persistir el estado actual en la base de datos
    const state = inst.userStates.get(userId);
    if (state) {
      try {
        stmts.upsertSession.run(id, userId, JSON.stringify(state));
      } catch (err) {
        console.error(`[InstanceManager] Error persistiendo sesión para ${userId}:`, err);
      }
    }
  }

  clearUserState(id: number, userId: string): void {
    const inst = this.instances.get(id);
    if (!inst) return;

    inst.userStates.delete(userId);
    inst.userStateTimestamps.delete(userId);

    // Eliminar de la base de datos
    try {
      stmts.deleteSession.run(id, userId);
    } catch (err) {
      console.error(`[InstanceManager] Error eliminando sesión para ${userId}:`, err);
    }
  }

  /** Carga todas las sesiones guardadas desde la DB (usar al arrancar) */
  loadAllSessionsFromDb(): void {
    try {
      const sessions = stmts.selectAllSessions.all() as Array<{ instance_id: number, phone_number: string, state_json: string }>;
      console.log(`[InstanceManager] Cargando ${sessions.length} sesiones desde la base de datos...`);

      for (const s of sessions) {
        const inst = this.instances.get(s.instance_id);
        if (inst) {
          try {
            const state = JSON.parse(s.state_json);
            inst.userStates.set(s.phone_number, state);
            inst.userStateTimestamps.set(s.phone_number, Date.now());
          } catch (e) {
            console.error(`[InstanceManager] Error parseando sesión para ${s.phone_number}`);
          }
        }
      }
    } catch (err) {
      console.error('[InstanceManager] Error cargando sesiones:', err);
    }
  }

  // ── Caché de settings ────────────────────────────────────────────────────

  invalidateSettingsCache(id: number): void {
    const inst = this.instances.get(id);
    if (inst) inst.settingsCache = null;
  }

  invalidateAllSettingsCaches(): void {
    for (const inst of this.instances.values()) inst.settingsCache = null;
  }

  // ── Limpieza periódica de inactivos ──────────────────────────────────────

  cleanupInactiveSessions(): void {
    const now = Date.now();
    for (const [instanceId, inst] of this.instances.entries()) {
      // Usamos el config dinámico en caso de que cambie
      // Lazy load de getSettings para evitar referencias circulares
      let timeoutMs = 5 * 60 * 1000; // default 5 min
      try {
        const { getSettings } = require('./config');
        const s = getSettings(instanceId);
        const timeoutMinutos = parseInt(s.inactividad_timeout ?? '5', 10);
        timeoutMs = (Number.isFinite(timeoutMinutos) ? timeoutMinutos : 5) * 60 * 1000;
      } catch (e) {
        // ignore
      }

      for (const [userId, lastActive] of inst.userStateTimestamps.entries()) {
        if (now - lastActive > timeoutMs) {
          // Mantener recentCleanups bajo control (máximo 1000 entradas)
          if (inst.recentCleanups.size > 1000) {
            const oldestKey = inst.recentCleanups.keys().next().value;
            if (oldestKey !== undefined) inst.recentCleanups.delete(oldestKey);
          }
          inst.recentCleanups.set(userId, now);
          this.clearUserState(instanceId, userId);
        }
      }
    }
  }
}

// Singleton global
export const instanceManager = new InstanceManager();
