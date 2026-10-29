---
description: Read this whenever you need to understand mutators, which persist changes to entities.
---

# Mutation

Mutations persist entity changes through callbacks registered with `EntityServiceContainer.for(blueprint)`.

## Consumer API

Use `workspace.in(blueprint)` to build a mutation. The builder supports:

- `create(entityOrEntities)`
- `update(entityOrEntities, previous?)`
- `save(entityOrEntities, previous?)`
- `delete(entityOrEntities)`

Mutation selection controls which related entity changes are included. Without selecting a relation, changes within that relation are not traversed for mutation.

## Mutators

Register one-entity or batch callbacks with `addCreateOneMutator` / `addCreateMutator`, `addUpdateOneMutator` / `addUpdateMutator`, `addSaveOneMutator` / `addSaveMutator`, and `addDeleteOneMutator` / `addDeleteMutator`. Each declaration's `select` describes the relations the mutator can handle. Callbacks receive the entity or entities, accepted selection, and an `EntityMutationContext`; they may return synchronous or asynchronous results.

Mutations can produce work for multiple entity schemas. The execution layer orders accepted mutations by dependency so related Ids can be written before dependent operations.

## Current `save()` behavior

`save()` classifies current entities as creates or updates and compares against `previous` when supplied. If a previous root entity is omitted from the current set, it is currently detected as a root deletion. Save mutators accept root creates and updates, not root deletes; a registered delete mutator handles the root deletion. For selected relations, changes can include related creates, updates, and deletions, which compatible save or delete mutators may accept.

If no suitable delete mutator is registered, the overall mutation is not fully accepted and fails. This dispatch behavior is covered by the save-deletion tests. However, the delete executor currently does not remove successfully deleted entities from the original previous-entity list; that cleanup was lost in the mutation refactor and remains a TODO. Do not confuse that limitation with root deletions not being detected or dispatched.

The intended direction is for `save()` to synchronize the full entity graph, including deletions. The precise contract for omitted roots, selected relations, and deletion cleanup remains undecided. Keep that intent explicitly labeled as planned until implementation and tests establish it.

## Reliability notes

The workspace dispatches accepted callbacks in dependency order, but it does not itself provide an all-or-nothing transaction or rollback guarantee. Partial persistence can occur if a later callback fails. Deletion/change handling also has implementation TODOs; check the relevant tests before relying on edge-case behavior.
