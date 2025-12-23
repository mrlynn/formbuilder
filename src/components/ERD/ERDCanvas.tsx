'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  BackgroundVariant,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Paper, Typography, alpha, CircularProgress } from '@mui/material';
import { CollectionNode } from './CollectionNode';

// Define nodeTypes outside component and memoize
const nodeTypes: NodeTypes = {
  collection: CollectionNode
};

interface CollectionInfo {
  name: string;
  fields: string[];
  count: number;
}

interface ERDCanvasProps {
  collections: CollectionInfo[];
  isLoading?: boolean;
}

function ERDCanvasInner({ collections, isLoading }: ERDCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Memoize nodeTypes to prevent ReactFlow warning
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  // Generate nodes and edges from collections
  useMemo(() => {
    if (collections.length === 0) return;

    const newNodes: Node[] = collections.map((coll, index) => {
      const cols = Math.ceil(Math.sqrt(collections.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      return {
        id: `collection-${coll.name}`,
        type: 'collection',
        position: { x: col * 350, y: row * 300 },
        data: {
          name: coll.name,
          fields: coll.fields,
          count: coll.count
        }
      };
    });

    setNodes(newNodes);
    setEdges([]);
  }, [collections, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (collections.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          bgcolor: 'background.default'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Connect to a database to view the ERD
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={memoizedNodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'collection') return '#00ED64';
            return '#666';
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>
    </Box>
  );
}

export function ERDCanvas({ collections, isLoading }: ERDCanvasProps) {
  return (
    <ReactFlowProvider>
      <ERDCanvasInner collections={collections} isLoading={isLoading} />
    </ReactFlowProvider>
  );
}

