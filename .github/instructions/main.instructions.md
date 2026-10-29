---
description: Read this whenever you need to understand the purpose and functionality of this library.
---

# Purpose

`entity-space` is a work-in-progress library for querying, hydrating, caching, and mutating entities through a schema-driven API. It separates the entity model and orchestration from the data-access implementation: applications provide callbacks that can use an HTTP API, a database, an in-memory store, or another source.

The library does not provide a database driver, network transport, or client/server wire protocol. Each integration is supplied by the application.

## Public entry points

- `workspace.from(blueprint)` builds a query.
- `workspace.for(blueprint)` hydrates existing entities.
- `workspace.in(blueprint)` builds a create, update, save, or delete mutation.
- `workspace.map(blueprint)` provides entity mapping helpers.

The core library is framework-agnostic. The repository also contains Angular and NestJS integration packages.

## How it works

1. Define and register blueprints. A blueprint describes one entity type, its properties and relations, and optional metadata. See [Blueprint](./blueprint.instructions.md).
2. Register sources, hydrators, and mutators against the relevant blueprint. These describe what each callback can do as well as performing the actual data access or transformation.
3. Build and execute queries with the workspace. A query may be fulfilled by one or more compatible sources. The library can hydrate missing selected data, then apply remaining criteria and remove results that still do not satisfy the requested selection.

Sources, hydrators, and mutators are registered through `EntityServiceContainer.for(blueprint)`. See [Sourcing](./sourcing.instructions.md), [Hydration](./hydration.instructions.md), and [Mutation](./mutation.instructions.md).

Sources are expected to return the selection passed to their callbacks. Runtime validation currently checks results against the entity schema, not completeness against that selection. Hydrators may fill missing query data as a fallback; after hydration, entities that are still missing the overall requested selection are excluded from query results. Do not rely on hydration to compensate for a source that fails to honor its requested selection.

Criteria can be partly handled by sources and partly evaluated by the library after loading. The capability declarations determine which parts can be sent to a source.

## Caching

Caching is opt-in. When enabled, the workspace can read cached entities, load uncovered query portions from sources, and write source results to cache. Cache keys, age limits, refresh behavior, and reactive reloads are configurable. Cache coverage may reduce or avoid source calls; hydration may still be needed to produce the requested selection.

Mutation caching is also opt-in and uses the configured cache key. The workspace exposes cache lifecycle methods; callers using temporary keys should destroy those caches when no longer needed.

## Current behavior and future direction

Automatic relation hydration currently applies to joined relations with join metadata and a related schema that can be queried through registered sources. Embedded relations are nested values, not relations loaded by this auto-join mechanism. Whether this is the final intended distinction is still an open design question; see [Hydration](./hydration.instructions.md).

The intended direction for `save()` is full entity-graph synchronization, including deletions. The exact contract for root removals and related-entity selection is not settled, and current behavior depends on registered mutators; see [Mutation](./mutation.instructions.md). Do not describe the intended behavior as fully implemented.

Using `entity-space` at both a client and API boundary, with the library facilitating communication between them, is a possible future setup only. This repository does not currently implement that communication or a shared protocol.
