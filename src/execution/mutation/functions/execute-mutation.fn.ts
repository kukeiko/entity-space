import { assignEntitiesUsingIds, Entity, entityHasId, getSelection } from "@entity-space/elements";
import { readPath, writePath } from "@entity-space/utils";
import { EntityMutatorType } from "../entity-mutator";
import { EntityChange } from "../structures/entity-change";
import { EntityMutationContext } from "../structures/entity-mutation-context";
import {
    EntityChangeOutcome,
    EntityChangeOutcomeStatus,
    MutationCacheOperationType,
    MutationDispatch,
} from "../structures/mutation-dispatch";
import { CopiesForMutationDispatch, copyEntitiesForMutationDispatch } from "./copy-entities-for-mutation-dispatch.fn";
import { matchMutationResults } from "./match-mutation-results.fn";

export function executeMutation(dispatch: MutationDispatch): Promise<MutationOutcomes> {
    const { mutation } = dispatch;

    if (mutation.isCreate()) {
        return executeUpsertMutation(dispatch, EntityMutatorType.Create);
    } else if (mutation.isUpdate()) {
        return executeUpsertMutation(dispatch, EntityMutatorType.Update);
    } else if (mutation.isDelete()) {
        return dispatchDeleteMutation(dispatch);
    } else {
        return executeUpsertMutation(dispatch, EntityMutatorType.Save);
    }
}

export type MutationOutcomes = Map<string, EntityChangeOutcome>;

/**
 * Dispatches roots (and their accepted related entities) to a create, update or save mutator and resolves the
 * outcome of each dispatched item. Persisted ids and values are written into the changeset-owned entities.
 */
async function executeUpsertMutation(
    dispatch: MutationDispatch,
    type: typeof EntityMutatorType.Create | typeof EntityMutatorType.Update | typeof EntityMutatorType.Save,
): Promise<MutationOutcomes> {
    const { mutation, roots, services } = dispatch;
    const schema = mutation.getSchema();
    const relationSelection = mutation.getSelection();
    const fullSelection = getSelection(schema, relationSelection);

    for (const item of dispatch.items) {
        for (const dependency of item.getOutboundDependencies()) {
            services.getTracing().writingDependency(dependency);
            dependency.writeIds(item.getSchema(), [item.getEntity()]);
        }
    }

    const dispatched = copyEntitiesForMutationDispatch(mutation, roots, type !== EntityMutatorType.Create);
    const context = createDispatchContext(dispatch, dispatched);
    services.getTracing().dispatchedToMutator(schema, type, dispatched.copies);
    let returned: Entity[];

    try {
        returned = (await mutation.mutate(dispatched.copies, relationSelection, context)) ?? [];
    } catch (error) {
        return failAll(dispatch.items, error);
    }

    const matched = matchMutationResults(schema, relationSelection, dispatched.copies, returned, {
        isExcluded: copy => context.isFailed(copy),
        explicit: context.getSucceeded(),
    });

    for (const { schema, input, persisted } of matched) {
        const original = dispatched.originalOf.get(input)!;

        if (persisted === input || !schema.hasId() || entityHasId(schema, original)) {
            continue;
        }

        for (const idPath of schema.getIdPaths()) {
            const id = readPath(idPath, persisted);

            if (id !== undefined) {
                writePath(idPath, original, id);
            }
        }
    }

    const rootCopies = new Set(dispatched.copies);

    for (const { input, persisted } of matched) {
        if (rootCopies.has(input) && persisted !== input) {
            assignEntitiesUsingIds(schema, fullSelection, [dispatched.originalOf.get(input)!], [persisted]);
        }
    }

    const matchedCopies = new Set(matched.map(({ input }) => input));
    const results = resolveOutcomes(dispatch, dispatched, context, copy => matchedCopies.has(copy));

    for (const item of dispatch.items) {
        const outcome = results.get(item.getKey());

        if (outcome?.status !== EntityChangeOutcomeStatus.Succeeded) {
            continue;
        }

        for (const dependency of item.getInboundDependencies()) {
            services.getTracing().writingDependency(dependency);
            dependency.writeIds(item.getSchema(), [item.getEntity()]);
        }
    }

    for (const item of dispatch.items) {
        const outcome = results.get(item.getKey());

        if (outcome?.status !== EntityChangeOutcomeStatus.Succeeded) {
            continue;
        } else if (item.isDelete()) {
            dispatch.committed.delete(item.getSchema(), item.getEntity());
        } else {
            dispatch.committed.commit(item.getSchema(), item.getEntity());
        }
    }

    for (const root of roots.filter(root => isRootSucceeded(dispatch, results, root))) {
        dispatch.cacheOperations.push({
            type: MutationCacheOperationType.Upsert,
            schema,
            entity: root,
            selection: relationSelection,
        });
    }

    return results;
}

