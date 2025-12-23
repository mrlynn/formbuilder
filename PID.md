# MongoDB Aggregation Pipeline Builder — Engineering Specification

## Project Overview

Build a visual, drag-and-drop MongoDB Aggregation Pipeline Builder using ReactFlow. This educational tool allows users to construct aggregation pipelines by connecting stage nodes, see live data transformations at each step, and export working pipeline code.

**Primary Goal:** Make MongoDB aggregation pipelines intuitive by visualizing data flow through each stage.

---

## Technical Stack (MANDATORY)

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | **Next.js 14+** (App Router) | Use `create-next-app` with TypeScript |
| Visual Graph | **ReactFlow** | Latest stable version |
| UI Components | **Material UI (MUI) v5+** | Use `@mui/material`, `@mui/icons-material` |
| Database | **MongoDB Atlas** | Use official `mongodb` driver |
| State Management | React Context + `useReducer` | Or Zustand if complexity warrants |
| Styling | **MUI's `sx` prop and styled components** | Do NOT use Tailwind CSS |

### ⛔ Explicitly Avoid
- **Do NOT use Tailwind CSS** — use MUI's styling system exclusively
- **Do NOT use Vite** — use Next.js built-in bundling
- Do not use Mongoose (use native MongoDB driver for aggregation accuracy)

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx              # MUI ThemeProvider, CssBaseline
│   ├── page.tsx                # Main pipeline builder page
│   └── api/
│       ├── run-pipeline/
│       │   └── route.ts        # Execute pipeline against MongoDB
│       ├── sample-data/
│       │   └── route.ts        # Fetch sample documents
│       └── collections/
│           └── route.ts        # List available collections
├── components/
│   ├── PipelineCanvas/
│   │   ├── PipelineCanvas.tsx  # ReactFlow wrapper
│   │   ├── StageNode.tsx       # Custom node component
│   │   ├── DataPreviewEdge.tsx # Custom edge with data preview
│   │   └── nodeTypes.ts        # Node type registry
│   ├── StageLibrary/
│   │   ├── StageLibrary.tsx    # Draggable stage palette
│   │   └── StageCard.tsx       # Individual stage in palette
│   ├── StageConfigPanel/
│   │   ├── StageConfigPanel.tsx    # Right panel for editing stage
│   │   ├── MatchConfig.tsx         # $match stage form
│   │   ├── GroupConfig.tsx         # $group stage form
│   │   ├── ProjectConfig.tsx       # $project stage form
│   │   ├── LookupConfig.tsx        # $lookup stage form
│   │   ├── SortConfig.tsx          # $sort stage form
│   │   ├── UnwindConfig.tsx        # $unwind stage form
│   │   ├── LimitSkipConfig.tsx     # $limit/$skip stage form
│   │   └── AddFieldsConfig.tsx     # $addFields stage form
│   ├── DataPreview/
│   │   ├── DataPreview.tsx         # Document viewer
│   │   └── DocumentCard.tsx        # Single document display
│   ├── CodeExport/
│   │   └── CodeExport.tsx          # Export pipeline as code
│   └── common/
│       ├── JsonEditor.tsx          # Syntax-highlighted JSON input
│       └── FieldSelector.tsx       # Autocomplete for field names
├── hooks/
│   ├── usePipelineState.ts         # Pipeline state management
│   ├── usePipelineExecution.ts     # Run pipeline, manage results
│   └── useFieldInference.ts        # Infer fields from sample docs
├── lib/
│   ├── mongodb.ts                  # MongoDB client singleton
│   ├── stageDefinitions.ts         # Stage metadata & defaults
│   └── pipelineSerializer.ts       # Convert nodes → MQL
├── types/
│   └── pipeline.ts                 # TypeScript interfaces
└── theme/
    └── theme.ts                    # MUI theme customization
