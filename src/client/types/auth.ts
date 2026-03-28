export interface AuthContextValue {
  /** true = se debe mostrar la pantalla de login */
  isLocked: boolean;
  /** Intenta desbloquear con la clave dada. Devuelve true si es válida. */
  unlock: (key: string) => Promise<boolean>;
  /** Cierra la sesión y muestra de nuevo la pantalla de login. */
  lock: () => void;
}
