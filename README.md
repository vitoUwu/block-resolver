# Block Resolver

This project is a study case runtime inspired by [Deco.cx](https://github.com/deco-cx/deco), designed to interpret and resolve "blocks" — modular functions that power your application. It serves as a study case to understand how a block-based architecture, like the one used in Deco.cx CMS for building storefronts, works under the hood.

## Features

- **Block-Based Architecture**: Modular design where functionality is encapsulated in blocks.
- **Automatic Manifest Generation**: Scans your project for blocks and generates a manifest file (`manifest.gen.ts`). Note: Currently, this manifest generation is primarily a challenge in programmatically building TypeScript files and isn't strictly used for runtime resolution in this version.
- **Loader Support**: currently supports `loaders` for data fetching with built-in caching strategies.
- **Smart Caching**: `stale-while-revalidate` caching strategy implementation for high-performance data loading.
- **Universal Invocation**: Built-in HTTP handler to invoke any block via API.

## Project Structure

- **`blocks/`**: Core definitions of block types (e.g., `LoaderBlock`).
- **`resolver/`**: Logic to instantiate and manage blocks at runtime.
- **`manifest/`**: Tools to generate the registry of available blocks.
- **`routes/`**: API routes, including the universal `/invoke/*` handler.
- **`utils/`**: Helper functions.

## How it Works

### 1. Creating a Block (Loader)
Create a file in your project (e.g., `loaders/myLoader.ts`). A loader is a simple function that returns data.

```typescript
export interface Props {
  id: string;
}

export default function myLoader(props: Props, req: Request, ctx: any) {
  return {
    data: `Hello user ${props.id}`,
    timestamp: Date.now()
  };
}

// Optional: Configure caching
export const cache = {
  type: "stale-while-revalidate",
  ttl: 60 * 1000, // 1 minute
  key: (props) => props.id, // Cache key based on props
};
```

### 2. Resolution & Manifest
When the runtime starts, `BlockResolver.init()` builds a manifest, mapping block IDs to their implementations.

### 3. Invoking a Block
You can execute any resolved block via the `/invoke` endpoint.

**GET Request:**
```
GET /invoke/loaders/myLoader?id=123
```

**POST Request:**
```
POST /invoke/loaders/myLoader
Content-Type: application/json

{
  "id": "123"
}
```

## Core Concepts

### Loaders
Loaders are blocks responsible for fetching data. They are designed to be pure, idempotent, and cacheable. The runtime handles the caching logic automatically based on the exported `cache` configuration.

### Invocation Handler
The `routes/invoke.ts` file provides a unified entry point to execute blocks. It handles:
- Parsing request props (from URL params or JSON body).
- Resolving the requested block by ID.
- Executing the block with the provided context.
- Returning the response (JSON or raw).

---

*Note: This is a simplified educational implementation and is not intended for production use equivalent to the full Deco.cx runtime.*