```

---

## Core Features

### 1. Stage Library (Left Panel)

A draggable palette of available aggregation stages. When dragged onto the canvas, a new node is created.

**Required Stages (MVP):**
| Stage | Icon Suggestion | Color Code |
|-------|-----------------|------------|
| `$match` | FilterList | Blue |
| `$group` | GroupWork | Purple |
| `$project` | ViewColumn | Green |
| `$sort` | Sort | Orange |
| `$limit` | Compress | Gray |
| `$skip` | SkipNext | Gray |
| `$unwind` | UnfoldMore | Teal |
| `$lookup` | Link | Indigo |
| `$addFields` | Add | Lime |
| `$count` | Tag | Pink |

**Implementation Notes:**
- Use MUI `Card` components with `draggable` attribute
- Integrate with ReactFlow's drag-and-drop: use `onDragStart` to set transfer data
- Group stages by category (Filter, Transform, Join, Shape)

```tsx
// Example drag handler
const onDragStart = (event: DragEvent, stageType: string) => {
  event.dataTransfer.setData('application/reactflow', stageType);
  event.dataTransfer.effectAllowed = 'move';
};
```

### 2. Pipeline Canvas (Center)

The ReactFlow canvas where users build their pipeline.

**Node Behavior:**
- Single input handle (left) — receives documents from previous stage
- Single output handle (right) — passes documents to next stage
- First node (source) connects to a "Collection" node or has no input
- Nodes display: stage type, brief config summary, document count after execution

**Visual Requirements:**
- Use MUI Paper as the node container
- Show stage icon + name in node header
- Show truncated config (e.g., `{ status: "active" }`) in node body
- Show document count badge after pipeline runs
- Highlight nodes with errors in red (`theme.palette.error`)

**Custom Node Component Structure:**
```tsx
interface StageNodeData {
  stageType: string;           // '$match', '$group', etc.
  config: Record<string, any>; // Stage-specific configuration
  outputDocs?: Document[];     // Results after this stage
  error?: string;              // Validation or execution error
  isExecuting?: boolean;       // Loading state
}
```

**Edge Behavior:**
- Edges represent document flow
- On hover, show a tooltip with document count
- Animate edges during pipeline execution (use ReactFlow's `animated` prop)

### 3. Stage Configuration Panel (Right Panel)

When a node is selected, display a configuration form specific to that stage type.

**Form Requirements by Stage:**

**$match:**
- Field selector (autocomplete from inferred schema)
- Operator dropdown ($eq, $gt, $lt, $gte, $lte, $in, $regex, $exists, etc.)
- Value input (type-aware: string, number, boolean, date, array)
- Add multiple conditions (AND logic by default)
- Toggle for $or grouping

**$group:**
- `_id` field builder (select field, or expression, or null for full collection)
- Accumulator list:
  - Field name input
  - Operator dropdown ($sum, $avg, $min, $max, $first, $last, $push, $addToSet, $count)
  - Expression input (field path like `"$price"` or literal)

**$project:**
- List of fields with include (1) / exclude (0) toggle
- Computed field expressions
- Nested field support

**$lookup:**
- `from` collection selector (dropdown of available collections)
- `localField` selector
- `foreignField` selector
- `as` field name input
- Pipeline sub-builder (stretch goal: recursive ReactFlow canvas)

**$sort:**
- Field selector + direction (1 ascending, -1 descending)
- Multi-field sort support (drag to reorder)

**$unwind:**
- Path input (field to unwind)
- `preserveNullAndEmptyArrays` checkbox
- `includeArrayIndex` field name input

**$limit / $skip:**
- Simple number input with validation

**$addFields:**
- Field name + expression pairs
- Support for nested paths

**UI Pattern:**
- Use MUI `Drawer` anchored right, persistent when node selected
- Use MUI `TextField`, `Autocomplete`, `Select`, `Switch` for inputs
- Validate on change, show inline errors with `FormHelperText`
- "Apply" button updates node data (or auto-save with debounce)

### 4. Data Preview

Show documents at each stage of the pipeline.

**Behaviors:**
- Click a node to see its output documents
- Show input vs output toggle for comparison
- Display documents as collapsible JSON with syntax highlighting
- Limit preview to 10-20 documents with "Load more" option
- Highlight fields that were added/modified in green, removed in red

**Implementation:**
- Use MUI `Accordion` for each document
- Use a JSON syntax highlighter (consider `react-json-view` or custom with Prism.js)
- Diff highlighting between input and output docs

### 5. Pipeline Execution

**Run Button:**
- Execute the full pipeline against selected collection
- Progressive execution: show results at each stage as they complete
- Display execution time per stage
- Handle and display errors gracefully (highlight the failing node)

**API Route (`/api/run-pipeline`):**
```typescript
// Request body
interface RunPipelineRequest {
  collection: string;
  pipeline: PipelineStage[];
  sampleSize?: number;        // Limit input docs for preview
}

