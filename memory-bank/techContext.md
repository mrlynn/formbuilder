## Tech Context — MongoDB Aggregation Pipeline Builder

### Core Technologies

- **Framework**: Next.js 14+ using the App Router (`src/app`).
- **Language**: TypeScript for type safety and Next.js best practices.
- **UI**: Material UI (MUI) v5+ (`@mui/material`, `@mui/icons-material`) with dark-mode theme.
- **Graph**: ReactFlow (latest stable) for the aggregation pipeline canvas.
- **Database**: MongoDB Atlas cluster, connected via the official `mongodb` Node.js driver.
- **Styling**: MUI’s `sx` prop and styled components; Tailwind CSS is explicitly not used.

### Project Conventions

- Directory structure follows the PID:
  - `src/app` for routes and layout.
  - `src/components` for UI components grouped by feature.
  - `src/hooks` for custom hooks and state management.
  - `src/lib` for MongoDB helpers, stage definitions, and pipeline serialization.
  - `src/types` for shared TypeScript interfaces (e.g. pipeline types).
  - `src/theme` for MUI theme configuration.
- MongoDB connection details are configured via environment variables:
  - `MONGODB_URI`
  - `MONGODB_DATABASE`
  - `SAMPLE_COLLECTION`

### Dependencies (initial set)

- `next`, `react`, `react-dom`
- `typescript`, `@types/node`, `@types/react`, `@types/react-dom`
- `@mui/material`, `@mui/icons-material`
- `reactflow`
- `mongodb`

### Constraints

- Must avoid Mongoose and use the native MongoDB driver for accurate aggregation semantics.
- Must not use Tailwind CSS or Vite.
- Must prioritize a dark, MongoDB-themed UI consistent with the PID’s theme definition.


