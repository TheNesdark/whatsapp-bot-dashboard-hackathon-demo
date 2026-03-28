import type {
  ButtonsNodeData,
  ConditionNodeData,
  EndNodeData,
  EventNodeData,
  FlowDefinition,
  FlowNode,
  MediaNodeData,
  MenuNodeData,
  MessageNodeData,
  OperatorApprovalBranch,
  OperatorApprovalNodeData,
  OperatorNodeData,
  QuestionNodeData,
  StartNodeData,
} from '@shared/flow';
import { FlowVariableType } from '@shared/flow';
import type { InstanceState } from '@server/types/instance';
import type { UserState } from '@server/types/whatsapp';
import { stmts } from '@server/db/db';
import { getInactividadConfig } from '@server/services/whatsapp/config';
import { instanceManager } from '@server/services/whatsapp/instanceManager';
import { ERROR_MESSAGES, WAIT_MESSAGES } from '@server/services/whatsapp/messages';
import { reply, sendWhatsAppImage } from '@server/services/whatsapp/sender';
import type { ReplyMessage } from '@server/types';
import { broadcast } from '@server/services/wsServer';
import {
  assignNodeSelectionValue,
  buildButtonMenu,
  buildInteractiveList,
  findInteractiveOptionByInput,
  resolveMenuSelection,
  validateQuestionValue,
  replaceVariables,
  normalizeDigitsInput,
  sanitizeInput,
} from '@server/utils/index';
import { REGISTRATION_ACTIVE_STATUSES } from '@shared/registration';
import {
  DEFAULT_OPERATOR_APPROVAL_BRANCHES,
  generateDefaultFlow,
  normalizeFlowDefinition,
  normalizeOperatorApprovalBranches,
} from './defaultFlow';
import type { 
  ReplyFn, 
  OperatorApprovalEvent, 
  RuntimeImage, 
  FlowRuntimeContext, 
  RegistrationConversationRow 
} from '@server/types';
import { normalizePhoneForStorage } from '../state';

export class FlowEngine {
  private definition: FlowDefinition;
  private nodesMap: Map<string, FlowNode> = new Map();

  constructor() {
    const row = stmts.selectSettingByKey.get('flow_definition') as { value: string } | undefined;
    if (row?.value) {
      try {
        this.definition = normalizeFlowDefinition(JSON.parse(row.value) as FlowDefinition);
      } catch {
        this.definition = generateDefaultFlow();
      }
    } else {
      this.definition = generateDefaultFlow();
    }
    this.indexNodes();
  }

  reload(def: FlowDefinition): void {
    this.definition = normalizeFlowDefinition(def);
    this.indexNodes();
  }

  getApprovalBranchesForRegistration(from: string, instanceId: number): OperatorApprovalBranch[] {
    const session = stmts.selectSession.get(instanceId, from) as { state_json: string } | undefined;
    if (!session) return [];

    try {
      const state = JSON.parse(session.state_json) as UserState;
      const node = this.getNodeById(state.nodeId);
      if (node?.type !== 'operator_approval') return [];

      return normalizeOperatorApprovalBranches(node);
    } catch {
      return [];
    }
  }

  private getStartNode(): FlowNode | undefined {
    return this.definition.nodes.find((node) => node.type === 'start');
  }

  private indexNodes(): void {
    this.nodesMap.clear();
    for (const node of this.definition.nodes) {
      this.nodesMap.set(node.id, node);
    }
  }

  private getNodeById(id: string): FlowNode | undefined {
    return this.nodesMap.get(id);
  }

  private getNextNode(nodeId: string, sourceHandle?: string): FlowNode | undefined {
    const edge = this.definition.edges.find(
      (item) => item.source === nodeId && (sourceHandle ? item.sourceHandle === sourceHandle : true),
    );
    if (!edge) return undefined;
    return this.getNodeById(edge.target);
  }

