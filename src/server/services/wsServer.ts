import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { stmts } from '@server/db/db';
import { safeCompareSecret } from '@server/utils/security';
import type { AuthenticatedWebSocket, ServerEventListener } from '@server/types';

let wss: WebSocketServer | null = null;

// ── Server-side event listeners ───────────────────────────────────────────────

const serverListeners: Map<string, ServerEventListener[]> = new Map();

/** Register a server-side listener for a broadcast event */
export function onServerEvent(event: string, listener: ServerEventListener): void {
    const existing = serverListeners.get(event) ?? [];
    existing.push(listener);
    serverListeners.set(event, existing);
}

/** Remove a server-side listener */
export function offServerEvent(event: string, listener: ServerEventListener): void {
    const existing = serverListeners.get(event);
    if (!existing) return;
    const filtered = existing.filter(l => l !== listener);
    serverListeners.set(event, filtered);
}

export function initWsServer(httpServer: Server): void {
    wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    wss.on('connection', (ws: AuthenticatedWebSocket) => {
        // Leer auth en el momento de la conexión (siempre fresco desde BD)
        const dbEnabledRow = stmts.selectSettingByKey.get('dashboard_password_enabled') as { value: string } | undefined;
        const dbEnabled = dbEnabledRow?.value === 'true';
        const dbKeyRow = stmts.selectSettingByKey.get('dashboard_password') as { value: string } | undefined;
        const dbKey = dbKeyRow?.value ?? '';

        const authRequired = dbEnabled && !!dbKey;
        ws.isAuthenticated = !authRequired;

        if (authRequired) {
            ws.once('message', (msg) => {
                try {
                    const parsed = JSON.parse(msg.toString());
                    if (parsed.event === 'auth') {
                        const provided = parsed.key ?? '';
                        const valid = !!dbKey && typeof provided === 'string' && safeCompareSecret(provided, dbKey);
                        if (!valid) {
                            ws.close(4401, 'No autorizado');
                        } else {
                            ws.isAuthenticated = true;
                        }
                    }
                } catch {
                    ws.close(4401, 'No autorizado');
                }
            });

            // Timeout de 5s para autenticar
            setTimeout(() => {
                if (!ws.isAuthenticated) ws.close(4401, 'Timeout de autenticación');
            }, 5000);
        }

        ws.on('error', () => console.error('[WS] Error en socket'));
    });
    console.log('[WS] WebSocket server activo en /ws');
}

/** Envía un evento JSON a todos los clientes autenticados */
export function broadcast(event: string, data?: unknown): void {
    if (!wss) return;
    const msg = JSON.stringify({ event, data });
    wss.clients.forEach((client: WebSocket) => {
        const authClient = client as AuthenticatedWebSocket;
        if (client.readyState === 1 /* OPEN */ && authClient.isAuthenticated) {
            client.send(msg);
        }
    });
    // Notify server-side listeners
    const listeners = serverListeners.get(event);
    if (listeners) {
        for (const listener of listeners) {
            try { listener(data); } catch { /* ignore */ }
        }
    }
}

/** Cierra el WebSocket server */
export function closeWsServer(): void {
    if (!wss) return;
    wss.clients.forEach(client => {
        try {
            client.close();
        } catch {
            // Ignorar errores al cerrar clientes individuales
        }
    });
    try {
        wss.close();
    } catch {
        // Ignorar errores si ya está cerrado
    }
    wss = null;
    console.log('[WS] WebSocket server cerrado');
}
