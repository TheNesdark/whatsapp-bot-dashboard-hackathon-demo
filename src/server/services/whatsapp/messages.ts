/**
 * Mensajes del Bot de WhatsApp
 * 
 * Este archivo contiene todas las respuestas y mensajes del bot
 * centralizados para facilitar su mantenimiento y posible internacionalización.
 */

// ── Mensajes de Error ───────────────────────────────────────────────────────

export const ERROR_MESSAGES = {
  /** Error genérico del servidor */
  SERVER_ERROR: '⚠️ Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.',
  
  /** Error inesperado que reinicia la sesión */
  UNEXPECTED_ERROR: '⚠️ Ocurrió un error inesperado. Tu sesión fue reiniciada. Por favor escríbenos de nuevo.',
  
  /** Error al guardar el registro */
  SAVE_ERROR: '⚠️ Ocurrió un error al guardar tu solicitud. Por favor, intenta de nuevo más tarde.',
  
  /** Error al confirmar cita */
  CONFIRM_ERROR: '⚠️ Ocurrió un error al confirmar. Por favor, intenta de nuevo o contáctanos.',
  
  /** Error al cancelar/rechazar cita */
  CANCEL_ERROR: '⚠️ Ocurrió un error al cancelar. Por favor, intenta de nuevo o contáctanos.',
  
  /** No se encontró la solicitud */
  REQUEST_NOT_FOUND: '⚠️ No se encontró tu solicitud. Por favor, inicia el proceso nuevamente.',
  
  /** Faltan datos obligatorios */
  MISSING_DATA: '⚠️ Faltan datos obligatorios. Por favor, inicia el proceso nuevamente escribiendo *hola*.',
  
  /** Solicitud duplicada - pendiente */
  DUPLICATE_PENDING: (status: string) => 
    `⚠️ Ya existe una solicitud con esta cédula en estado *${status}*.\n\nEspera a que sea procesada o contáctanos directamente.`,
} as const;

// ── Mensajes de Validación ──────────────────────────────────────────────────

export const VALIDATION_MESSAGES = {
  /** Nombre inválido */
  INVALID_NAME: 'Por favor ingresa tu *nombre completo* válido (solo letras y espacios):',
  
  /** Documento inválido */
  INVALID_DOCUMENT: 'Documento inválido. Debe tener entre 5 y 12 dígitos (solo números):',
  
  /** Teléfono inválido */
  INVALID_PHONE: 'Teléfono inválido. Debe tener entre 7 y 15 dígitos (solo números):',
  
  /** Dirección inválida */
  INVALID_ADDRESS: 'Ingresa una dirección válida (mínimo 5 caracteres):',
  
  /** EPS personalizada inválida */
  INVALID_CUSTOM_EPS: 'Por favor ingresa un nombre de EPS válido:',
  
  /** Opción de autorización inválida */
  INVALID_AUTH_OPTION: 'Opción no válida. Responde con:\n\n1️⃣ *Sí, autorizo*\n2️⃣ *No, no autorizo*',
  
  /** Opción de confirmación inválida */
  INVALID_CONFIRM_OPTION: '⚠️ Opción no válida. Por favor responde con:\n\n1️⃣ *Sí* para confirmar\n2️⃣ *No* para cancelar',
  
  /** Opción de ayuda inválida */
  INVALID_HELP_OPTION: '⚠️ Opción no válida. Responde:\n\n1️⃣ *Sí* para contactar operador\n2️⃣ *No* para seguir intentando',
  
  /** Opción de menú inválida (genérica) */
  INVALID_MENU_OPTION: (title: string, items: string[]) => 
    `Opción inválida. ${title}:\n\n${items.map((o, i) => `${i + 1}️⃣ ${o}`).join('\n')}`,
} as const;

// ── Mensajes de Ayuda del Operador ──────────────────────────────────────────

export const OPERATOR_HELP_MESSAGES = {
  /** Ofrecer ayuda después de fallos */
  OFFER_HELP: (errorMessage: string) => 
    `⚠️ ${errorMessage}\n\n` +
    `Parece que tienes dificultades. ¿Deseas que un operador te contacte?\n\n` +
    `1️⃣ *Sí, contactar operador*\n` +
    `2️⃣ *No, seguir intentando*`,
  
  /** Confirmación de solicitud de ayuda */
  HELP_REQUEST_CONFIRMED: '✅ Un operador te contactará pronto. Gracias por tu paciencia.',
  
  /** Volver a intentar */
  TRY_AGAIN: 'Entendido. Por favor intenta nuevamente.',
  
  /** Reiniciar conversación */
  RESTART: 'Entendido. Escribe cualquier mensaje para iniciar nuevamente.',
} as const;

// ── Mensajes de Autorización de Datos ───────────────────────────────────────

