---
description: Read this whenever you need to understand mutators, which persist changes to entities.
---

# Mutation

Mutations persist entity changes through callbacks registered with `EntityServiceContainer.for(blueprint)`. See `docs/mutation-plan.md` for the full design of changesets and partial success.

## Consumer API

Use `workspace.in(blueprint)` to build a mutation, optionally with `.select(...)` and `.cache(...)`.

- `prepareSave(entityOrEntities, previous?)`, `prepareSync(entities, previous)` and `prepareDelete(entityOrEntities)` return an `EntityChangeset` without persisting anything. They throw if a change is not accepted by any registered mutator.
- `save(...)`, `sync(...)` and `delete(...)` are shortcuts for `prepare*()` + `execute()`. They write created Ids and persisted values back into the given entities, and throw an `EntityMutationError` (carrying `changeset` and `summary`) if not all changes succeeded.

## Changesets

An `EntityChangeset` never modifies the entities passed to it; it works on copies.

- `getItems()` / `items$`: one `EntityChangeItem` per entity change (`key`, `schema`, `type`, `entity`, `previous`, `path`, `dependsOn`, `status`, `error`, `errorPath`). Statuses are `pending`, `running`, `succeeded`, `failed`, `blocked` and `cancelled`.
- `execute()`: dispatches ready mutations in dependency order, independent ones in parallel. Dependents of changes that did not succeed are `blocked`; independent work continues. Resolves with an `EntityChangesetSummary` (`succeeded`, `partial`, `failed` or `cancelled`) and does not reject because changes failed. Executing again retries only outstanding changes.
- `getNext()`: next entities with created Ids and persisted values; uncreated entities keep temporary (negative) Ids, which are never passed to mutators.
- `getPrevious()`: only state known to be persisted, used as the baseline for retries.
- `update(next)`: replans with edited next entities (based on `getNext()`); errors are kept on items with the same key until they run again.
- `cancel()`: aborts `context.signal` and cancels undispatched changes.

The cache, if enabled, is written once at the end of `execute()` with only what was persisted.

## Mutators

Register one-entity or batch callbacks with `addCreateOneMutator` / `addCreateMutator`, `addUpdateOneMutator` / `addUpdateMutator`, `addSaveOneMutator` / `addSaveMutator`, and `addDeleteOneMutator` / `addDeleteMutator`. For every mutator kind, `select` declares which related changes that mutator can handle. Callbacks receive the entity or entities, accepted selection, and an `EntityMutationContext`; they may return synchronous or asynchronous results.

The mutator kinds handle these effective entity changes:

- `create`: create new entities and selected related entities.
- `update`: update existing entities and selected related entities.
- `delete`: delete existing entities and selected related entities.
- `save`: create and update current entities and selected related entities, and delete selected existing related inbound entities.

Outcome contract:

- One-entity mutators: a throw fails only that entity.
- Batch mutators return what they persisted. A throw means nothing of the batch was persisted, and all of its changes fail.
- `context.fail(entity, error, { path? })` reports an entity passed to the mutator (or nested within one) as not persisted. `path` locates the offending property for validation errors.
- Returned entities are matched to inputs by explicit `context.succeed(input, persisted)`, then by reference, then by Id, then by globally smallest property difference; order is not relied upon. Nested relations are matched within matched pairs.
- Inputs neither returned nor failed fail with "the mutator did not return this entity". Delete mutators need not return anything.
- Use `context.signal` to abort running requests when the changeset is cancelled.

Mutation selection limits which related entities are traversed, and each mutator's `select` declares which related changes that mutator can handle. A save mutator can persist the current aggregate state for the selected relations it accepts, including removals, without inspecting `previous` to discover missing children. An empty array represents clearing a selected relation, while an omitted/`undefined` relation is left unchanged. Related changes not handled by that save mutator may be accepted by other compatible mutators.

`sync()` uses the same create/update and selected related-change handling as `save()`, and also dispatches previous root entities omitted from the current set as deletions. It uses the existing mutator kinds; there is no separate sync mutator. `previous` is required as the baseline for root deletion detection.

An `upsert` mutator and workspace method are possible future additions, not part of the current API.

## Save, sync, and delete behavior

`save()` classifies current entities as creates or updates. If `previous` is supplied, it is used to detect selected related changes, including supported inbound related deletions, but it does not detect or dispatch root deletions. This allows callers to save only changed current entities against a broader previous baseline without deleting the omitted roots.

`sync()` additionally compares the current root entities with `previous`; previous roots omitted from the current set are sent to a registered delete mutator. If no suitable delete mutator is registered, preparing the changeset throws. `sync()` accepts arrays of current and previous entities.

`delete()` dispatches the supplied entities as root deletions. It also traverses selected relations and dispatches supported inbound joined related entities as deletions. Successfully deleted entities are removed from the changeset's `getPrevious()`; entities that failed to be deleted remain.

## Reliability notes

There is no all-or-nothing transaction or rollback guarantee; partial persistence is reported per change and can be retried with the same changeset.

## Design choices (keep in mind)

These trade-offs were deliberate in the changeset rework; changing them would be a breaking or behavioral shift.

- **Shortcuts write back into caller-owned entities.** `prepare*` and `EntityChangeset` never mutate the objects passed in (they work on clones). `save()`, `sync()` and `delete()` still call `writeBack()` on those same objects so existing callers keep the old contract: created Ids and persisted field values land on the references they passed in. For UI-driven partial success, prefer `prepare*` + `execute()` and bind to `getNext()` instead of assuming the original form objects were updated.
- **Retrying a failed nested change often needs a separate mutator.** Aggregate `save` mutators accept nested creates/updates/deletes only together with a change on the root. If the root succeeded but a nested entity failed (e.g. one song under a new artist), a later `execute()` will not re-dispatch that nested item through the save mutator alone. Retrying it requires another mutator that accepts that schema without the root (e.g. `addCreateMutator` on the nested blueprint), or replanning so the root change is outstanding again.

## Known gaps (not implemented yet)

From the original changeset plan; still worth addressing if we revisit the API.

- **`update()` does not detect "fresh" objects after partial success.** Callers are expected to pass entities derived from `getNext()` so entities already created in an earlier `execute()` keep their Ids and item keys. If `update()` is given new object graphs without those Ids, the planner may treat them as new creates and dispatch duplicate creates. There is no runtime warning yet; behavior is only documented on `EntityChangeset.update()` and here.
