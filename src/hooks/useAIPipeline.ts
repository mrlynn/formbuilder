'use client';

import { useCallback } from 'react';
import { Node, XYPosition } from 'reactflow';
import { usePipeline } from '@/contexts/PipelineContext';
import { SerializedStage } from '@/lib/pipelineSerializer';
import { getStageDefinition } from '@/lib/stageDefinitions';
import { StageNodeData } from '@/types/pipeline';

export function useAIPipeline() {
  const { dispatch, nodes, edges } = usePipeline();

  const applyAIGeneratedPipeline = useCallback(
    (stages: SerializedStage[], startPosition?: XYPosition) => {
      // Clear existing nodes if starting fresh, or append if extending
      const shouldClear = nodes.length === 0;
      
      // Convert serialized stages to ReactFlow nodes
      const newNodes: Node<StageNodeData>[] = [];
      const baseX = startPosition?.x || 250;
      const baseY = startPosition?.y || 200;
      const nodeSpacing = 250; // Vertical spacing for better layout

      stages.forEach((stage, index) => {
        const stageType = Object.keys(stage)[0];
        const config = stage[stageType];
        const definition = getStageDefinition(stageType);

        if (!definition) {
          console.warn(`Unknown stage type: ${stageType}`);
          return;
        }

        const node: Node<StageNodeData> = {
          id: `${stageType}-ai-${Date.now()}-${index}`,
          type: 'stageNode',
          position: {
            x: baseX,
            y: baseY + (index * nodeSpacing) // Vertical layout
          },
          data: {
            stageType,
            config: config || definition.defaultConfig
          }
        };

        newNodes.push(node);
      });

      // Batch add all nodes at once
      if (shouldClear) {
        // Clear and set new nodes/edges in one go
        const newEdges = newNodes.length > 1
          ? newNodes.slice(0, -1).map((node, i) => ({
              id: `edge-${node.id}-${newNodes[i + 1].id}`,
              source: node.id,
              target: newNodes[i + 1].id,
              animated: false
            }))
          : [];

        dispatch({ type: 'SET_NODES', payload: { nodes: newNodes } });
        dispatch({ type: 'SET_EDGES', payload: { edges: newEdges } });
      } else {
        // Append to existing pipeline
        const allNodes = [...nodes, ...newNodes];
        const newEdges = newNodes.length > 1
          ? newNodes.slice(0, -1).map((node, i) => ({
              id: `edge-${node.id}-${newNodes[i + 1].id}`,
              source: node.id,
              target: newNodes[i + 1].id,
              animated: false
            }))
          : [];

        dispatch({ type: 'SET_NODES', payload: { nodes: allNodes } });
        dispatch({
          type: 'SET_EDGES',
          payload: {
            edges: [...edges, ...newEdges]
          }
        });
      }

      return newNodes;
    },
    [dispatch, nodes, edges]
  );

  return { applyAIGeneratedPipeline };
}

