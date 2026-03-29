import { useEffect, useRef } from 'react';
import { getPassword } from '@/utils/api';

type Listener = (data: unknown) => void;

// ── Singleton compartido entre todos los hooks ────────────────────────────────
const listeners = new Map<string, Set<Listener>>();
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

function buildWsUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
}

function getReconnectDelay(): number {
    // Exponential backoff with jitter: min(BASE * 2^attempts, MAX) + random(0-200ms)
    const exponential = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
    const jitter = Math.random() * 200; // Reducido de 1000ms a 200ms
    return exponential + jitter;
}

function connect(): void {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;

    ws = new WebSocket(buildWsUrl());

    ws.addEventListener('open', () => {
        reconnectAttempts = 0; // Reset counter on successful connection
        window.dispatchEvent(new CustomEvent('ws:connected'));
        const password = getPassword();
        if (password) {
            ws?.send(JSON.stringify({ event: 'auth', key: password }));
        }
    });

    ws.addEventListener('message', ({ data }) => {
        try {
            const { event, data: payload } = JSON.parse(data as string) as { event: string; data: unknown };
            listeners.get(event)?.forEach(fn => fn(payload));
        } catch { /* ignorar mensajes malformados */ }
    });

    ws.addEventListener('close', (ev) => {
        ws = null;
        window.dispatchEvent(new CustomEvent('ws:disconnected'));
        // Código 4401 = no autorizado: no reconectar y notificar al sistema de auth
        if (ev.code === 4401) {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            reconnectAttempts = 0;
            return;
        }
        // Código 1000 = cierre normal, no reconectar
        if (ev.code === 1000) {
            reconnectAttempts = 0;
            return;
        }
        if (reconnectTimer) return;

        // Limit reconnection attempts
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('[WS] Max reconnection attempts reached. Giving up.');
            return;
        }

        const delay = getReconnectDelay();
        reconnectAttempts++;
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
        }, delay);
    });

    ws.addEventListener('error', () => { }); // silence — se maneja en 'close'
}

/** Retorna true si el WebSocket está conectado actualmente. */
export function isWsConnected(): boolean {
    return ws !== null && ws.readyState === WebSocket.OPEN;
}

/** Fuerza el cierre y reconexión inmediata (útil tras un cambio de clave). */
export function resetWs(): void {
    reconnectAttempts = 0; // Reset counter for manual reconnects
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        ws.close(1000, 'Manual reset'); // 1000 = normal closure
        ws = null;
    }
    connect();
}

// ── Hook público ──────────────────────────────────────────────────────────────
/**
 * Suscribe un callback a un evento WebSocket del servidor.
 * La conexión es un singleton compartido (una sola conexión por pestaña).
 */
export function useWsEvent(event: string, callback: Listener): void {
    const cbRef = useRef(callback);
    cbRef.current = callback;

    useEffect(() => {
        connect();

        const fn: Listener = (data) => cbRef.current(data);
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(fn);

        return () => { listeners.get(event)?.delete(fn); };
    }, [event]);
}
