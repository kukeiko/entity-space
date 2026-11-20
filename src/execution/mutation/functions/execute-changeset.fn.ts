import { Entity } from "@entity-space/elements";
import { EntityCache } from "../../cache/entity-cache";
import { EntityServiceContainer } from "../../entity-service-container";
import { EntityMutationOptions } from "../../execution-arguments.interface";
import { AcceptedEntityMutation } from "../structures/accepted-entity-mutation";
import { AcceptedEntityMutations } from "../structures/accepted-entity-mutations";
import { EntityChange, EntityChangeStatus } from "../structures/entity-change";
import { EntityMutation } from "../structures/entity-mutation";
import { EntityChangeOutcomeStatus, MutationCacheOperation, MutationDispatch } from "../structures/mutation-dispatch";
import { executeMutation } from "./execute-mutation.fn";
import { getDispatchRoots, groupBatchItems } from "./group-batch-items.fn";

export interface ExecuteChangesetArguments {
    readonly planned: AcceptedEntityMutations;
    readonly mutation: EntityMutation;
    readonly options: EntityMutationOptions;
    readonly signal: AbortSignal;
    readonly services: EntityServiceContainer;
    readonly previousCache: EntityCache;
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
    const remaining = new Set(planned.getMutations());

    for (const mutation of args.planned.getMutations()) {
        if (signal.aborted) {
            break;
        }

        const dispatch = toDispatch(args, mutation);

        if (dispatch === undefined) {
            continue;
        }

        await applyMutationOutcomes(args, dispatch);
        remaining.delete(mutation);
        onChange();
    }

    for (const mutation of remaining) {
        for (const item of mutation.getChanges().filter(item => !item.isSettled())) {
            item.setStatus(signal.aborted ? EntityChangeStatus.Cancelled : EntityChangeStatus.Blocked);
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
                item.setStatus(EntityChangeStatus.Failed, {
                    error: new Error("no outcome has been resolved for this change"),
                });
            } else if (outcome.status === EntityChangeOutcomeStatus.Succeeded) {
                item.setStatus(EntityChangeStatus.Succeeded);
            } else {
                item.setStatus(EntityChangeStatus.Failed, {
                    error: outcome.error,
                    errorPath: outcome.path,
                });
            }
        }
    } catch (error) {
        for (const item of dispatch.items) {
            item.setStatus(EntityChangeStatus.Failed, { error });
        }
    }

    args.onChange();
}

function toDispatch(args: ExecuteChangesetArguments, mutation: AcceptedEntityMutation): MutationDispatch | undefined {
    const groups = groupBatchItems(mutation, mutation.getChanges());
    const blocked = getBlockedItems(mutation, groups, args.planned);

    for (const item of mutation.getChanges()) {
        if (blocked.has(item.getKey())) {
            item.setStatus(EntityChangeStatus.Blocked);
        }
    }

    const dispatchRoots = new Set(getDispatchRoots(mutation));
    const roots: Entity[] = [];
    const items: EntityChange[] = [];
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

    for (const item of mutation
        .getChanges()
        .filter(item => !blocked.has(item.getKey()) && !rootOfByKey.has(item.getKey()))) {
        item.setStatus(EntityChangeStatus.Failed, {
            error: new Error("the entity is not part of any entity dispatched to the mutator"),
        });
    }

    if (!items.length) {
        args.onChange();
        return undefined;
    }

    for (const item of items) {
        item.setStatus(EntityChangeStatus.Running);
    }

    args.onChange();

    return {
        mutation: mutation,
        roots,
        items,
        rootOf: new Map(items.map(item => [item, rootOfByKey.get(item.getKey())!])),
        workspaceMutation: args.mutation,
        options: args.options,
        signal: args.signal,
        services: args.services,
        cacheOperations: args.cacheOperations,
        previousCache: args.previousCache,
    };
}

/**
 * An item is blocked if any of its prerequisites did not succeed, or if it belongs to the aggregate of a blocked item.
 */
function getBlockedItems(
    mutation: AcceptedEntityMutation,
    groups: Map<Entity, EntityChange[]>,
    planned: AcceptedEntityMutations,
): Set<string> {
    const blocked = new Set<string>();
    let changed = true;

    while (changed) {
        changed = false;

        for (const item of mutation.getChanges()) {
            if (blocked.has(item.getKey())) {
                continue;
            }

            const isBlocked = planned.getChangeDependencies(item).some(dependency => {
                return mutation.includesChange(dependency)
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
