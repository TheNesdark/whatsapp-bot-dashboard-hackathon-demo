/**
 * Tipos compartidos para el editor visual de flujos conversacionales.
 * Usados tanto en el cliente (React Flow) como en el servidor (FlowEngine).
 */
import type { Node, Edge } from '@xyflow/react';

// ── Variables de flujo ────────────────────────────────────────────────────────

// Usamos un tipo genérico de string para las variables, permitiendo cualquier identificador configurado.
export type FlowVariableType = string;

// ── Tipos de validación para Nodo_Pregunta ────────────────────────────────────

export type QuestionValidationType = 'text' | 'number' | 'phone' | 'document';

// ── Payloads de datos por tipo de nodo ────────────────────────────────────────

export interface StartNodeData extends Record<string, unknown> {
  label: string;
}

export interface MessageNodeData extends Record<string, unknown> {
  message: string;
}

export interface MediaNodeData extends Record<string, unknown> {
  source: 'approval_upload';
  caption?: string;
  fallbackMessage?: string;
}

export interface QuestionNodeData extends Record<string, unknown> {
  message: string;
  variable: FlowVariableType;
  validation: QuestionValidationType;
}

export interface MenuOption {
  id: string;    // UUID estable — usado como sourceHandle del edge
  label: string;
}

export interface MenuNodeData extends Record<string, unknown> {
  title: string;
  variable?: FlowVariableType;
  options: MenuOption[];
}

export interface ButtonsNodeData extends Record<string, unknown> {
  title: string;
  variable?: FlowVariableType;
  options: MenuOption[];
}

export interface ConditionBranch {
  id: string;    // UUID estable — usado como sourceHandle del edge
  value: string; // valor esperado de la variable
}

export interface ConditionNodeData extends Record<string, unknown> {
  variable: FlowVariableType;
  branches: ConditionBranch[];
  defaultBranchId: string;
}

export interface EndNodeData extends Record<string, unknown> {
  message: string;
  action?: 'none' | 'confirm' | 'cancel'; // Acción a ejecutar al terminar (ej: confirmar cita)
}

export interface OperatorNodeData extends Record<string, unknown> {
  message: string;
}

export interface OperatorApprovalBranch {
  id: string;
  event: 'approved' | 'rejected' | 'needs_info';
  label: string;
  status?: 'accepted' | 'rejected' | 'pending';
}

export interface OperatorApprovalNodeData extends Record<string, unknown> {
  message: string;
  branches: OperatorApprovalBranch[];
}

export interface ReturnNodeData extends Record<string, unknown> {
  label: string;
}

export interface EventNodeData extends Record<string, unknown> {
  eventType: 'max_fails' | 'timeout';
  maxFails?: number;
}

export type FlowNodeData =
  | StartNodeData
  | MessageNodeData
  | MediaNodeData
  | QuestionNodeData
  | MenuNodeData
  | ButtonsNodeData
  | ConditionNodeData
  | EndNodeData
  | OperatorNodeData
  | OperatorApprovalNodeData
  | ReturnNodeData
  | EventNodeData;

// ── Tipos de nodo registrados en React Flow ───────────────────────────────────

export type FlowNodeType =
  | 'start'
  | 'message'
  | 'media'
  | 'question'
  | 'menu'
  | 'buttons'
  | 'condition'
  | 'end'
  | 'operator'
  | 'operator_approval'
  | 'return'
  | 'event';

// ── Tipos principales ─────────────────────────────────────────────────────────

export type FlowNode = Node<FlowNodeData, FlowNodeType>;
export type FlowEdge = Edge;

export interface FlowDefinition {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
