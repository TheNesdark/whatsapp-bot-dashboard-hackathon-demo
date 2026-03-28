export const DEFAULT_ATTENDED_BY = 'Agente';
export const MAX_ATTENDED_BY_LENGTH = 80;

export const REGISTRATION_CONTROLLER_ERRORS = {
  ACCEPT_INVALID_STATUS: 'Solo se pueden aceptar registros en estado pendiente o atendiendo',
  REJECT_INVALID_STATUS: 'Solo se pueden rechazar registros pendientes, en confirmación o en atención',
  CLAIM_INVALID_STATUS: 'Solo se pueden tomar registros en estado pendiente',
  RELEASE_INVALID_STATUS: 'El registro no está en estado de atención',
  INSTANCE_REQUIRED: 'No hay instancia activa para procesar esta solicitud',
  APPROVAL_INSTANCE_REQUIRED: 'No hay instancia activa',
  INVALID_IMAGE: 'El archivo no es una imagen válida',
  ALREADY_CLAIMED: 'El registro ya fue tomado por otra persona',
  ACCEPT_ERROR: 'Error al aceptar el registro',
  REJECT_ERROR: 'Error al rechazar el registro',
  APPROVE_ERROR: 'Error al aprobar el registro',
  DENY_ERROR: 'Error al denegar el registro',
} as const;
