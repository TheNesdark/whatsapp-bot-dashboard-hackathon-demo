/**
 * Generador y migrador del flujo por defecto.
 */
import {
  DEFAULT_FLOW_APPOINTMENT_TYPES,
  DEFAULT_FLOW_EPS,
  DEFAULT_FLOW_MESSAGES,
} from '@server/constants/flow';
import type { FlowDefinition, FlowEdge, FlowNode, OperatorApprovalBranch } from '@shared/flow';

export const DEFAULT_OPERATOR_APPROVAL_BRANCHES: OperatorApprovalBranch[] = [
  { id: 'opt-accept', event: 'approved', label: 'Aprobado', status: 'accepted' },
  { id: 'opt-reject', event: 'rejected', label: 'Rechazado', status: 'rejected' },
  { id: 'opt-retry', event: 'needs_info', label: 'Corregir', status: 'pending' },
];

export function generateDefaultFlow(): FlowDefinition {
  const epsList = DEFAULT_FLOW_EPS;
  const apptTypes = DEFAULT_FLOW_APPOINTMENT_TYPES;
  const MSG = DEFAULT_FLOW_MESSAGES;

  const nodes: FlowNode[] = [
    {
      id: 'node-start',
      type: 'start',
      position: { x: 400, y: 0 },
      data: { label: 'Inicio' },
    },
    {
      id: 'node-welcome',
      type: 'message',
      position: { x: 400, y: 120 },
      data: { message: MSG.WELCOME },
    },
    {
      id: 'node-auth-msg',
      type: 'message',
      position: { x: 400, y: 240 },
      data: { message: MSG.AUTH_INFO },
    },
    {
      id: 'node-auth-menu',
      type: 'buttons',
      position: { x: 400, y: 360 },
      data: {
        title: MSG.AUTH_TITLE,
        options: [
          { id: 'opt-yes', label: 'Si, autorizo' },
          { id: 'opt-no', label: 'No autorizo' },
        ],
      },
    },
    {
      id: 'node-name',
      type: 'question',
      position: { x: 400, y: 560 },
      data: { message: MSG.ASK_NAME, variable: 'name', validation: 'text' },
    },
    {
      id: 'node-cedula',
      type: 'question',
      position: { x: 400, y: 720 },
      data: { message: MSG.ASK_CEDULA, variable: 'cedula', validation: 'document' },
    },
    {
      id: 'node-eps',
      type: 'menu',
      position: { x: 400, y: 880 },
      data: {
        title: MSG.ASK_EPS,
        options: epsList.map((label, i) => ({ id: `eps-${i}`, label })),
        variable: 'eps',
      },
    },
    {
      id: 'node-appt',
      type: 'menu',
      position: { x: 400, y: 1080 },
      data: {
        title: MSG.ASK_APPT,
        options: apptTypes.map((label, i) => ({ id: `appt-${i}`, label })),
        variable: 'appointmentType',
      },
    },
    {
      id: 'node-approval',
      type: 'operator_approval',
      position: { x: 400, y: 1280 },
      data: {
        message: 'Tu solicitud esta siendo revisada por un operador...',
        branches: DEFAULT_OPERATOR_APPROVAL_BRANCHES,
      },
    },
    {
      id: 'node-auth-reject',
      type: 'end',
      position: { x: 800, y: 360 },
      data: { message: MSG.AUTH_REJECT, action: 'none' },
    },
    {
      id: 'node-custom-eps',
      type: 'question',
      position: { x: 800, y: 1200 },
      data: { message: MSG.ASK_CUSTOM_EPS, variable: 'eps', validation: 'text' },
    },
    {
      id: 'node-rejected-image',
      type: 'media',
      position: { x: 800, y: 1480 },
      data: {
        source: 'approval_upload',
        fallbackMessage: 'Lo sentimos, tu solicitud ha sido rechazada.',
      },
    },
    {
      id: 'node-rejected',
      type: 'end',
      position: { x: 800, y: 1650 },
      data: { message: 'Si tienes dudas, contactanos.', action: 'cancel' },
    },
    {
      id: 'node-confirm-prompt',
      type: 'message',
      position: { x: 100, y: 1600 },
      data: { message: 'Tu solicitud ha sido aprobada. Confirmas tu asistencia?' },
    },
    {
      id: 'node-approval-image',
      type: 'media',
      position: { x: 100, y: 1480 },
      data: {
        source: 'approval_upload',
        fallbackMessage: 'Tu solicitud ha sido aprobada.',
      },
    },
    {
      id: 'node-confirm',
      type: 'buttons',
      position: { x: 100, y: 1720 },
      data: {
        title: 'Por favor confirma tu asistencia:',
        options: [
          { id: 'opt-confirm-yes', label: 'Si, confirmo' },
          { id: 'opt-confirm-no', label: 'No asistire' },
        ],
      },
    },
    {
      id: 'node-confirmed',
      type: 'end',
      position: { x: -100, y: 1950 },
      data: { message: 'Asistencia confirmada. Nos vemos pronto.', action: 'confirm' },
    },
    {
      id: 'node-cancelled',
      type: 'end',
      position: { x: 300, y: 1950 },
      data: { message: 'Entendido. Tu cita ha sido cancelada.', action: 'cancel' },
    },
    {
      id: 'node-retry-msg',
      type: 'message',
      position: { x: 650, y: 1750 },
      data: { message: 'Tu solicitud requiere correcciones. Por favor, ingresa tus datos nuevamente.' },
    },
    {
      id: 'node-max-fails-event',
      type: 'event',
      position: { x: -400, y: 0 },
      data: { eventType: 'max_fails', maxFails: 3 },
    },
    {
      id: 'node-max-fails-menu',
      type: 'buttons',
      position: { x: -400, y: 120 },
      data: {
        title: 'Parece que tienes dificultades. Deseas que un operador te contacte?',
        options: [
          { id: 'opt-help-yes', label: 'Si, hablar con operador' },
          { id: 'opt-help-no', label: 'No, seguir intentando' },
        ],
      },
    },
    {
      id: 'node-operator',
      type: 'operator',
      position: { x: -650, y: 360 },
      data: { message: MSG.OPERATOR },
    },
    {
      id: 'node-max-fails-retry',
      type: 'message',
      position: { x: -150, y: 360 },
      data: { message: 'Entendido. Por favor intenta nuevamente.' },
    },
    {
      id: 'node-max-fails-return',
      type: 'return',
      position: { x: -150, y: 480 },
      data: { label: 'Regresar' },
    },
  ];

  const edges: FlowEdge[] = [
    { id: 'e-start-welcome', source: 'node-start', target: 'node-welcome' },
    { id: 'e-welcome-auth', source: 'node-welcome', target: 'node-auth-msg' },
    { id: 'e-auth-menu', source: 'node-auth-msg', target: 'node-auth-menu' },
    { id: 'e-auth-yes', source: 'node-auth-menu', sourceHandle: 'opt-yes', target: 'node-name' },
    { id: 'e-auth-no', source: 'node-auth-menu', sourceHandle: 'opt-no', target: 'node-auth-reject' },
    { id: 'e-name-cedula', source: 'node-name', target: 'node-cedula' },
    { id: 'e-cedula-phone', source: 'node-cedula', target: 'node-phone' },
    { id: 'e-phone-address', source: 'node-phone', target: 'node-address' },
    { id: 'e-address-eps', source: 'node-address', target: 'node-eps' },
    ...epsList.map((label, i) => ({
      id: `e-eps-${i}`,
      source: 'node-eps',
      sourceHandle: `eps-${i}`,
      target: label.toLowerCase() === 'otra' ? 'node-custom-eps' : 'node-appt',
    })),
    { id: 'e-custom-eps-appt', source: 'node-custom-eps', target: 'node-appt' },
    ...apptTypes.map((_, i) => ({
      id: `e-appt-${i}`,
      source: 'node-appt',
      sourceHandle: `appt-${i}`,
      target: 'node-approval',
    })),
    { id: 'e-approval-accept', source: 'node-approval', sourceHandle: 'opt-accept', target: 'node-approval-image' },
    { id: 'e-approval-image-prompt', source: 'node-approval-image', target: 'node-confirm-prompt' },
    { id: 'e-confirm-prompt', source: 'node-confirm-prompt', target: 'node-confirm' },
    { id: 'e-confirm-yes', source: 'node-confirm', sourceHandle: 'opt-confirm-yes', target: 'node-confirmed' },
    { id: 'e-confirm-no', source: 'node-confirm', sourceHandle: 'opt-confirm-no', target: 'node-cancelled' },
    { id: 'e-approval-reject', source: 'node-approval', sourceHandle: 'opt-reject', target: 'node-rejected-image' },
    { id: 'e-approval-retry', source: 'node-approval', sourceHandle: 'opt-retry', target: 'node-retry-msg' },
    { id: 'e-retry-to-start', source: 'node-retry-msg', target: 'node-name' },
    { id: 'e-rejected-image-end', source: 'node-rejected-image', target: 'node-rejected' },
    { id: 'e-event-to-menu', source: 'node-max-fails-event', target: 'node-max-fails-menu' },
    { id: 'e-menu-to-operator', source: 'node-max-fails-menu', sourceHandle: 'opt-help-yes', target: 'node-operator' },
    { id: 'e-menu-to-retry', source: 'node-max-fails-menu', sourceHandle: 'opt-help-no', target: 'node-max-fails-retry' },
    { id: 'e-retry-to-return', source: 'node-max-fails-retry', target: 'node-max-fails-return' },
  ];

  return { nodes, edges };
}

