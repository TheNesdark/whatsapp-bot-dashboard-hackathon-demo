/**
 * Tipos compartidos para mensajes.
 * Usados tanto en el cliente como en el servidor.
 */

// ── Mensaje ────────────────────────────────────────────────────────────────

export interface Message {
    id: number;
    from_number: string;
    body: string;
    instance_id: number | null;
    created_at: string;
}

// ── Hilo de conversación ──────────────────────────────────────────────────

export interface Thread {
    number: string;
    messages: Message[];
    lastMsg: Message;
}
