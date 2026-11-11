import { assignEntitiesUsingIds, Entity, entityHasId, getSelection } from "@entity-space/elements";
import { readPath, writePath } from "@entity-space/utils";
import { EntityMutatorType } from "../entity-mutator";
import { ChangeItem } from "../structures/change-item";
import { EntityMutationContext } from "../structures/entity-mutation-context";
import { EntityMutationOutcomes } from "../structures/entity-mutation-outcomes";
import {
    EntityChangeOutcome,
    EntityChangeOutcomeStatus,
    MutationCacheOperationType,
    MutationDispatch,
} from "../structures/mutation-dispatch";
import { CopiesForMutationDispatch, copyEntitiesForMutationDispatch } from "./copy-entities-for-mutation-dispatch.fn";
import { matchMutationResults } from "./match-mutation-results.fn";

export type MutationOutcomes = Map<ChangeItem, EntityChangeOutcome>;

/**
 * Dispatches roots (and their accepted related entities) to a create, update or save mutator and resolves the
 * outcome of each dispatched item. Persisted Ids and values are written into the changeset-owned entities.
 */
export async function dispatchUpsertMutation(
    dispatch: MutationDispatch,
    type: typeof EntityMutatorType.Create | typeof EntityMutatorType.Update | typeof EntityMutatorType.Save,
): Promise<MutationOutcomes> {
    const { mutation, roots, services, temporaryIds } = dispatch;
    const schema = mutation.getSchema();
    const relationSelection = mutation.getSelection();
    const fullSelection = getSelection(schema, relationSelection);

    for (const item of dispatch.items) {
        for (const dependency of item.change.getOutboundDependencies()) {
            services.getTracing().writingDependency(dependency);
            dependency.writeIds(item.getSchema(), [item.getEntity()]);
        }
    }

    const dispatched = copyEntitiesForMutationDispatch(mutation, roots, type !== EntityMutatorType.Create);
    temporaryIds.strip(schema, dispatched.copies, relationSelection);
    const [outcomes, context] = createDispatchContext(dispatch, dispatched);
    services.getTracing().dispatchedToMutator(schema, type, dispatched.copies);
    let returned: Entity[];

    try {
        returned = (await mutation.mutate(dispatched.copies, relationSelection, context)) ?? [];
    } catch (error) {
        return failAll(dispatch.items, error);
    }

    const matched = matchMutationResults(schema, relationSelection, dispatched.copies, returned, {
        isExcluded: copy => outcomes.isFailed(copy),
        explicit: outcomes.getSucceeded(),
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
    const results = resolveOutcomes(dispatch, dispatched, outcomes, copy => matchedCopies.has(copy));
    const succeededRoots = roots.filter(root => isRootSucceeded(dispatch, results, root));

    for (const [item, outcome] of results) {
        if (outcome.status !== EntityChangeOutcomeStatus.Succeeded) {
            continue;
        }

        for (const dependency of item.change.getInboundDependencies()) {
            services.getTracing().writingDependency(dependency);
            dependency.writeIds(item.getSchema(), [item.getEntity()]);
        }
    }

    for (const [item, outcome] of results) {
        if (outcome.status !== EntityChangeOutcomeStatus.Succeeded) {
            continue;
        } else if (item.change.isDelete()) {
            dispatch.committed.delete(item.getSchema(), item.getEntity());
        } else {
            dispatch.committed.commit(item.getSchema(), item.getEntity());
        }
    }

    for (const root of succeededRoots) {
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
export async function dispatchDeleteMutation(dispatch: MutationDispatch): Promise<MutationOutcomes> {
    const { mutation, roots, services } = dispatch;
    const schema = mutation.getSchema();
    const relationSelection = mutation.getSelection();
    const dispatched = copyEntitiesForMutationDispatch(mutation, roots);
    const [outcomes, context] = createDispatchContext(dispatch, dispatched);
    services.getTracing().dispatchedToMutator(schema, EntityMutatorType.Delete, dispatched.copies);

    try {
        await mutation.mutate(dispatched.copies, relationSelection, context);
    } catch (error) {
        return failAll(dispatch.items, error);
    }

    const results = resolveOutcomes(dispatch, dispatched, outcomes, () => true);
    const succeededRoots = roots.filter(root => isRootSucceeded(dispatch, results, root));

    for (const [item, outcome] of results) {
        if (outcome.status === EntityChangeOutcomeStatus.Succeeded) {
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

function createDispatchContext(
    dispatch: MutationDispatch,
    dispatched: CopiesForMutationDispatch,
): [EntityMutationOutcomes, EntityMutationContext] {
    const outcomes = new EntityMutationOutcomes(new Set(dispatched.originalOf.keys()));
    const context = new EntityMutationContext(dispatch.entityMutation, dispatch.options, outcomes, dispatch.signal);

    return [outcomes, context];
}

function failAll(items: readonly ChangeItem[], error: unknown): MutationOutcomes {
    return new Map(items.map(item => [item, { status: EntityChangeOutcomeStatus.Failed, error }]));
}

function resolveOutcomes(
    dispatch: MutationDispatch,
    dispatched: CopiesForMutationDispatch,
    outcomes: EntityMutationOutcomes,
    isPersisted: (copy: Entity) => boolean,
): MutationOutcomes {
    const copiesOf = new Map<Entity, Entity[]>();

    for (const [copy, original] of dispatched.originalOf) {
        copiesOf.set(original, [...(copiesOf.get(original) ?? []), copy]);
    }

    const resolveCopy = (copy: Entity): EntityChangeOutcome => {
        const failure = outcomes.getFailure(copy);

        if (failure !== undefined) {
            return { status: EntityChangeOutcomeStatus.Failed, error: failure.error, path: failure.path };
        } else if (outcomes.isSucceeded(copy) || isPersisted(copy)) {
            return { status: EntityChangeOutcomeStatus.Succeeded };
        }

        for (let parent = dispatched.parentOf.get(copy); parent; parent = dispatched.parentOf.get(parent)) {
            const parentFailure = outcomes.getFailure(parent);

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

        results.set(item, outcome);
    }

    return results;
}

function isRootSucceeded(dispatch: MutationDispatch, results: MutationOutcomes, root: Entity): boolean {
    const rootItems = dispatch.items.filter(item => item.getEntity() === root);
    return (
        rootItems.length > 0 &&
        rootItems.every(item => results.get(item)?.status === EntityChangeOutcomeStatus.Succeeded)
    );
}