export function normalizeOperatorApprovalBranches(node: FlowNode): OperatorApprovalBranch[] {
  if (node.type !== 'operator_approval') {
    return [];
  }

  const data = node.data as Record<string, unknown>;
  const branches = Array.isArray(data.branches) ? (data.branches as OperatorApprovalBranch[]) : [];
  if (branches.length > 0) {
    return branches;
  }

  const legacyBranches: OperatorApprovalBranch[] = [];
  if (typeof data.acceptBranchId === 'string' && data.acceptBranchId) {
    legacyBranches.push({
      id: data.acceptBranchId,
      event: 'approved',
      label: 'Aprobado',
      status: 'accepted',
    });
  }
  if (typeof data.rejectBranchId === 'string' && data.rejectBranchId) {
    legacyBranches.push({
      id: data.rejectBranchId,
      event: 'rejected',
      label: 'Rechazado',
      status: 'rejected',
    });
  }

  return legacyBranches.length > 0 ? legacyBranches : DEFAULT_OPERATOR_APPROVAL_BRANCHES;
}

function normalizeLegacyEndAction(node: FlowNode): FlowNode {
  if (node.type !== 'end') {
    return node;
  }

  const data = node.data as Record<string, unknown>;
  if (typeof data.action === 'string' && data.action) {
    return node;
  }

  if (node.id === 'node-confirmed') {
    return { ...node, data: { ...data, action: 'confirm' } } as FlowNode;
  }

  if (node.id === 'node-cancelled' || node.id === 'node-rejected') {
    return { ...node, data: { ...data, action: 'cancel' } } as FlowNode;
  }

  return node;
}

export function normalizeFlowDefinition(definition: FlowDefinition): FlowDefinition {
  return {
    ...definition,
    nodes: definition.nodes.map((node) => {
      const withBranches =
        node.type === 'operator_approval'
          ? ({
            ...node,
            data: {
              ...(node.data as Record<string, unknown>),
              branches: normalizeOperatorApprovalBranches(node),
            },
          } as FlowNode)
          : node;

      return normalizeLegacyEndAction(withBranches);
    }),
    edges: [...definition.edges],
  };
}
