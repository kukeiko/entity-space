import { Entity } from "@entity-space/elements";
import { EntityMutationOptions } from "../../execution-arguments.interface";
import { EntityServiceContainer } from "../../entity-service-container";
import { CommittedEntities } from "../committed-entities";
import { EntityChangeStatus, PlannedEntityChange } from "../structures/entity-change";
import { EntityMutation } from "../structures/entity-mutation";
import { EntityChangeOutcomeStatus, MutationCacheOperation, MutationDispatch } from "../structures/mutation-dispatch";
import { TemporaryIds } from "../temporary-ids";
import { executeMutation } from "./execute-mutation.fn";
import { getDispatchRoots, groupBatchItems } from "./group-batch-items.fn";
import { ChangeBatch, PlannedChanges } from "./plan-changes.fn";

export interface ExecuteChangesetArguments {
    readonly planned: PlannedChanges;
    readonly entityMutation: EntityMutation;
    readonly options: EntityMutationOptions;
    readonly signal: AbortSignal;
    readonly services: EntityServiceContainer;
    readonly temporaryIds: TemporaryIds;
    readonly committed: CommittedEntities;
    readonly cacheOperations: MutationCacheOperation[];
    readonly onChange: () => void;
}

/**
 * Dispatches all batches of planned changes in dependency order, running independent batches in parallel.
 * Items whose prerequisites did not succeed are blocked, while independent work continues.
 * Resolves once nothing more can be dispatched.
 */
export async function executeChangeset(args: ExecuteChangesetArguments): Promise<void> {
    const { planned, signal, onChange } = args;
    const remaining = new Set(planned.batches);
    const running = new Set<Promise<void>>();

    const dispatchReady = (): void => {
        let dispatchedOrBlocked = true;

        while (dispatchedOrBlocked && !signal.aborted) {
            dispatchedOrBlocked = false;

            for (const batch of [...remaining]) {
                if (!isReady(batch, args.planned)) {
                    continue;
                }

                remaining.delete(batch);
                dispatchedOrBlocked = true;
                const dispatch = toDispatch(args, batch);

                if (dispatch === undefined) {
                    continue;
                }

                const promise = applyMutationOutcomes(args, dispatch);
                void promise.finally(() => running.delete(promise));
                running.add(promise);
            }
        }

        onChange();
    };

    dispatchReady();

    while (running.size) {
        await Promise.race(running);
        dispatchReady();
    }

    for (const batch of remaining) {
        for (const item of batch.items.filter(item => !item.isSettled())) {
            args.planned.replaceItem(
                item.withStatus(signal.aborted ? EntityChangeStatus.Cancelled : EntityChangeStatus.Blocked),
            );
        }
    }

    onChange();
}

async function applyMutationOutcomes(args: ExecuteChangesetArguments, dispatch: MutationDispatch): Promise<void> {
    try {
        const outcomes = await executeMutation(dispatch);

        for (const item of dispatch.items) {
            const outcome = outcomes.get(item.getKey());

            if (outcome === undefined) {
                args.planned.replaceItem(
                    item.withStatus(EntityChangeStatus.Failed, {
                        error: new Error("no outcome has been resolved for this change"),
                    }),
                );
            } else if (outcome.status === EntityChangeOutcomeStatus.Succeeded) {
                args.planned.replaceItem(item.withStatus(EntityChangeStatus.Succeeded));
            } else {
                args.planned.replaceItem(
                    item.withStatus(EntityChangeStatus.Failed, {
                        error: outcome.error,
                        errorPath: outcome.path,
                    }),
                );
            }
        }
    } catch (error) {
        for (const item of dispatch.items) {
            args.planned.replaceItem(item.withStatus(EntityChangeStatus.Failed, { error }));
        }
    }
}

function isReady(batch: ChangeBatch, planned: PlannedChanges): boolean {
    return batch.items.every(item =>
        item.getDependsOnKeys().every(dependencyKey => {
            const dependency = planned.getItem(dependencyKey);

            if (dependency === undefined) {
                return true;
            }

            return dependency.getBatchIndex() === batch.index || dependency.isSettled();
        }),
    );
}

function toDispatch(args: ExecuteChangesetArguments, batch: ChangeBatch): MutationDispatch | undefined {
    const groups = groupBatchItems(batch.mutation, batch.items);
    const blocked = getBlockedItems(batch, groups, args.planned);

    for (const item of batch.items) {
        if (blocked.has(item.getKey())) {
            args.planned.replaceItem(item.withStatus(EntityChangeStatus.Blocked));
        }
    }

    const dispatchRoots = new Set(getDispatchRoots(batch.mutation));
    const roots: Entity[] = [];
    const items: PlannedEntityChange[] = [];
    const rootOfByKey = new Map<string, Entity>();

    for (const [root, groupItems] of groups) {
        if (!dispatchRoots.has(root) || groupItems.some(item => blocked.has(item.getKey()))) {
            continue;
        }

        roots.push(root);

        for (const item of groupItems) {
            items.push(item);
            rootOfByKey.set(item.getKey(), root);
        }
    }

    for (const item of batch.items.filter(item => !blocked.has(item.getKey()) && !rootOfByKey.has(item.getKey()))) {
        args.planned.replaceItem(
            item.withStatus(EntityChangeStatus.Failed, {
                error: new Error("the entity is not part of any entity dispatched to the mutator"),
            }),
        );
    }

    if (!items.length) {
        return undefined;
    }

    for (const item of items) {
        args.planned.replaceItem(item.withStatus(EntityChangeStatus.Running));
    }

    const dispatchItems = items.map(item => args.planned.getItem(item.getKey())!);

    return {
        mutation: batch.mutation,
        roots,
        items: dispatchItems,
        rootOf: new Map(dispatchItems.map(item => [item, rootOfByKey.get(item.getKey())!])),
        entityMutation: args.entityMutation,
        options: args.options,
        signal: args.signal,
        services: args.services,
        temporaryIds: args.temporaryIds,
        committed: args.committed,
        cacheOperations: args.cacheOperations,
    };
}

/**
 * An item is blocked if any of its prerequisites did not succeed, or if it belongs to the aggregate of a blocked item.
 */
function getBlockedItems(
    batch: ChangeBatch,
    groups: Map<Entity, PlannedEntityChange[]>,
    planned: PlannedChanges,
): Set<string> {
    const blocked = new Set<string>();
    let changed = true;

    while (changed) {
        changed = false;

        for (const item of batch.items) {
            if (blocked.has(item.getKey())) {
                continue;
            }

            const isBlocked = item.getDependsOnKeys().some(dependencyKey => {
                const dependency = planned.getItem(dependencyKey);

                if (dependency === undefined) {
                    return false;
                }

                return dependency.getBatchIndex() === batch.index
                    ? blocked.has(dependency.getKey())
                    : dependency.getStatus() !== EntityChangeStatus.Succeeded;
            });

            if (isBlocked) {
                blocked.add(item.getKey());
                changed = true;
            }
        }

        for (const groupItems of groups.values()) {
            if (
                groupItems.some(item => blocked.has(item.getKey())) &&
                groupItems.some(item => !blocked.has(item.getKey()))
            ) {
                groupItems.forEach(item => blocked.add(item.getKey()));
                changed = true;
            }
        }
    }

    return blocked;
}
