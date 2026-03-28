import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  ConnectionLineType,
  MarkerType,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Loader2, CheckCircle, AlertCircle, GitBranch, RotateCcw, MousePointer2, Hand } from 'lucide-react';
import { useFlow } from '@/hooks';
import { NodePalette } from '@/components/flow/NodePalette';
import { NodePropertiesPanel } from '@/components/flow/NodePropertiesPanel';
import { StartNode } from '@/components/flow/nodes/StartNode';
import { MessageNode } from '@/components/flow/nodes/MessageNode';
import { MediaNode } from '@/components/flow/nodes/MediaNode';
import { QuestionNode } from '@/components/flow/nodes/QuestionNode';
import { MenuNode } from '@/components/flow/nodes/MenuNode';
import { ConditionNode } from '@/components/flow/nodes/ConditionNode';
import { EndNode } from '@/components/flow/nodes/EndNode';
import { OperatorNode } from '@/components/flow/nodes/OperatorNode';
import { OperatorApprovalNode } from '@/components/flow/nodes/OperatorApprovalNode';
import { ButtonsNode } from '@/components/flow/nodes/ButtonsNode';
import { EventNode } from '@/components/flow/nodes/EventNode';
import { ReturnNode } from '@/components/flow/nodes/ReturnNode';
import { useToastStore } from '@/store/toastStore';
import type { FlowNode, FlowEdge, FlowNodeData, FlowVariableType, QuestionValidationType } from '@shared/flow';
import type { Connection, NodeTypes } from '@xyflow/react';

const nodeTypes: NodeTypes = {
  start: StartNode as never,
  message: MessageNode as never,
  media: MediaNode as never,
  question: QuestionNode as never,
  menu: MenuNode as never,
  buttons: ButtonsNode as never,
  condition: ConditionNode as never,
  end: EndNode as never,
  operator: OperatorNode as never,
  operator_approval: OperatorApprovalNode as never,
  event: EventNode as never,
  return: ReturnNode as never,
};

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  markerEnd: { type: MarkerType.ArrowClosed },
};

// Default data per node type
const DEFAULT_NODE_DATA: Record<string, FlowNodeData> = {
  start: { label: 'Inicio' },
  message: { message: '' },
  media: { source: 'approval_upload', caption: '', fallbackMessage: '' },
  question: { message: '', variable: '' as FlowVariableType, validation: 'text' as QuestionValidationType },
  menu: { title: '', options: [] },
  buttons: { title: '', options: [] },
  condition: { variable: '' as FlowVariableType, branches: [], defaultBranchId: `default-${Date.now()}` },
  end: { message: '' },
  operator: { message: 'Un operador te atenderá en breve.' },
  operator_approval: {
    message: 'Esperando aprobación...',
    branches: [
      { id: 'opt-accept', event: 'approved', label: 'Aprobado', status: 'accepted' },
      { id: 'opt-reject', event: 'rejected', label: 'Rechazado', status: 'rejected' },
      { id: 'opt-retry', event: 'needs_info', label: 'Corregir', status: 'pending' },
    ],
  },
  event: { eventType: 'max_fails', maxFails: 3 },
  return: { label: 'Regresar' },
};