  getFirstOperatorApprovalNode(): FlowNode | undefined {
    return this.definition.nodes.find((node) => node.type === 'operator_approval');
  }

  private getGlobalEventNode(eventType: EventNodeData['eventType']): FlowNode | undefined {
    return this.definition.nodes.find(
      (node) => node.type === 'event' && (node.data as EventNodeData).eventType === eventType,
    );
  }

  private findNearestOperator(fromNodeId: string): FlowNode | undefined {
    const visited = new Set<string>();
    const queue: string[] = [fromNodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.getNodeById(current);
      if (node?.type === 'operator') return node;

      const outgoing = this.definition.edges.filter((edge) => edge.source === current);
      for (const edge of outgoing) queue.push(edge.target);
    }

    return this.definition.nodes.find((node) => node.type === 'operator');
  }

  private findNearestMaxFailsEvent(fromNodeId: string): FlowNode | undefined {
    const visited = new Set<string>();
    const queue: string[] = [fromNodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.getNodeById(current);
      if (node?.type === 'event' && (node.data as EventNodeData).eventType === 'max_fails') {
        return node;
      }

      const outgoing = this.definition.edges.filter((edge) => edge.source === current);
      for (const edge of outgoing) queue.push(edge.target);
    }

    return this.getGlobalEventNode('max_fails');
  }

  private hydrateApprovalState(
    from: string,
    instanceId: number,
    registrationId: number,
  ): UserState | null {
    const approvalNode = this.getFirstOperatorApprovalNode();
    if (!approvalNode) {
      return null;
    }

    const registration = stmts.selectRegistrationConversationById.get(registrationId) as
      | RegistrationConversationRow
      | undefined;
    if (!registration) {
      return null;
    }

    // Cargar datos dinámicos para hidratar el estado
    const dataRows = stmts.selectRegistrationData.all(registrationId) as Array<{
      variable_key: string;
      value: string;
    }>;
    const variables = Object.fromEntries(dataRows.map((row) => [row.variable_key, row.value]));

    const state: UserState = {
      nodeId: approvalNode.id,
      registrationId,
      variables,
      failCount: 0,
    };

    const inst = instanceManager.get(instanceId);
    if (inst) {
      inst.userStates.set(from, state);
      instanceManager.touchState(instanceId, from);
    }

    return state;
  }

  private async autoAdvance(
    from: string,
    state: UserState,
    instanceId: number,
    replyTo: ReplyFn,
    visitedNodes = new Set<string>(),
    runtimeContext?: FlowRuntimeContext,
  ): Promise<void> {
    let node = this.getNodeById(state.nodeId);

    while (node?.type === 'message' || node?.type === 'media') {
      if (visitedNodes.has(node.id)) {
        console.warn(`[FlowEngine] Bucle infinito detectado en mensajes para ${from} en el nodo ${node.id}`);
        this.endAndClearState(instanceId, from, state);
        return;
      }

      visitedNodes.add(node.id);
      if (node.type === 'message') {
        const data = node.data as MessageNodeData;
        await replyTo(replaceVariables(data.message, state.variables));
      } else {
        await this._processMediaNode(from, instanceId, node, replyTo, runtimeContext);
      }

      const next = this.getNextNode(node.id);
      if (!next) break;
      state.nodeId = next.id;
      node = next;
    }

    if (!node) return;

    if (visitedNodes.has(node.id)) {
      console.warn(`[FlowEngine] Bucle infinito detectado para ${from} en el nodo ${node.id}`);
      this.endAndClearState(instanceId, from, state);
      return;
    }

    visitedNodes.add(node.id);

    if (node.type === 'menu') {
      const data = node.data as MenuNodeData;
      await replyTo(buildInteractiveList({
        ...data,
        title: replaceVariables(data.title, state.variables)
      }), 0);
      return;
    }

    if (node.type === 'buttons') {
      const data = node.data as ButtonsNodeData;
      await replyTo(buildButtonMenu(
        replaceVariables(data.title, state.variables), 
        data.options.slice(0, 3).map((option) => option.label)
      ), 0);
      return;
    }

    if (node.type === 'question') {
      const data = node.data as QuestionNodeData;
      await replyTo(replaceVariables(data.message, state.variables));
      return;
    }

    if (node.type === 'condition') {
      const next = this._evaluateCondition(node, state);
      if (next) {
        state.nodeId = next.id;
        await this.autoAdvance(from, state, instanceId, replyTo, visitedNodes, runtimeContext);
      } else {
        const eventNode = this.findNearestMaxFailsEvent(node.id);
        if (eventNode) {
          state.nodeId = eventNode.id;
          await this._processEvent(from, state, instanceId, replyTo, eventNode, visitedNodes);
        } else {
          this.endAndClearState(instanceId, from, state);
        }
      }
      return;
    }

    if (node.type === 'end') {
      await this._processEnd(from, state, instanceId, replyTo, node);
      return;
    }

    if (node.type === 'operator') {
      await this._processOperator(from, state, instanceId, replyTo, node, true);
      return;
    }

    if (node.type === 'operator_approval') {
      await this._processOperatorApproval(from, '', state, instanceId, replyTo, node, true);
      return;
    }

    if (node.type === 'event') {
      await this._processEvent(from, state, instanceId, replyTo, node, visitedNodes);
      return;
    }

    if (node.type === 'return') {
      await this._processReturn(from, state, instanceId, replyTo, visitedNodes);
    }
  }