// Response
interface RunPipelineResponse {
  stages: {
    stageIndex: number;
    outputDocs: Document[];
    docCount: number;
    executionTimeMs: number;
  }[];
  totalExecutionTimeMs: number;
  error?: {
    stageIndex: number;
    message: string;
  };
}
```

**Execution Strategy:**
To show intermediate results, execute pipeline incrementally:
```javascript
// Pseudo-code for server-side
const results = [];
for (let i = 0; i < pipeline.length; i++) {
  const partialPipeline = pipeline.slice(0, i + 1);
  const docs = await collection.aggregate(partialPipeline).limit(20).toArray();
  results.push({ stageIndex: i, outputDocs: docs });
}
```

### 6. Code Export

Generate copy-paste-ready code from the visual pipeline.

**Export Formats:**
1. **Raw MQL** (JSON array of stages)
2. **Node.js Driver** (JavaScript with `collection.aggregate([...])`)
3. **mongosh** (Shell-compatible syntax)
4. **Python (PyMongo)** (Python list of dicts)

**UI:**
- MUI `Dialog` with `Tabs` for each format
- Syntax-highlighted code block
- Copy button with success feedback
- Download as file option

---

## Sample Data Strategy

Include a seeded sample collection for first-time users to explore without connecting their own database.

**Recommended: E-commerce Orders Dataset**
```javascript
{
  _id: ObjectId,
  orderNumber: "ORD-10042",
  customer: {
    name: "Jane Smith",
    email: "jane@example.com",
    tier: "gold"
  },
  items: [
    { sku: "WIDGET-01", name: "Blue Widget", quantity: 2, price: 29.99 },
    { sku: "GADGET-05", name: "Smart Gadget", quantity: 1, price: 149.99 }
  ],
  status: "shipped",
  orderDate: ISODate("2024-03-15T10:30:00Z"),
  shippingAddress: {
    city: "Austin",
    state: "TX",
    country: "USA"
  },
  totalAmount: 209.97,
  tags: ["electronics", "priority"]
}
```

This dataset allows demonstrating:
- `$match` on status, date ranges, nested fields
- `$group` by customer tier, city, status
- `$unwind` on items array
- `$lookup` to a "products" or "customers" collection
- `$project` for reshaping
- `$sort` and `$limit` for top-N queries

**Seed Script:** Create `/scripts/seed-sample-data.ts` that populates 500+ orders.

---

## State Management

Use React Context with `useReducer` for pipeline state.

```typescript
interface PipelineState {
  nodes: Node<StageNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  collection: string | null;
  sampleDocs: Document[];
  isExecuting: boolean;
  executionResults: Map<string, Document[]>;
  schema: InferredSchema | null;
}

type PipelineAction =
  | { type: 'ADD_NODE'; payload: { stageType: string; position: XYPosition } }
  | { type: 'UPDATE_NODE_CONFIG'; payload: { nodeId: string; config: any } }
  | { type: 'DELETE_NODE'; payload: { nodeId: string } }
  | { type: 'CONNECT_NODES'; payload: { source: string; target: string } }
  | { type: 'SELECT_NODE'; payload: { nodeId: string | null } }
  | { type: 'SET_EXECUTION_RESULTS'; payload: { results: Map<string, Document[]> } }
  | { type: 'SET_COLLECTION'; payload: { collection: string } }
  // ... etc