/**
 * Dispatches previous roots (and their accepted related entities) to a delete mutator.
 */
async function dispatchDeleteMutation(dispatch: MutationDispatch): Promise<MutationOutcomes> {
    const { mutation, roots, services } = dispatch;
    const schema = mutation.getSchema();
    const relationSelection = mutation.getSelection();
    const dispatched = copyEntitiesForMutationDispatch(mutation, roots);
    const context = createDispatchContext(dispatch, dispatched);
    services.getTracing().dispatchedToMutator(schema, EntityMutatorType.Delete, dispatched.copies);

    try {
        await mutation.mutate(dispatched.copies, relationSelection, context);
    } catch (error) {
        return failAll(dispatch.items, error);
    }

    const results = resolveOutcomes(dispatch, dispatched, context, () => true);
    const succeededRoots = roots.filter(root => isRootSucceeded(dispatch, results, root));

    for (const item of dispatch.items) {
        if (results.get(item.getKey())?.status === EntityChangeOutcomeStatus.Succeeded) {
            dispatch.committed.delete(item.getSchema(), item.getEntity());
        }
    }

    if (succeededRoots.length) {
        dispatch.cacheOperations.push({
            type: MutationCacheOperationType.Delete,
            schema,
            entities: succeededRoots.slice(),
            selection: relationSelection,
        });
    }

    return results;
}

function createDispatchContext(dispatch: MutationDispatch, dispatched: CopiesForMutationDispatch): EntityMutationContext {
    return new EntityMutationContext(
        dispatch.workspaceMutation,
        dispatch.options,
        new Set(dispatched.originalOf.keys()),
        dispatch.signal,
    );
}

function failAll(items: readonly EntityChange[], error: unknown): MutationOutcomes {
    return new Map(items.map(item => [item.getKey(), { status: EntityChangeOutcomeStatus.Failed, error }]));
}

function resolveOutcomes(
    dispatch: MutationDispatch,
    dispatched: CopiesForMutationDispatch,
    context: EntityMutationContext,
    isPersisted: (copy: Entity) => boolean,
): MutationOutcomes {
    const copiesOf = new Map<Entity, Entity[]>();

    for (const [copy, original] of dispatched.originalOf) {
        copiesOf.set(original, [...(copiesOf.get(original) ?? []), copy]);
    }

    const resolveCopy = (copy: Entity): EntityChangeOutcome => {
        const failure = context.getFailure(copy);

        if (failure !== undefined) {
            return { status: EntityChangeOutcomeStatus.Failed, error: failure.error, path: failure.path };
        } else if (context.isSucceeded(copy) || isPersisted(copy)) {
            return { status: EntityChangeOutcomeStatus.Succeeded };
        }

        for (let parent = dispatched.parentOf.get(copy); parent; parent = dispatched.parentOf.get(parent)) {
            const parentFailure = context.getFailure(parent);

            if (parentFailure !== undefined) {
                return { status: EntityChangeOutcomeStatus.Failed, error: parentFailure.error };
            }
        }

        return { status: EntityChangeOutcomeStatus.Failed, error: new Error("the mutator did not return this entity") };
    };

    const resolveEntity = (entity: Entity): EntityChangeOutcome | undefined => {
        const copies = copiesOf.get(entity);

        if (copies === undefined) {
            return undefined;
        }

        const resolved = copies.map(resolveCopy);
        return resolved.find(outcome => outcome.status === EntityChangeOutcomeStatus.Failed) ?? resolved[0];
    };

    const results: MutationOutcomes = new Map();

    for (const item of dispatch.items) {
        let outcome = resolveEntity(item.getEntity());

        if (outcome === undefined) {
            // e.g. deletions handled by a save mutator: they share the outcome of the root they were dispatched with
            const root = dispatch.rootOf.get(item);

            outcome = (root !== undefined && root !== item.getEntity() ? resolveEntity(root) : undefined) ?? {
                status: EntityChangeOutcomeStatus.Failed,
                error: new Error("the entity was not passed to the mutator"),
            };
        }

        results.set(item.getKey(), outcome);
    }

    return results;
}

function isRootSucceeded(dispatch: MutationDispatch, results: MutationOutcomes, root: Entity): boolean {
    const rootItems = dispatch.items.filter(item => item.getEntity() === root);
    return (
        rootItems.length > 0 &&
        rootItems.every(item => results.get(item.getKey())?.status === EntityChangeOutcomeStatus.Succeeded)
    );
}
