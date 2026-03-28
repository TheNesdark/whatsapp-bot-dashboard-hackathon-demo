import type { HorarioIntervalo } from '@shared/settings';

export type { HorarioIntervalo };

export interface HorarioConfig {
    enabled: boolean;
    intervalos: HorarioIntervalo[];            // old global intervals (for backwards compatibility)
    semanal?: Record<number, HorarioIntervalo[]>; // opcional: mapeo 0-6 (domingo=0) a intervalos
    mensajeRechazo: string;
}

export interface InactividadConfig {
    timeoutMinutos: number;
    mensajeReinicio: string;
}