  private async _processReturn(
    from: string,
    state: UserState,
    instanceId: number,
    replyTo: ReplyFn,
    visitedNodes = new Set<string>(),
  ): Promise<void> {
    if (state.previousNodeId) {
      const prevId = state.previousNodeId;
      state.previousNodeId = undefined;
      state.nodeId = prevId;
      await this.autoAdvance(from, state, instanceId, replyTo, visitedNodes);
    } else {
      const start = this.getStartNode();
      if (start) {
        state.nodeId = start.id;
        await this.autoAdvance(from, state, instanceId, replyTo, visitedNodes);
      }
    }
  }

  private async _processMediaNode(
    from: string,
    instanceId: number,
    node: FlowNode,
    replyTo: ReplyFn,
    runtimeContext?: FlowRuntimeContext,
  ): Promise<void> {
    const data = node.data as MediaNodeData;

    if (data.source === 'approval_upload' && runtimeContext?.approvalImage) {
      await sendWhatsAppImage(from, runtimeContext.approvalImage, instanceId, data.caption || undefined);
      return;
    }

    if (data.fallbackMessage) {
      let message = data.fallbackMessage;
      // Si hay un motivo de rechazo en las variables, lo incluimos en el mensaje de fallback
      const session = stmts.selectSession.get(instanceId, from) as { state_json: string } | undefined;
      if (session) {
        try {
          const state = JSON.parse(session.state_json) as UserState;
          if (state.variables.rejection_reason) {
            message = `${message}\n\n*Motivo:* ${state.variables.rejection_reason}`;
          }
        } catch (e) {}
      }
      await replyTo(message);
    }
  }

  private endAndClearState(instanceId: number, from: string, _state?: UserState): void {
    instanceManager.clearUserState(instanceId, from);
  }

