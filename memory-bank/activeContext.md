## Active Context — MongoDB Aggregation Pipeline Builder

### Current Focus

Initial implementation of the project foundation based on `PID.md`:

- Scaffold a Next.js 14 App Router project structure under `src/app`.
- Configure a dark MUI theme aligned with MongoDB branding.
- Add a basic page layout that reserves regions for:
  - Stage library (left),
  - Pipeline canvas (center),
  - Stage configuration panel and/or data preview (right/bottom).
- Introduce a minimal ReactFlow canvas integrated into the main page.
- Prepare `lib/mongodb.ts` with a MongoDB Atlas connection helper for future API routes.

### Recent Changes

- Created Memory Bank files (`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`) based on the engineering spec in `PID.md`.

### Next Steps

- Add project configuration files (`package.json`, `tsconfig.json`, `next.config`).
- Implement `src/app/layout.tsx` with the MUI theme provider and `CssBaseline`.
- Implement `src/theme/theme.ts` per the PID.
- Implement a minimal `PipelineCanvas` component using ReactFlow and render it on the main page.
- Add a placeholder for the stage library and configuration panel.

### Open Questions

- Exact layout of data preview vs. config panel (side-by-side or tabbed).
- How to manage persistence of pipelines beyond in-memory state (MongoDB vs. localStorage) for stretch goals.


