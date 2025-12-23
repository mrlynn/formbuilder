## System Patterns — MongoDB Aggregation Pipeline Builder

### High-level Architecture

- **Next.js 14+ (App Router)** in `src/app` as the main web application framework.
- **ReactFlow** for the visual graph editor and pipeline canvas.
- **Material UI (MUI) v5+** for UI components, layout, and theming (dark theme by default).
- **MongoDB Atlas** as the database, accessed via the official `mongodb` Node.js driver.
- **Serverless API routes** under `src/app/api` for pipeline execution and sample data access.
- **Shared utilities and types** under `src/lib`, `src/hooks`, and `src/types`.

### Core Modules and Responsibilities

- `app/page.tsx`
  - Top-level layout for the pipeline builder screen.
  - Composes left stage library, center ReactFlow canvas, right config panel, and bottom/right data preview.

- `components/PipelineCanvas/*`
  - ReactFlow wrapper for rendering nodes and edges.
  - `StageNode` component for individual aggregation stages.
  - `DataPreviewEdge` for edges with document flow hints/animations.

- `components/StageLibrary/*`
  - Palette of draggable aggregation stages grouped by category.
  - Stage metadata (name, description, icon, color) pulled from shared definitions.

- `components/StageConfigPanel/*`
  - Per-stage configuration forms (e.g. `$match`, `$group`, `$project`, `$lookup`).
  - Validation logic and mapping from form state → stage config object.

- `components/DataPreview/*`
  - JSON-based document viewer with collapsible trees and diff highlighting.

- `components/CodeExport/CodeExport.tsx`
  - Generates pipeline representations in different target languages and formats.

- `app/api/*`
  - `/api/run-pipeline` for executing the pipeline progressively.
  - `/api/sample-data` for retrieving sample documents.
  - `/api/collections` for listing available collections.

### Cross-cutting Patterns

- **State management**
  - React Context + `useReducer` for global pipeline state (`nodes`, `edges`, `selection`, `results`, etc.).
  - Custom hooks (`usePipelineState`, `usePipelineExecution`, `useFieldInference`) encapsulate business logic, keeping UI components “dumb”.

- **MongoDB access**
  - `src/lib/mongodb.ts` as a singleton client and `connectDB` helper to connect to MongoDB Atlas.
  - All API routes depend on this shared connection utility.

- **Serialization**
  - `src/lib/pipelineSerializer.ts` converts ReactFlow graph nodes/edges into a valid aggregation pipeline array (`PipelineStage[]`).
  - This serializer is used both for execution and for export.

- **Error handling**
  - Validation errors are surfaced in the stage config panel and via node styling.
  - Execution errors are mapped back to specific stages and highlighted in the canvas.