export const AUTH_MESSAGES = {
  /** Mensaje de autorización con botones */
  DATA_AUTH_TITLE: '🔒 *Autorización de datos (Ley 1581/2012)*\n\nTus datos se usarán únicamente para gestionar tu cita médica.',
  
  /** Botón: Sí, autorizo */
  BTN_AUTHORIZE_YES: 'Sí, autorizo',
  
  /** Botón: No autorizo */
  BTN_AUTHORIZE_NO: 'No autorizo',
  
  /** Confirmación de autorización */
  AUTHORIZED: '✅ Gracias por autorizar el tratamiento de tus datos.\n\nPor favor ingresa tu *nombre completo*:',
  
  /** Rechazo de autorización */
  REJECTED: 
    `❌ Has rechazado la autorización de datos personales.\n\n` +
    `Sin este consentimiento no podemos procesar tu solicitud.\n` +
    `Si cambias de opinión, escríbenos nuevamente.`,
} as const;

// ── Mensajes de Flujo de Registro ───────────────────────────────────────────

export const REGISTRATION_MESSAGES = {
  /** Solicitar nombre */
  REQUEST_NAME: (name: string) => `Gracias, *${name}*. Ahora ingresa tu *número de documento* (solo números, sin puntos ni comas):`,
  
  /** Solicitar teléfono */
  REQUEST_PHONE: '¿Cuál es tu *número de teléfono* de contacto? (solo números, sin puntos ni comas):',
  
  /** Solicitar dirección */
  REQUEST_ADDRESS: 'Indícame tu *dirección de residencia* (barrio, calle, ciudad):',
  
  /** Solicitar EPS */
  REQUEST_EPS: '¿A qué *EPS* estás afiliado?',
  
  /** Solicitar EPS personalizada */
  REQUEST_CUSTOM_EPS: 'Por favor escribe el nombre de tu EPS:',
  
  /** Solicitar tipo de cita */
  REQUEST_APPOINTMENT_TYPE: 'Selecciona el *tipo de cita*:',
  
  /** Título para menú EPS */
  EPS_MENU_TITLE: 'Selecciona tu *EPS*:',
  
  /** Confirmación de cancelación */
  CANCELLED: 'Entendido. Tu solicitud ha sido cancelada. Si necesitas ayuda, escríbenos nuevamente.',
} as const;

// ── Mensajes de Rechazo ─────────────────────────────────────────────────────

export const REJECTION_MESSAGES = {
  /** Mensaje de rechazo con motivo */
  REJECTED: (reason: string) => 
    `Lo sentimos, tu solicitud ha sido rechazada por el siguiente motivo:\n\n*${reason}*\n\nSi tienes dudas, contáctanos.`,
} as const;

// ── Mensajes de Comandos ────────────────────────────────────────────────────

export const COMMAND_MESSAGES = {
  /** Salir del sistema (tenía sesión activa) */
  EXIT_WITH_SESSION: '👋 Has salido del sistema. Escribe cualquier mensaje para volver a empezar.',
  
  /** Salir sin sesión activa */
  EXIT_NO_SESSION: '❓ No tienes ningún proceso activo. Escribe un mensaje para iniciar.',
} as const;

// ── Mensajes de Espera y Procesamiento ──────────────────────────────────────

export const WAIT_MESSAGES = {
  /** Solicitud siendo procesada */
  BEING_PROCESSED: '⏳ Por favor espere, su solicitud está siendo procesada. Pronto un operador le atenderá.',
} as const;

// ── Mensajes de Confirmación de Citas ───────────────────────────────────────

export const APPOINTMENT_MESSAGES = {
  /** Mensaje de pre-aprobación con imagen */
  PRE_APPROVED: '¡Tu cita ha sido pre-aprobada! 📄',
  
  /** Pregunta de confirmación de asistencia */
  CONFIRM_ATTENDANCE: '¿Confirmas tu asistencia a la cita?',
  
  /** Botón Sí */
  BTN_YES: 'Sí',
  
  /** Botón No */
  BTN_NO: 'No',
} as const;

// ── Mensajes de Dashboard/Admin ─────────────────────────────────────────────

export const ADMIN_MESSAGES = {
  /** Error al enviar mensaje desde dashboard */
  SEND_ERROR: 'Error al enviar mensaje',
  
  /** Mensaje demasiado largo */
  MESSAGE_TOO_LONG: (max: number) => `El mensaje es demasiado largo (máx. ${max} caracteres)`,
  
  /** Teléfono y mensaje requeridos */
  PHONE_MESSAGE_REQUIRED: 'El teléfono y el mensaje son obligatorios',
  
  /** Motivo demasiado largo */
  REASON_TOO_LONG: (max: number) => `Motivo demasiado largo (máx. ${max} caracteres)`,
} as const;
