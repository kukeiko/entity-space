---
description: Read this whenever you need to understand mutators, which persist changes to entities.
---

# Mutation

Mutations persist entity changes through callbacks registered with `EntityServiceContainer.for(blueprint)`.

## Consumer API

### Workspace API

- `save(entityOrEntities, previous?)`
- `sync(entities, previous)`
- `delete(entityOrEntities)`

Use `workspace.in(blueprint)` to build a mutation.

## Mutators

Register one-entity or batch callbacks with `addCreateOneMutator` / `addCreateMutator`, `addUpdateOneMutator` / `addUpdateMutator`, `addSaveOneMutator` / `addSaveMutator`, and `addDeleteOneMutator` / `addDeleteMutator`. For every mutator kind, `select` declares which related changes that mutator can handle. Callbacks receive the entity or entities, accepted selection, and an `EntityMutationContext`; they may return synchronous or asynchronous results.

The mutator kinds handle these effective entity changes:

- `create`: create new entities and selected related entities.
- `update`: update existing entities and selected related entities.
- `delete`: delete existing entities and selected related entities.
- `save`: create and update current entities and selected related entities, and delete selected existing related inbound entities.

Mutation selection limits which related entities are traversed, and each mutator's `select` declares which related changes that mutator can handle. A save mutator can persist the current aggregate state for the selected relations it accepts, including removals, without inspecting `previous` to discover missing children. An empty array represents clearing a selected relation, while an omitted/`undefined` relation is left unchanged. Related changes not handled by that save mutator may be accepted by other compatible mutators.

`sync()` uses the same create/update and selected related-change handling as `save()`, and also dispatches previous root entities omitted from the current set as deletions. It uses the existing mutator kinds; there is no separate sync mutator. `previous` is required as the baseline for root deletion detection.

An `upsert` mutator and workspace method are possible future additions, not part of the current API.

Mutations can produce work for multiple entity schemas. The execution layer orders accepted mutations by dependency so related Ids can be written before dependent operations.

Mutation selection controls which related entity changes are included. Without selecting a relation, changes within that relation are not traversed for mutation. For selected relations, save mutators can handle related create/update changes and inbound related deletions as part of the aggregate save.

## Save, sync, and delete behavior

`save()` classifies current entities as creates or updates. If `previous` is supplied, it is used to detect selected related changes, including supported inbound related deletions, but it does not detect or dispatch root deletions. This allows callers to save only changed current entities against a broader previous baseline without deleting the omitted roots.

`sync()` additionally compares the current root entities with `previous`; previous roots omitted from the current set are sent to a registered delete mutator. If no suitable delete mutator is registered, the overall mutation is not fully accepted and fails. `sync()` accepts arrays of current and previous entities.

`delete()` dispatches the supplied entities as root deletions. It also traverses selected relations and dispatches supported inbound joined related entities as deletions. Related changes are limited to selected relations and the registered mutators' capabilities.

The delete executor currently does not remove successfully deleted entities from the original previous-entity list; this cleanup was lost in the mutation refactor and remains a TODO. This limitation is distinct from detecting and dispatching root deletions.

## Reliability notes

The workspace dispatches accepted callbacks in dependency order, but it does not itself provide an all-or-nothing transaction or rollback guarantee. Partial persistence can occur if a later callback fails. Deletion cleanup still has an implementation TODO; check the relevant tests before relying on edge-case behavior.