  async handleNewConversation(
    from: string,
    inst: InstanceState,
    settings: Record<string, string>,
    instanceId: number,
  ): Promise<void> {
    const cleanFrom = normalizePhoneForStorage(from);
    const replyTo: ReplyFn = (msg, typingMs) => reply(cleanFrom, instanceId, msg, typingMs);

    let existing: { id: number; status: string } | undefined;
    try {
      existing = stmts.selectRegistrationByPhoneInProgress.get(cleanFrom, ...REGISTRATION_ACTIVE_STATUSES) as
        | { id: number; status: string }
        | undefined;
    } catch (err) {
      console.error(`[WA#${instanceId}] Error consultando registro existente:`, err);
    }

    if (existing) {
      if (existing.status === 'attending') return;
      try {
        await replyTo(WAIT_MESSAGES.BEING_PROCESSED);
      } catch {
        // ignore
      }
      return;
    }

    const startNode = this.getStartNode();
    if (!startNode) {
      console.error(`[WA#${instanceId}] No se encontro nodo de inicio en el flujo`);
      return;
    }

    const state: UserState = { nodeId: startNode.id, variables: {}, failCount: 0 };
    inst.userStates.set(cleanFrom, state);
    instanceManager.touchState(instanceId, cleanFrom);

    const wasInactive = inst.recentCleanups.get(cleanFrom);
    if (wasInactive) {
      inst.recentCleanups.delete(cleanFrom);
      const timeoutNode = this.getGlobalEventNode('timeout');
      if (timeoutNode) {
        state.nodeId = timeoutNode.id;
        await this._processEvent(cleanFrom, state, instanceId, replyTo, timeoutNode);
        return;
      }

      try {
        await replyTo(getInactividadConfig(settings).mensajeReinicio);
      } catch {
        // ignore
      }
    }

    const firstNode = this.getNextNode(startNode.id);
    if (firstNode) {
      state.nodeId = firstNode.id;
      await this.autoAdvance(cleanFrom, state, instanceId, replyTo);
    }
  }

  async processMessage(
    from: string,
    body: string,
    state: UserState,
    instanceId: number,
  ): Promise<void> {
    const cleanFrom = normalizePhoneForStorage(from);
    const replyTo: ReplyFn = (msg, typingMs) => reply(cleanFrom, instanceId, msg, typingMs);
    let node = this.getNodeById(state.nodeId);

    // Fallback de seguridad: Si el nodo no existe (fue borrado del flujo), resetear al inicio
    if (!node) {
      console.warn(`[FlowEngine] Nodo ${state.nodeId} no encontrado para ${cleanFrom}. Reseteando al inicio.`);
      const startNode = this.getStartNode();
      if (startNode) {
        state.nodeId = startNode.id;
        state.failCount = 0;
        return this.handleNewConversation(cleanFrom, instanceManager.get(instanceId)!, {}, instanceId);
      }
      
      this.endAndClearState(instanceId, cleanFrom, state);
      await replyTo(ERROR_MESSAGES.UNEXPECTED_ERROR);
      return;
    }

    switch (node.type) {
      case 'message':
        await this.autoAdvance(cleanFrom, state, instanceId, replyTo);
        break;
      case 'question':
        await this._processQuestion(cleanFrom, body, state, instanceId, replyTo, node);
        break;
      case 'menu':
        await this._processMenu(cleanFrom, body, state, instanceId, replyTo, node);
        break;
      case 'buttons':
      case 'event':
        await this._processButtons(cleanFrom, body, state, instanceId, replyTo, node);
        break;
      case 'end':
        await this._processEnd(cleanFrom, state, instanceId, replyTo, node);
        break;
      case 'condition': {
        const next = this._evaluateCondition(node, state);
        if (next) {
          state.nodeId = next.id;
          await this.autoAdvance(cleanFrom, state, instanceId, replyTo);
        }
        break;
      }
      case 'operator':
        await this._processOperator(cleanFrom, state, instanceId, replyTo, node);
        break;
      case 'operator_approval':
        await this._processOperatorApproval(cleanFrom, body, state, instanceId, replyTo, node);
        break;
      default:
        this.endAndClearState(instanceId, cleanFrom, state);
        await replyTo(ERROR_MESSAGES.UNEXPECTED_ERROR);
    }
  }

