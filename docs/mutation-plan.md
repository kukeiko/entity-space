# Mutation changesets and partial success

Saving, syncing and deleting entities is planned as an `EntityChangeset`: a stateful handle that can be inspected before anything is persisted, observed while it executes, and executed again to retry changes that did not succeed.

```ts
const changeset = workspace.in(SongBlueprint).select({ artist: true }).prepareSave(next, previous);

render(changeset.getItems()); // nothing has been persisted yet
changeset.items$.subscribe(render); // live status updates

const summary = await changeset.execute(); // never rejects because of failed changes

if (summary.status !== "succeeded") {
    const form = changeset.getNext(); // created Ids are written, uncreated entities have temporary Ids
    // ... user fixes validation errors ...
    changeset.update(form);
    await changeset.execute(); // only outstanding changes are executed
}
```

## Preparing

`prepareSave(next, previous?)`, `prepareSync(next, previous)` and `prepareDelete(entities)` diff `next` against `previous` (the "two arrays" model) into create, update and delete changes, then find mutators for them. If any change is not accepted by a registered mutator, `prepare*` throws, before anything was persisted.

- The entities passed in are never modified. The changeset works on copies, exposed via `getNext()` and `getPrevious()`.
- New entities get temporary Ids (negative numbers, or their string representation) so that they can be identified and related to before they are created. Temporary Ids are never passed to mutators: they are reset to their original value (usually `0`) on the copies that are dispatched, including relation Ids that point at temporary Ids.
- Every change is an `EntityChangeItem` with a stable `key`, its `schema`, `type`, `entity`, `previous` (for deletes), relation `path`, `status`, `error`, `errorPath`, and the keys of the items it `dependsOn`.

## Executing

`execute()` dispatches every accepted mutation whose prerequisites have settled, independent ones in parallel. Changes depend on other changes, not batches:

- An entity referencing a new related entity via an outbound relation depends on that entity being created first; its relation Id is written once it was.
- Entities related via an inbound relation (e.g. songs of a new artist) depend on the entity they point to.
- If a prerequisite did not succeed, its dependents become `blocked`, while independent work continues.

Item statuses are `pending`, `running`, `succeeded`, `failed`, `blocked` and `cancelled`. There is no "unknown" outcome: a mutator either reports what it persisted, or it throws and persisted nothing.

`execute()` resolves with an `EntityChangesetSummary` (`status`: `succeeded`, `partial`, `failed` or `cancelled`, plus the items grouped by status). It does not reject because changes failed. The cache, if enabled, is written once execution has finished, containing only what was persisted.

`cancel()` stops dispatching further work, aborts `context.signal` for running mutators, and marks undispatched changes as `cancelled`.

## Mutator contract

One-entity mutators (`addCreateOneMutator`, ...) need no changes: if they throw, only that entity fails.

Batch mutators return what they persisted and report failures through the context:

```ts
services.for(SongBlueprint).addCreateMutator({
    create: async ({ entities, context }) => {
        const response = await api.createSongs(entities, { signal: context.signal });

        for (const failure of response.failures) {
            context.fail(entities[failure.index], new Error(failure.message), { path: failure.property });
        }

        return response.created;
    },
});
```

- Throwing (or rejecting) means the whole batch persisted nothing; every change in it fails with that error and can be retried.
- `context.fail(entity, error, { path? })` marks an entity passed to the mutator (or one nested within it) as not persisted. `path` locates the offending property, e.g. to show server side validation errors in a form.
- Returned entities are matched to the entities passed in, without relying on order or object identity: first by explicit `context.succeed(input, persisted)`, then by reference, then by Id, then by smallest property difference (globally across the batch, tie-broken by position). Nested related entities are matched the same way within each matched pair.
- Entities that are neither returned nor failed fail with "the mutator did not return this entity".
- Delete mutators need not return anything; deletes not failed via `context.fail` succeed.
- Nested entities of an aggregate save are expected in the returned root's relations as well. Failing a root also fails the entities nested within it.

## Retrying and editing

Executing again only dispatches outstanding work. Successful changes advance the baseline:

- `getNext()` contains created Ids and persisted values; entities not yet created keep their temporary Ids so they keep their identity (and item `key`) across retries.
- `getPrevious()` contains only state known to be persisted: succeeded creates and updates are added, succeeded deletes removed, failed changes keep their previous state.
- Persisted entities no longer reachable from the roots (e.g. an `Artist` whose `Song` failed to be created) are remembered internally, so they are neither created again nor lost as a baseline.

`update(next)` replaces the next entities, typically edited copies of `getNext()`, and plans again. Errors of items that failed before are kept on the replanned items with the same key until they are executed again, so a form can keep showing them.

A failed nested change of an aggregate save can only be retried on its own if a mutator accepts it without its root, e.g. a create mutator for the nested schema, because a save mutator accepts nested changes only together with a change of its root.

## Shortcuts

`save()`, `sync()` and `delete()` are `prepare*()` + `execute()`. They write created Ids and persisted values back into the entities passed in, and throw an `EntityMutationError` if not all changes succeeded. The error carries the `changeset` and `summary`, so callers can still inspect and retry:

```ts
try {
    await workspace.in(SongBlueprint).save(songs);
} catch (error) {
    if (error instanceof EntityMutationError) {
        await error.changeset.execute();
    }
}
```
