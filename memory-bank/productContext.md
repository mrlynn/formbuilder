## Product Context — MongoDB Aggregation Pipeline Builder

### Why this project exists

MongoDB aggregation pipelines are powerful but can be hard to learn and reason about, especially when pipelines grow complex. Developers often struggle to understand how data changes at each stage and to debug issues without strong tooling support.

This product provides an educational, visual way to build and understand aggregation pipelines, lowering the barrier to entry and improving productivity for both new and experienced MongoDB users.

### Problems it solves

- Lack of visual feedback when building aggregation pipelines.
- Difficulty in understanding per-stage transformations and document flow.
- Friction converting from “what I want” to valid MQL syntax.
- Trial-and-error development in shell/Compass without reusable visual artifacts.

### How it should work

- Users select a MongoDB collection (or a seeded sample collection).
- Users drag aggregation stages from a stage library onto a ReactFlow canvas.
- Stages are connected to form a pipeline, each represented as a node.
- Selecting a node opens a configuration panel where stage-specific options are edited using guided forms.
- Users run the pipeline to see:
  - Progressive results at each stage.
  - Document counts and execution times.
  - Per-stage data previews.
- Users can export the resulting pipeline as executable code in multiple formats.

### User experience goals

- Clear mental model of document flow through the pipeline.
- Immediate feedback on configuration changes via previews.
- Friendly validation and error messages, especially for new users.
- Dark-themed, modern UI that feels like a professional developer tool.
- Easy onboarding via sample data and common patterns.