  private _evaluateCondition(node: FlowNode, state: UserState): FlowNode | undefined {
    const data = node.data as ConditionNodeData;
    const variableValue = state.variables[data.variable] ?? '';

    for (const branch of data.branches) {
      if (branch.value.toLowerCase() === variableValue.toLowerCase()) {
        const edge = this.definition.edges.find(
          (item) => item.source === node.id && item.sourceHandle === branch.id,
        );
        if (edge) return this.getNodeById(edge.target);
      }
    }

    if (data.defaultBranchId) {
      const edge = this.definition.edges.find(
        (item) => item.source === node.id && item.sourceHandle === data.defaultBranchId,
      );
      if (edge) return this.getNodeById(edge.target);
    }

    const defaultEdge = this.definition.edges.find((item) => item.source === node.id && !item.sourceHandle);
    if (defaultEdge) return this.getNodeById(defaultEdge.target);

    return undefined;
  }

  private async _processQuestion(
    from: string,
    body: string,
    state: UserState,
    instanceId: number,
    replyTo: ReplyFn,
    node: FlowNode,
  ): Promise<void> {
    const data = node.data as QuestionNodeData;
    const trimmed = body.trim();
    const errorMsg = validateQuestionValue(data, trimmed);

    if (errorMsg) {
      await this._handleFailedValidation(from, state, instanceId, replyTo, errorMsg, () =>
        replyTo(replaceVariables(data.message, state.variables)),
      );
      return;
    }

    state.failCount = 0;
    // Limpiar formatos si es numérico antes de guardar y sanitizar texto
    const finalValue = (data.validation === 'document' || data.validation === 'phone' || data.validation === 'number')
      ? normalizeDigitsInput(trimmed)
      : sanitizeInput(trimmed);
      
    state.variables[data.variable] = finalValue;

    const next = this.getNextNode(node.id);
    if (next) {
      state.nodeId = next.id;
      await this.autoAdvance(from, state, instanceId, replyTo);
    } else {
      this.endAndClearState(instanceId, from, state);
    }
  }

  private async _processMenu(
    from: string,
    body: string,
    state: UserState,
    instanceId: number,
    replyTo: ReplyFn,
    node: FlowNode,
  ): Promise<void> {
    const data = node.data as MenuNodeData;
    let option = findInteractiveOptionByInput(data.options, body);
    if (!option) {
      const idx = parseInt(body.trim(), 10) - 1;
      if (idx >= 0 && idx < data.options.length) option = data.options[idx];
    }

    if (!option) {
      await this._handleFailedValidation(
        from,
        state,
        instanceId,
        replyTo,
        'Opcion invalida. Por favor, selecciona una opcion valida del menu.',
        () => replyTo(buildInteractiveList(data)),
      );
      return;
    }

    state.failCount = 0;
    const selected = option.label;
    assignNodeSelectionValue(state, node.id, data.variable, selected);

    const next = this.getNextNode(node.id, option.id);
    if (next) {
      state.nodeId = next.id;
      await this.autoAdvance(from, state, instanceId, replyTo);
    } else {
      this.endAndClearState(instanceId, from, state);
    }
  }

  private async _processButtons(
    from: string,
    body: string,
    state: UserState,
    instanceId: number,
    replyTo: ReplyFn,
    node: FlowNode,
  ): Promise<void> {
    const data = node.data as ButtonsNodeData;
    const options = data.options.slice(0, 3);
    const labels = options.map((option) => option.label);
    const trimmed = body.trim();

    let selected: string | null = null;
    const selectedOption = findInteractiveOptionByInput(options, trimmed);
    if (selectedOption) {
      selected = selectedOption.label;
    } else {
      selected = resolveMenuSelection(trimmed, labels);
    }

    if (!selected) {
      await this._handleFailedValidation(
        from,
        state,
        instanceId,
        replyTo,
        'Opcion invalida. Por favor selecciona una de las opciones:',
        () => replyTo(buildButtonMenu(data.title, labels)),
      );
      return;
    }

    state.failCount = 0;
    const option = options.find((item) => item.label === selected);
    if (!option) return;

    assignNodeSelectionValue(state, node.id, data.variable, selected);

    const next = this.getNextNode(node.id, option.id);
    if (next) {
      state.nodeId = next.id;
      await this.autoAdvance(from, state, instanceId, replyTo);
    } else {
      this.endAndClearState(instanceId, from, state);
    }
  }