function FlowCanvas() {
  const { addToast } = useToastStore();
  const { screenToFlowPosition } = useReactFlow();
  const {
    nodes, edges, setNodes, setEdges,
    onNodesChange, onEdgesChange,
    loading, saveStatus, saveError, validationErrors, setValidationErrors,
    saveFlow,
  } = useFlow();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>('pan');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Undo/Redo state
  const historyRef = useRef<{ nodes: FlowNode[]; edges: FlowEdge[] }[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const skipHistoryRef = useRef(false);

  // Save state to history
  const saveToHistory = useCallback((newNodes: FlowNode[], newEdges: FlowEdge[]) => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(newNodes)), edges: JSON.parse(JSON.stringify(newEdges)) });
    if (newHistory.length > 50) newHistory.shift();
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Initialize history on load
  useEffect(() => {
    if (!loading && nodes.length > 0 && historyRef.current.length === 0) {
      historyRef.current = [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [loading, nodes, edges]);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    skipHistoryRef.current = true;
    const state = historyRef.current[historyIndexRef.current];
    setNodes(state.nodes);
    setEdges(state.edges);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
  }, [setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    skipHistoryRef.current = true;
    const state = historyRef.current[historyIndexRef.current];
    setNodes(state.nodes);
    setEdges(state.edges);
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, [setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) as FlowNode | undefined;

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => {
        const newEdges = addEdge({ ...connection, ...defaultEdgeOptions }, eds) as FlowEdge[];
        saveToHistory(nodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, nodes, saveToHistory],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode: FlowNode = {
        id: `${type}-${Date.now()}`,
        type: type as FlowNode['type'],
        position,
        data: { ...(DEFAULT_NODE_DATA[type] ?? { message: '' }) },
      };
      setNodes(nds => {
        const newNodes = [...nds, newNode];
        saveToHistory(newNodes, edges);
        return newNodes;
      });
    },
    [screenToFlowPosition, setNodes, edges, saveToHistory],
  );

  const onNodesDelete = useCallback(
    (deleted: FlowNode[]) => {
      const hasStart = deleted.some(n => n.type === 'start');
      if (hasStart) {
        // Restore start node — prevent deletion
        const startNode = deleted.find(n => n.type === 'start');
        if (startNode) {
          setNodes(nds => [...nds, startNode]);
          addToast('El nodo de inicio no puede eliminarse.', 'error');
        }
      } else {
        // Save history after deletion
        setTimeout(() => {
          saveToHistory(nodes.filter(n => !deleted.find(d => d.id === n.id)), edges);
        }, 0);
      }
    },
    [setNodes, nodes, edges, saveToHistory],
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, __: FlowNode, draggedNodes: FlowNode[]) => {
      // Update nodes with new positions and save history
      const updatedNodes = nodes.map(n => {
        const dragged = draggedNodes.find(d => d.id === n.id);
        return dragged ? { ...n, position: dragged.position } : n;
      });
      saveToHistory(updatedNodes, edges);
    },
    [nodes, edges, saveToHistory],
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: FlowEdge[]) => {
      const newEdges = edges.filter(e => !deletedEdges.find(d => d.id === e.id));
      saveToHistory(nodes, newEdges);
    },
    [nodes, edges, saveToHistory],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleUpdateNode = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes(nds => {
        const newNodes = nds.map(n => (n.id === nodeId ? { ...n, data } : n)) as FlowNode[];
        saveToHistory(newNodes, edges);
        return newNodes;
      });
    },
    [setNodes, edges, saveToHistory],
  );

  const handleSave = useCallback(() => {
    setValidationErrors([]);
    saveFlow(nodes as FlowNode[], edges as FlowEdge[]);
  }, [nodes, edges, saveFlow, setValidationErrors]);

  const handleReset = useCallback(async () => {
    if (!confirm('¿Estás seguro de restablecer el flujo a la configuración por defecto? Se perderán los cambios no guardados.')) return;
    try {
      const res = await fetch('/api/flow/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Error al restablecer');
      const def = await res.json();
      setNodes(def.nodes);
      setEdges(def.edges);
      setValidationErrors([]);
    } catch (err) {
      console.error('[flow] Error restableciendo:', err);
      addToast('Error al restablecer el flujo', 'error');
    }
  }, [setNodes, setEdges, setValidationErrors]);

  if (loading) {
    return (
      <div className="page page--center">
        <Loader2 className="spin" size={32} />
      </div>
    );
  }

  return (
    <div className="flow-page">
      {/* Header */}
      <div className="page-header flow-page__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitBranch size={18} />
          <div>
            <h1 className="page-title">Flow</h1>
            <p className="page-subtitle">Editor visual del flujo conversacional del bot.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--ghost"
            onClick={handleReset}
            title="Restablecer configuración por defecto"
          >
            <RotateCcw size={14} /> Restablecer
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving'
              ? <><Loader2 size={14} className="spin" /> Guardando...</>
              : <><Save size={14} /> Guardar flujo</>}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {validationErrors.length > 0 && (
        <div className="alert alert--error">
          <AlertCircle size={14} />
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Canvas area */}
      <div className="flow-canvas-area" ref={reactFlowWrapper}>
        <NodePalette
          interactionMode={interactionMode}
          onToggleMode={() => setInteractionMode(m => m === 'pan' ? 'select' : 'pan')}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        <div className="flow-canvas" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete as never}
            onEdgesDelete={onEdgesDelete as never}
            onNodeClick={onNodeClick as never}
            onNodeDragStop={onNodeDragStop as never}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            defaultEdgeOptions={defaultEdgeOptions}
            selectionOnDrag={interactionMode === 'select'}
            panOnDrag={interactionMode === 'pan' ? [0, 1, 2] : [1, 2]}
            selectionMode="partial"
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodePropertiesPanel
            node={selectedNode}
            onUpdate={handleUpdateNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}

export default function Flow() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
