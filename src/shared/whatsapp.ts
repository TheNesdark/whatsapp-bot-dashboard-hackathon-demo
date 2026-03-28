/**
 * Tipos compartidos para WhatsApp.
 * Usados tanto en el cliente como en el servidor.
 */

import type { FlowVariableType } from './flow';

// ── Mensajes parseados del webhook ──────────────────────────────────────────

export interface ParsedWebhookMessage {
    id?: string;
    from: string;
    body: string;
    payloadId?: string;
    phoneNumberId?: string;
}

// ── Estado del usuario en conversación ──────────────────────────────────────

export interface UserState {
    nodeId: string;
    variables: Partial<Record<FlowVariableType, string>>;
    failCount?: number;
    previousNodeId?: string;
    registrationId?: number;
}

// ── Instancia de WhatsApp ──────────────────────────────────────────────────

export interface WhatsAppInstance {
    id: number;
    name: string;
    phoneNumberId?: string;
    apiUrl?: string | null;
    isActive: boolean;
    createdAt: string;
}

// ── Estado de instancia en memoria ─────────────────────────────────────────

export interface InstanceState {
    id: number;
    name: string;
    phoneNumberId: string | null;
    userStates: Map<string, UserState>;
    userStateTimestamps: Map<string, number>;
    recentCleanups: Map<string, number>;
    manualMode: Map<string, number>;
    settingsCache: Record<string, string> | null;
}

// ── Fila de la tabla whatsapp_instances ────────────────────────────────────

export interface InstanceRow {
    id: number;
    name: string;
    is_active: number;
    phone_number_id?: string;
    api_url?: string;
    created_at: string;
}
