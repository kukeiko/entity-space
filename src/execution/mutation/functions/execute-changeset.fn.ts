import { Entity } from "@entity-space/elements";
import { EntityMutationOptions } from "../../execution-arguments.interface";
import { EntityServiceContainer } from "../../entity-service-container";
import { CommittedEntities } from "../committed-entities";
import { ChangeItem, EntityChangeStatus } from "../structures/change-item";
import { EntityMutation } from "../structures/entity-mutation";
import { MutationCacheOperation, MutationDispatch } from "../structures/mutation-dispatch";
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
                if (!isReady(batch)) {
                    continue;
                }

                remaining.delete(batch);
                dispatchedOrBlocked = true;
                const dispatch = toDispatch(args, batch);

                if (dispatch === undefined) {
                    continue;
                }

                // [review] 🤖 use await instead of then/catch/finally callbacks if possible
                const promise: Promise<void> = executeMutation(dispatch)
                    .then(outcomes => {
                        for (const item of dispatch.items) {
                            const outcome = outcomes.get(item);

                            if (outcome === undefined) {
                                item.fail(new Error("no outcome has been resolved for this change"));
                            } else if (outcome.status === "succeeded") {
                                item.succeed();
                            } else {
                                item.fail(outcome.error, outcome.path);
                            }
                        }
                    })
                    .catch(error => {
                        for (const item of dispatch.items) {
                            item.fail(error);
                        }
                    })
                    .finally(() => {
                        running.delete(promise);
                    });

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
            item.status = signal.aborted ? EntityChangeStatus.Cancelled : EntityChangeStatus.Blocked;
        }
    }

    onChange();
}

function isReady(batch: ChangeBatch): boolean {
    return batch.items.every(item =>
        [...item.dependsOn].every(dependency => dependency.batchIndex === batch.index || dependency.isSettled()),
    );
}

function toDispatch(args: ExecuteChangesetArguments, batch: ChangeBatch): MutationDispatch | undefined {
    const groups = groupBatchItems(batch.mutation, batch.items);
    const blocked = getBlockedItems(batch, groups);

    for (const item of blocked) {
        item.status = EntityChangeStatus.Blocked;
    }

    const dispatchRoots = new Set(getDispatchRoots(batch.mutation));
    const roots: Entity[] = [];
    const items: ChangeItem[] = [];
    const rootOf = new Map<ChangeItem, Entity>();

    for (const [root, groupItems] of groups) {
        if (!dispatchRoots.has(root) || groupItems.some(item => blocked.has(item))) {
            continue;
        }

        roots.push(root);

        for (const item of groupItems) {
            items.push(item);
            rootOf.set(item, root);
        }
    }

    for (const item of batch.items.filter(item => !blocked.has(item) && !rootOf.has(item))) {
        item.fail(new Error("the entity is not part of any entity dispatched to the mutator"));
    }

    if (!items.length) {
        return undefined;
    }

    for (const item of items) {
        item.status = EntityChangeStatus.Running;
    }

    return {
        mutation: batch.mutation,
        roots,
        items,
        rootOf,
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
function getBlockedItems(batch: ChangeBatch, groups: Map<Entity, ChangeItem[]>): Set<ChangeItem> {
    const blocked = new Set<ChangeItem>();
    let changed = true;

    while (changed) {
        changed = false;

        for (const item of batch.items) {
            if (blocked.has(item)) {
                continue;
            }

            const isBlocked = [...item.dependsOn].some(dependency =>
                dependency.batchIndex === batch.index
                    ? blocked.has(dependency)
                    : dependency.status !== EntityChangeStatus.Succeeded,
            );

            if (isBlocked) {
                blocked.add(item);
                changed = true;
            }
        }

        for (const groupItems of groups.values()) {
            if (groupItems.some(item => blocked.has(item)) && groupItems.some(item => !blocked.has(item))) {
                groupItems.forEach(item => blocked.add(item));
                changed = true;
            }
        }
    }

    return blocked;
}
