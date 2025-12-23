## Project Brief — MongoDB Aggregation Pipeline Builder

### Overview

Build a visual, drag-and-drop MongoDB Aggregation Pipeline Builder using ReactFlow. The tool helps users construct aggregation pipelines by connecting stage nodes, see live data transformations at each step, and export working pipeline code.

**Primary goal:** Make MongoDB aggregation pipelines intuitive by visualizing data flow through each stage.

### Scope

- Visual pipeline builder for MongoDB aggregation using a ReactFlow canvas.
- Stage library with draggable aggregation stages (e.g. `$match`, `$group`, `$project`, `$sort`, `$limit`, `$skip`, `$unwind`, `$lookup`, `$addFields`, `$count`).
- Right-hand configuration panel for editing stage-specific options.
- Data preview per stage to show how documents evolve through the pipeline.
- Execution engine that runs pipelines against MongoDB Atlas with progressive, per-stage results.
- Code export to multiple formats (raw MQL, Node.js, mongosh, Python/PyMongo).

### Out of Scope (for MVP)

- Real-time collaboration.
- Advanced explain plan visualizations.
- URL-based sharing and full template libraries (these are stretch goals).


