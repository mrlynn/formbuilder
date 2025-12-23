import { Edge } from 'reactflow';
import { StageNode, StageNodeData, PipelineState } from '@/types/pipeline';

export interface SerializedStage {
  [stageOperator: string]: any;
}

function orderNodes(nodes: StageNode[], edges: Edge[]): StageNode[] {
  if (nodes.length === 0) return [];

  const incomingCounts: Record<string, number> = {};
  nodes.forEach((n) => {
    incomingCounts[n.id] = 0;
  });

  edges.forEach((e) => {
    if (incomingCounts[e.target] !== undefined) {
      incomingCounts[e.target] += 1;
    }
  });

  const startNodes = nodes.filter((n) => incomingCounts[n.id] === 0);

  if (startNodes.length === 0) {
    return [...nodes].sort((a, b) => a.position.x - b.position.x);
  }

  const visited = new Set<string>();
  const ordered: StageNode[] = [];

  const adjacency: Record<string, string[]> = {};
  edges.forEach((e) => {
    if (!adjacency[e.source]) adjacency[e.source] = [];
    adjacency[e.source].push(e.target);
  });

  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      ordered.push(node);
      const neighbors = adjacency[nodeId] || [];
      neighbors.forEach((nextId) => dfs(nextId));
    }
  }

  startNodes
    .sort((a, b) => a.position.x - b.position.x)
    .forEach((n) => dfs(n.id));

  nodes.forEach((n) => {
    if (!visited.has(n.id)) ordered.push(n);
  });

  return ordered;
}

function configToStageArg(stageType: string, config: Record<string, any>): any {
  switch (stageType) {
    case '$count':
      return config.count || 'count';
    case '$limit':
      return typeof config.limit === 'number' ? config.limit : Number(config.limit || 0);
    case '$skip':
      return typeof config.skip === 'number' ? config.skip : Number(config.skip || 0);
    case '$unwind': {
      const unwindConfig: Record<string, any> = { ...config };
      if (unwindConfig.path && !String(unwindConfig.path).startsWith('$')) {
        unwindConfig.path = `$${unwindConfig.path}`;
      }
      return unwindConfig;
    }
    case '$project': {
      // MongoDB requires at least one field in $project
      const projectConfig = { ...config };
      if (Object.keys(projectConfig).length === 0) {
        projectConfig._id = 1; // Default to include _id
      }
      return projectConfig;
    }
    default:
      return config;
  }
}

export function serializePipeline(nodes: StageNode[], edges: Edge[]): SerializedStage[] {
  const orderedNodes = orderNodes(nodes, edges);

  return orderedNodes.map((node) => {
    const { stageType, config } = node.data as StageNodeData;
    const arg = configToStageArg(stageType, config || {});
    return { [stageType]: arg } as SerializedStage;
  });
}

export function serializeFromState(state: PipelineState): SerializedStage[] {
  return serializePipeline(state.nodes, state.edges);
}