  private async _processEnd(
    from: string,
    state: UserState,
    instanceId: number,
    replyTo: ReplyFn,
    node: FlowNode,
  ): Promise<void> {
    const data = node.data as EndNodeData;
    const variables = state.variables;

    if (state.registrationId && data.action && data.action !== 'none') {
      if (data.action === 'confirm') {
        stmts.updateRegistrationStatus.run('confirmed', state.registrationId);
        broadcast('registrations:changed', { id: state.registrationId, status: 'confirmed' });
      } else if (data.action === 'cancel') {
        stmts.updateRegistrationStatus.run('rejected', state.registrationId);
        broadcast('registrations:changed', { id: state.registrationId, status: 'rejected' });
      }
    }

    if (data.action === 'none') {
      await replyTo(data.message, 1500);
      this.endAndClearState(instanceId, from, state);
      return;
    }

    try {
      if (!state.registrationId) {
        // ... (resto del código)
      }

      await replyTo(data.message, 1500);
    } catch (err) {
      console.error('[FlowEngine] Error al guardar registro dinámico:', err);
      await replyTo(ERROR_MESSAGES.SAVE_ERROR);
    } finally {
      this.endAndClearState(instanceId, from, state);
    }
  }

  private async _processOperator(
    from: string,
    state: UserState,
    instanceId: number,
    replyTo: ReplyFn,
    node: FlowNode,
    isFirstTime = false,
  ): Promise<void> {
    if (isFirstTime) {
      // Crear solicitud de ayuda en la base de datos primero (más fiable)
      try {
        const name = (state.variables.name || state.variables.full_name || null) as string | null;
        const cedula = (state.variables.cedula || null) as string | null;
        
        const existing = stmts.selectHelpRequestByPhone.get(from) as { id: number } | undefined;
        if (!existing) {
          const result = stmts.insertHelpRequest.run(
            from,
            name,
            cedula,
            instanceId,
            'pending',
            node.id,
            JSON.stringify(state.variables)
          );
          const id = Number(result.lastInsertRowid);
          broadcast('help:request', {
            id,
            phone_number: from,
            full_name: name,
            cedula,
            instance_id: instanceId,
            status: 'pending',
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('[FlowEngine] Error al crear solicitud de ayuda:', err);
        await replyTo('Lo sentimos, hubo un error al solicitar ayuda. Por favor intenta más tarde.');
        return;
      }

      // 2. Informar al usuario
      const data = node.data as OperatorNodeData;
      await replyTo(data.message || 'Esperando a un operador...');
    }

    if (!isFirstTime && !this.findNearestOperator(node.id)) {
      this.endAndClearState(instanceId, from, state);
    }
  }

  private async _processOperatorApproval(
    from: string,
    _body: string,
    state: UserState,
    instanceId: number,
    replyTo: ReplyFn,
    node: FlowNode,
    isFirstTime = false,
  ): Promise<void> {
    if (isFirstTime) {
      const data = node.data as OperatorApprovalNodeData;
      await replyTo(data.message || 'Esperando aprobacion...');
    }

    if (state.registrationId) return;

    // Buscamos si ya existe un registro pendiente por número
    const duplicate = stmts.selectRegistrationByPhone.get(from, 'pending', 'confirming') as
      | { id: number }
      | undefined;

    if (!duplicate) {
      // Insertar registro base
      const res = stmts.insertRegistration.run(from, instanceId);
      const regId = res.lastInsertRowid as number;
      state.registrationId = regId;

      // Insertar todos los datos recolectados de forma dinámica
      for (const [key, value] of Object.entries(state.variables)) {
        if (value) {
          stmts.insertRegistrationData.run(regId, key, value);
        }
      }

      broadcast('registrations:new', { instanceId });
    } else {
      state.registrationId = duplicate.id;
    }
  }

  private resolveOperatorApprovalTransition(
    node: FlowNode,
    event: OperatorApprovalEvent,
  ): { branchId: string; status: string } | null {
    if (node.type !== 'operator_approval') {
      return null;
    }

    const branches: OperatorApprovalBranch[] = normalizeOperatorApprovalBranches(node);

    const branch = branches.find((item) => item.event === event);
    if (!branch) {
      return null;
    }

    const status =
      branch.status ??
      DEFAULT_OPERATOR_APPROVAL_BRANCHES.find((item) => item.event === event)?.status ??
      'pending';
    return { branchId: branch.id, status };
  }

  async resumeFromExternalEvent(
    from: string,
    instanceId: number,
    registrationId: number,
    event: OperatorApprovalEvent,
    runtimeContext?: FlowRuntimeContext,
  ): Promise<void> {
    const inst = instanceManager.get(instanceId);
    if (!inst) return;

    let state = inst.userStates.get(from);
    let node = state ? this.getNodeById(state.nodeId) : undefined;

    if (!state || node?.type !== 'operator_approval') {
      state = this.hydrateApprovalState(from, instanceId, registrationId);
      node = state ? this.getNodeById(state.nodeId) : undefined;
    }

    if (!state || node?.type !== 'operator_approval') return;

    const transition = this.resolveOperatorApprovalTransition(node, event);
    if (!transition) return;

    // Si el evento es 'rejected' y viene con un runtimeContext que tiene un motivo,
    // podemos guardarlo en las variables para que el nodo fin lo use si es necesario.
    if (event === 'rejected' && runtimeContext?.rejectionReason) {
      state.variables.rejection_reason = runtimeContext.rejectionReason;
    }

    stmts.updateRegistrationStatus.run(transition.status, registrationId);
    broadcast('registrations:changed', { id: registrationId, status: transition.status });

    const next = this.getNextNode(node.id, transition.branchId);
    if (next) {
      state.nodeId = next.id;
      const replyTo: ReplyFn = (msg, typingMs) => reply(from, instanceId, msg, typingMs);
      await this.autoAdvance(from, state, instanceId, replyTo, new Set<string>(), runtimeContext);
      instanceManager.touchState(instanceId, from);
    } else {
      this.endAndClearState(instanceId, from, state);
    }
  }

  async continueFromApproval(
    from: string,
    instanceId: number,
    approved: boolean,
    registrationId: number,
  ): Promise<void> {
    await this.resumeFromExternalEvent(
      from,
      instanceId,
      registrationId,
      approved ? 'approved' : 'rejected',
    );
  }

  private async _processEvent(
    from: string,
    state: UserState,
    instanceId: number,
    replyTo: ReplyFn,
    node: FlowNode,
    visitedNodes = new Set<string>(),
  ): Promise<void> {
    const data = node.data as EventNodeData;
    if (data.eventType === 'max_fails' || data.eventType === 'timeout') {
      const next = this.getNextNode(node.id);
      if (next) {
        state.nodeId = next.id;
        return this.autoAdvance(from, state, instanceId, replyTo, visitedNodes);
      }
    }
    this.endAndClearState(instanceId, from, state);
    return Promise.resolve();
  }

  private _handleFailedValidation(
    from: string,
    state: UserState,
    instanceId: number,
    replyTo: ReplyFn,
    errorMessage: string,
    retryFn: () => Promise<void>,
  ): Promise<void> {
    state.failCount = (state.failCount || 0) + 1;

    const eventNode = this.findNearestMaxFailsEvent(state.nodeId);
    if (eventNode) {
      const data = eventNode.data as EventNodeData;
      if (state.failCount >= (data.maxFails || 3)) {
        state.nodeId = eventNode.id;
        return this._processEvent(from, state, instanceId, replyTo, eventNode);
      }
    }

    return retryFn();
  }
}

