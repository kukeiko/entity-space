---
description: Read this whenever you need to understand mutators, which persist changes to entities.
---

# Mutation

Mutations persist entity changes through callbacks registered with `EntityServiceContainer.for(blueprint)`.

## Consumer API

### Current API

- `create(entityOrEntities)`
- `update(entityOrEntities, previous?)`
- `save(entityOrEntities, previous?)`
- `delete(entityOrEntities)`

Use `workspace.in(blueprint)` to build a mutation.

### Planned API

The planned workspace API removes `create()` and `update()`, leaving `save()` and `delete()` and adding `sync()`. A future `upsert()` workspace method is possible but is not part of the immediate plan.

## Mutators

### Current mutators

Register one-entity or batch callbacks with `addCreateOneMutator` / `addCreateMutator`, `addUpdateOneMutator` / `addUpdateMutator`, `addSaveOneMutator` / `addSaveMutator`, and `addDeleteOneMutator` / `addDeleteMutator`. For every mutator kind, `select` declares which related changes that mutator can handle. Callbacks receive the entity or entities, accepted selection, and an `EntityMutationContext`; they may return synchronous or asynchronous results.

The existing mutator kinds are expected to remain under the planned workspace API. There is no separate sync mutator in the current plan.

### Planned responsibilities

The planned mutator responsibilities are:

- `create`: create new entities and selected related entities.
- `update`: update existing entities and selected related entities.
- `delete`: delete existing entities and selected related entities.
- `save`: create and update current entities and selected related entities, and delete selected existing related inbound entities. It does not delete a root entity omitted from the current set.

Mutation selection limits which related entities are traversed, and each mutator's `select` declares which related changes that mutator can handle. A save mutator can persist the current aggregate state for the selected relations it accepts, including removals, without inspecting `previous` to discover missing children. An empty array represents clearing a selected relation, while an omitted/`undefined` relation is left unchanged. Related changes not handled by that save mutator may be accepted by other compatible mutators.

`sync()` is planned to compute changes across the selected entity graph and dispatch them through all applicable mutator kinds: create, update, save, and delete. Previous root entities omitted from the current set are dispatched as deletions. `previous` is the baseline for root deletion detection; without it, no omitted-root deletion can be inferred. No separate sync mutator is planned.

An `upsert` mutator may be added later if needed. The current idea is that it would create and update entities without deleting selected related inbound entities.

Mutations can produce work for multiple entity schemas. The execution layer orders accepted mutations by dependency so related Ids can be written before dependent operations.

## Current `save()` behavior

The current implementation supports the following workspace operations:

- `create(entityOrEntities)`
- `update(entityOrEntities, previous?)`
- `save(entityOrEntities, previous?)`
- `delete(entityOrEntities)`

Currently, `save()` classifies current entities as creates or updates. When `previous` is supplied, it is the baseline for detecting removed entities: a previous root omitted from the current set is a root deletion. Without `previous`, the library does not infer root deletions.

Save mutators accept root creates and updates, not root deletes. A root deletion is sent to a registered delete mutator because there is no current root entity for a save callback to persist. If no suitable delete mutator is registered, the overall mutation is not fully accepted and fails.

Mutation selection controls which related entity changes are included. Without selecting a relation, changes within that relation are not traversed for mutation. For selected relations, save mutators can handle related create/update changes and inbound related deletions as part of the aggregate save.

The delete executor currently does not remove successfully deleted entities from the original previous-entity list; this cleanup was lost in the mutation refactor and remains a TODO. This limitation is distinct from detecting and dispatching root deletions.

## Planned `save()` and `sync()` behavior

The planned `save(current, previous?)` will persist the current entities and selected aggregate relation state but will not interpret a previous root omitted from `current` as a deletion. This supports passing only changed current entities alongside a broader previous baseline without accidentally deleting the unchanged roots omitted from `current`.

The planned `sync(current, previous)` will behave like `save()` and additionally delete previous root entities that are absent from `current`. Since an omitted root has no current entity to pass to a save mutator, its deletion will be handled by a delete mutator. `sync()` will use all applicable existing mutators for the detected changes; a separate sync mutator is not planned.

The distinction between current behavior and plan is intentional: current `save(current, previous)` does detect and dispatch omitted-root deletions, while the planned API reserves that behavior for `sync()`.

## Reliability notes

The workspace dispatches accepted callbacks in dependency order, but it does not itself provide an all-or-nothing transaction or rollback guarantee. Partial persistence can occur if a later callback fails. Deletion cleanup still has an implementation TODO; check the relevant tests before relying on edge-case behavior.
