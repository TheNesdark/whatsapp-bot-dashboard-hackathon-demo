import type {
  ButtonsNodeData,
  ConditionNodeData,
  EventNodeData,
  FlowDefinition,
  FlowEdge,
  FlowNode,
  MenuNodeData,
  OperatorApprovalBranch,
  OperatorApprovalNodeData,
  QuestionNodeData,
} from '@shared/flow';

const TERMINAL_NODE_TYPES = new Set(['end', 'operator', 'return']);
const SPECIAL_ENTRY_NODE_TYPES = new Set(['start', 'operator', 'event']);
const APPROVAL_EVENTS = new Set(['approved', 'rejected', 'needs_info']);
const EVENT_TYPES = new Set(['max_fails', 'timeout']);

type NodeWithOptions = FlowNode & { data: MenuNodeData | ButtonsNodeData };

/** Parsea un entero positivo desde cualquier valor. Devuelve null si no es valido */
export function parsePositiveInt(value: unknown): number | null {
  const n = Number(String(value ?? '').trim());
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Verifica que un numero de telefono tenga formato valido */
export function isValidPhone(phone: string): boolean {
  const base = phone.replace(/\s/g, '');
  return /^\+?\d{7,20}$/.test(base);
}

function getOutgoingEdges(flow: FlowDefinition, nodeId: string): FlowEdge[] {
  return flow.edges.filter((edge) => edge.source === nodeId);
}

function validateUniqueIds(
  items: Array<{ id: string }>,
  nodeId: string,
  label: string,
  errors: string[],
): void {
  const seen = new Set<string>();

  for (const item of items) {
    if (!item.id?.trim()) {
      errors.push(`El nodo "${nodeId}" tiene ${label} sin identificador`);
      continue;
    }

    if (seen.has(item.id)) {
      errors.push(`El nodo "${nodeId}" tiene ${label} duplicados: "${item.id}"`);
      continue;
    }

    seen.add(item.id);
  }
}

function validateHandledTransitions(
  flow: FlowDefinition,
  node: FlowNode,
  handles: string[],
  label: string,
  errors: string[],
): void {
  const outgoing = getOutgoingEdges(flow, node.id);
  const handleSet = new Set(handles);

  for (const handle of handles) {
    const hasEdge = outgoing.some((edge) => edge.sourceHandle === handle);
    if (!hasEdge) {
      errors.push(`El nodo "${node.id}" no tiene salida para ${label} "${handle}"`);
    }
  }

  for (const edge of outgoing) {
    if (edge.sourceHandle && !handleSet.has(edge.sourceHandle)) {
      errors.push(
        `La arista "${edge.id}" usa un handle inexistente "${edge.sourceHandle}" en el nodo "${node.id}"`,
      );
    }
  }
}

function validateOptionNode(
  flow: FlowDefinition,
  node: NodeWithOptions,
  errors: string[],
): void {
  const data = node.data;
  const options = Array.isArray(data.options) ? data.options : [];

  if (options.length === 0) {
    errors.push(`El nodo "${node.id}" (${node.type}) no tiene opciones`);
    return;
  }

  if (node.type === 'buttons' && options.length > 3) {
    errors.push(`El nodo "${node.id}" (buttons) supera el maximo de 3 opciones`);
  }

  validateUniqueIds(options, node.id, 'opciones', errors);

  for (const option of options) {
    if (!option.label?.trim()) {
      errors.push(`El nodo "${node.id}" tiene opciones sin etiqueta`);
    }
  }

  validateHandledTransitions(
    flow,
    node,
    options.map((option) => option.id),
    'la opcion',
    errors,
  );
}

function validateConditionNode(
  flow: FlowDefinition,
  node: FlowNode,
  errors: string[],
): void {
  const data = node.data as ConditionNodeData;

  if (!data.variable?.trim()) {
    errors.push(`El nodo de condicion "${node.id}" no tiene variable asignada`);
  }

  if (!Array.isArray(data.branches) || data.branches.length === 0) {
    errors.push(`El nodo de condicion "${node.id}" no tiene ramas`);
    return;
  }

  validateUniqueIds(data.branches, node.id, 'ramas', errors);

  const branchValues = new Set<string>();
  for (const branch of data.branches) {
    const branchValue = branch.value?.trim();
    if (!branchValue) {
      errors.push(`El nodo de condicion "${node.id}" tiene ramas sin valor esperado`);
      continue;
    }

    const normalized = branchValue.toLowerCase();
    if (branchValues.has(normalized)) {
      errors.push(`El nodo de condicion "${node.id}" tiene ramas duplicadas para "${branchValue}"`);
      continue;
    }

    branchValues.add(normalized);
  }

  const handles = data.branches.map((branch) => branch.id);
  if (data.defaultBranchId?.trim()) {
    if (handles.includes(data.defaultBranchId)) {
      errors.push(`El nodo de condicion "${node.id}" reutiliza el id por defecto en una rama`);
    } else {
      handles.push(data.defaultBranchId);
    }
  }

  validateHandledTransitions(flow, node, handles, 'la rama', errors);
}

function validateOperatorApprovalNode(
  flow: FlowDefinition,
  node: FlowNode,
  errors: string[],
): void {
  const data = node.data as OperatorApprovalNodeData;
  const branches = Array.isArray(data.branches) ? data.branches : [];

  if (branches.length === 0) {
    errors.push(`El nodo "${node.id}" (operator_approval) no tiene ramas`);
    return;
  }

  validateUniqueIds(branches, node.id, 'ramas de aprobacion', errors);

  const seenEvents = new Set<string>();
  for (const branch of branches) {
    if (!branch.label?.trim()) {
      errors.push(`El nodo "${node.id}" tiene ramas de aprobacion sin etiqueta`);
    }

    if (!branch.event?.trim()) {
      errors.push(`El nodo "${node.id}" tiene ramas de aprobacion sin evento`);
      continue;
    }

    if (!APPROVAL_EVENTS.has(branch.event)) {
      errors.push(`El nodo "${node.id}" usa un evento de aprobacion invalido: "${branch.event}"`);
      continue;
    }

    if (seenEvents.has(branch.event)) {
      errors.push(`El nodo "${node.id}" repite el evento de aprobacion "${branch.event}"`);
      continue;
    }

    seenEvents.add(branch.event);
  }

  validateHandledTransitions(
    flow,
    node,
    branches.map((branch) => branch.id),
    'la rama de aprobacion',
    errors,
  );
}

function validateEventNode(
  flow: FlowDefinition,
  node: FlowNode,
  eventTypeCount: Map<string, number>,
  errors: string[],
): void {
  const data = node.data as EventNodeData;
  const eventType = data.eventType?.trim();

  if (!eventType || !EVENT_TYPES.has(eventType)) {
    errors.push(`El nodo de evento "${node.id}" tiene un tipo de evento invalido`);
    return;
  }

  eventTypeCount.set(eventType, (eventTypeCount.get(eventType) ?? 0) + 1);

  if (eventType === 'max_fails') {
    const maxFails = parsePositiveInt(data.maxFails);
    if (!maxFails) {
      errors.push(`El nodo de evento "${node.id}" debe tener un maxFails valido`);
    }
  }

  const hasOutgoing = getOutgoingEdges(flow, node.id).length > 0;
  if (!hasOutgoing) {
    errors.push(`El nodo de evento "${node.id}" no tiene aristas salientes`);
  }
}

/** Valida la estructura de un FlowDefinition. Devuelve lista de errores (vacia = valido) */
export function validateFlowDefinition(flow: FlowDefinition): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(flow.nodes.map((node) => node.id));

  const startNodes = flow.nodes.filter((node) => node.type === 'start');
  if (startNodes.length !== 1) {
    errors.push(`Se requiere exactamente un nodo de inicio (encontrados: ${startNodes.length})`);
  }

  if (startNodes.length === 1) {
    const startId = startNodes[0].id;
    const hasOutgoing = getOutgoingEdges(flow, startId).length > 0;
    if (!hasOutgoing) {
      errors.push('El nodo de inicio no tiene aristas salientes');
    }
  }

  for (const node of flow.nodes) {
    if (!TERMINAL_NODE_TYPES.has(node.type ?? '')) {
      const hasOutgoing = getOutgoingEdges(flow, node.id).length > 0;
      if (!hasOutgoing) {
        errors.push(`El nodo "${node.id}" (${node.type}) no tiene aristas salientes`);
      }
    }

    if (!SPECIAL_ENTRY_NODE_TYPES.has(node.type ?? '')) {
      const hasIncoming = flow.edges.some((edge) => edge.target === node.id);
      if (!hasIncoming) {
        errors.push(`El nodo "${node.id}" (${node.type}) no tiene aristas entrantes`);
      }
    }
  }

  const eventTypeCount = new Map<string, number>();

  for (const node of flow.nodes) {
    if (node.type === 'menu' || node.type === 'buttons') {
      validateOptionNode(flow, node as NodeWithOptions, errors);
    }

    if (node.type === 'question') {
      const data = node.data as QuestionNodeData;
      if (!data.variable?.trim()) {
        errors.push(`El nodo de pregunta "${node.id}" no tiene variable asignada`);
      }
    }

    if (node.type === 'condition') {
      validateConditionNode(flow, node, errors);
    }

    if (node.type === 'operator_approval') {
      validateOperatorApprovalNode(flow, node, errors);
    }

    if (node.type === 'event') {
      validateEventNode(flow, node, eventTypeCount, errors);
    }
  }

  for (const [eventType, count] of eventTypeCount.entries()) {
    if (count > 1) {
      errors.push(`Solo puede existir un nodo de evento "${eventType}" (encontrados: ${count})`);
    }
  }

  for (const edge of flow.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`La arista "${edge.id}" referencia un nodo fuente inexistente: "${edge.source}"`);
    }

    if (!nodeIds.has(edge.target)) {
      errors.push(`La arista "${edge.id}" referencia un nodo destino inexistente: "${edge.target}"`);
    }
  }

  return errors;
}