```

---

## MUI Theme Configuration

Create a custom theme that complements the visual pipeline aesthetic.

```typescript
// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',  // Pipeline builders look great in dark mode
    primary: {
      main: '#00ED64',  // MongoDB green
    },
    secondary: {
      main: '#00684A',  // MongoDB dark green
    },
    background: {
      default: '#0d1117',
      paper: '#161b22',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
    code: {
      fontFamily: '"Fira Code", "Monaco", monospace',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',  // Remove default gradient
        },
      },
    },
  },
});
```

---

## ReactFlow Configuration

```tsx
// Key ReactFlow setup
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Register custom node types
const nodeTypes: NodeTypes = {
  stageNode: StageNode,
  collectionNode: CollectionNode,  // Source node
};

// Canvas component
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  onDrop={onDrop}
  onDragOver={onDragOver}
  nodeTypes={nodeTypes}
  fitView
  snapToGrid
  snapGrid={[16, 16]}
>
  <Background color="#30363d" gap={16} />
  <Controls />
  <MiniMap nodeColor={getNodeColor} />
</ReactFlow>
```

---

## Error Handling

**Validation Errors:**
- Validate stage configs before execution
- Show inline errors in config panel
- Highlight invalid nodes with red border

**Execution Errors:**
- Catch MongoDB errors and map to user-friendly messages
- Highlight the specific stage that failed
- Show error details in a snackbar or node tooltip

**Common Errors to Handle:**
- Invalid field paths
- Type mismatches in expressions
- Invalid $lookup target collection
- Syntax errors in raw JSON mode

---

## Stretch Goals (Post-MVP)

1. **Save/Load Pipelines** — Persist pipelines to localStorage or MongoDB
2. **Share via URL** — Encode pipeline in URL params
3. **Explain Plan Overlay** — Show index usage on nodes
4. **Pipeline Templates** — Pre-built common pipelines (top N, group by date, etc.)
5. **Collaboration** — Real-time multiplayer editing (like Figma)
6. **$lookup Sub-pipelines** — Nested ReactFlow canvas for pipeline-style lookups
7. **Animation Mode** — Watch documents flow through the pipeline one by one
8. **Natural Language Input** — "Group orders by status and count them" → generates stages
9. **Dark/Light Mode Toggle**
10. **Export to MongoDB Compass** — Generate Compass-compatible JSON

---

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Next.js project setup with MUI theme
- [ ] ReactFlow canvas with basic node rendering
- [ ] Stage library with drag-and-drop
- [ ] Basic node connection logic

### Phase 2: Stage Configuration (Week 2)
- [ ] Configuration panel scaffold
- [ ] Implement $match, $project, $sort, $limit configs
- [ ] Field autocomplete from sample documents
- [ ] Node data updates on config change

### Phase 3: Execution Engine (Week 3)
- [ ] MongoDB connection setup
- [ ] `/api/run-pipeline` route
- [ ] Progressive stage execution
- [ ] Results display per node

### Phase 4: Advanced Stages (Week 4)
- [ ] Implement $group, $unwind, $lookup, $addFields configs
- [ ] Accumulator builders for $group
- [ ] Data preview with diff highlighting

### Phase 5: Polish (Week 5)
- [ ] Code export dialog
- [ ] Error handling and validation
- [ ] Sample data seeding
- [ ] Responsive layout adjustments
- [ ] Documentation and onboarding tips

---

## Environment Variables

```env
# .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pipeline-builder
MONGODB_DATABASE=pipeline_builder
SAMPLE_COLLECTION=sample_orders
```

---

## Testing Considerations

- Unit test pipeline serialization (nodes → MQL)
- Unit test stage config validation
- Integration test API routes with test MongoDB
- E2E test drag-drop and connection flows (Playwright or Cypress)

---

## References

- [ReactFlow Documentation](https://reactflow.dev/docs/introduction/)
- [MongoDB Aggregation Pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)
- [MUI Component Library](https://mui.com/material-ui/getting-started/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## Final Notes for Engineers

1. **Start with a working ReactFlow canvas** before adding MongoDB integration
2. **Use the sample dataset** — don't require DB connection for initial testing
3. **Prioritize the happy path** — get $match → $group → $sort working end-to-end first
4. **Keep nodes dumb** — all logic in hooks and utils, nodes just render data
5. **Serialize early, serialize often** — always be able to export valid MQL from current state

Good luck! Build something MongoDB developers will love. 🍃
