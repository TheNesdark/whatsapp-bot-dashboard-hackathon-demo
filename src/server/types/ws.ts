import type { WebSocket } from 'ws';

// Extended WebSocket with authentication state
export interface AuthenticatedWebSocket extends WebSocket {
    isAuthenticated?: boolean;
}

export type ServerEventListener = (data: unknown) => void;
