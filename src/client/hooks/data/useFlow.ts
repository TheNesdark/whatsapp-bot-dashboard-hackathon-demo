import { useCallback, useEffect, useRef, useState } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { apiFetchOk } from '@/utils/api';
import type { FlowDefinition, FlowNode, FlowEdge } from '@shared/flow';
import type { NodeChange, EdgeChange } from '@xyflow/react';
import { useToastStore } from '@/store/toastStore';

export type FlowSaveStatus = 'idle' | 'saving' | 'success' | 'error';

export function useFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<FlowSaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isSavingRef = useRef(false);

  const fetchFlow = useCallback(async () => {
    setLoading(true);
    try {
      const def = await apiFetchOk<FlowDefinition>('/api/flow');
      if (!isMountedRef.current) return;
      setNodes(def.nodes as FlowNode[]);
      setEdges(def.edges as FlowEdge[]);
    } catch (err) {
      console.error('[useFlow] Error cargando flujo:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [setNodes, setEdges]);

  const saveFlow = useCallback(async (currentNodes: FlowNode[], currentEdges: FlowEdge[]) => {
    if (isSavingRef.current) return; // Prevenir race condition
    isSavingRef.current = true;

    setValidationErrors([]);
    setSaveError(null);
    setSaveStatus('saving');

    try {
      await apiFetchOk('/api/flow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: currentNodes, edges: currentEdges }),
      });

      if (!isMountedRef.current) return;
      setSaveStatus('success');
      useToastStore.getState().addToast('Flujo guardado correctamente', 'success');
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) setSaveStatus('idle');
      }, 3000);
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setSaveError(msg);
      setSaveStatus('error');
      useToastStore.getState().addToast('Error al guardar flujo: ' + msg, 'error');
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchFlow();
    return () => {
      isMountedRef.current = false;
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, [fetchFlow]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    loading,
    saveStatus,
    saveError,
    validationErrors,
    setValidationErrors,
    saveFlow,
    refetch: fetchFlow,
  };
}
