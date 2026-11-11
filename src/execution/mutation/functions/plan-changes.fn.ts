import { Entity, EntitySchema } from "@entity-space/elements";
import { readPath } from "@entity-space/utils";
import { EntityServiceContainer } from "../../entity-service-container";
import { CommittedEntities } from "../committed-entities";
import { EntityMutator } from "../entity-mutator";
import { AcceptedEntityMutation } from "../structures/accepted-entity-mutation";
import { EntityChange, PlannedEntityChange } from "../structures/entity-change";
import { EntityChanges } from "../structures/entity-changes";
import { EntityMutation } from "../structures/entity-mutation";
import { generatePathedMutators } from "./generate-pathed-mutators.fn";
import { sortAcceptedMutationsByDependency } from "./sort-accepted-mutations-by-dependency.fn";
import { toEntityChanges } from "./to-entity-changes.fn";

export interface ChangeBatch {
    readonly index: number;
    readonly mutation: AcceptedEntityMutation;
    items: PlannedEntityChange[];
}

export class PlannedChanges {
    constructor(items: PlannedEntityChange[], batches: ChangeBatch[]) {
        this.items = items;
        this.batches = batches;
    }

    items: PlannedEntityChange[];
    readonly batches: readonly ChangeBatch[];

    getItem(key: string): PlannedEntityChange | undefined {
        return this.items.find(item => item.getKey() === key);
    }

    replaceItem(next: PlannedEntityChange): void {
        const key = next.getKey();
        const index = this.items.findIndex(item => item.getKey() === key);

        if (index >= 0) {
            this.items[index] = next;
        }

        for (const batch of this.batches) {
            const batchIndex = batch.items.findIndex(item => item.getKey() === key);

            if (batchIndex >= 0) {
                batch.items[batchIndex] = next;
            }
        }
    }
}

/**
 * Detects the changes of a mutation, assigns them to mutators and builds the per-entity dependency graph.
 * Does not invoke any mutators. Throws if a change is not accepted by any registered mutator.
 */
export function planChanges(
    services: EntityServiceContainer,
    mutation: EntityMutation,
    committed: CommittedEntities,
): PlannedChanges {
    const entityChanges = toEntityChanges(mutation, committed);

    if (entityChanges === undefined) {
        return new PlannedChanges([], []);
    }

    const accepted = sortAcceptedMutationsByDependency(acceptChanges(services, mutation, entityChanges));
    const keys = new Map<string, number>();
    const items: PlannedEntityChange[] = [];

    const batches = accepted.map((acceptedMutation, index) => {
        const batchItems = acceptedMutation
            .getChanges()
            .map(change => change.toPlanned(toUniqueKey(keys, change), index));

        items.push(...batchItems);

        return { index, mutation: acceptedMutation, items: batchItems };
    });

    const wiredItems = wireItemDependencies(items);

    for (const batch of batches) {
        batch.items = batch.items.map(item => wiredItems.find(candidate => candidate.getKey() === item.getKey())!);
    }

    return new PlannedChanges(wiredItems, batches);
}

function acceptChanges(
    services: EntityServiceContainer,
    mutation: EntityMutation,
    entityChanges: EntityChanges,
): AcceptedEntityMutation[] {
    const mutators: EntityMutator[] = [
        ...services.getExplicitMutatorsFor(mutation.getSchema()),
        ...generatePathedMutators(services, mutation.getSchema(), mutation.getSelection() ?? {}),
    ];
    let open: EntityChanges | undefined = entityChanges;
    const allAccepted: AcceptedEntityMutation[] = [];

    for (const mutator of mutators) {
        const [accepted, nextOpen] = mutator.accept(open, undefined);

        if (accepted === undefined) {
            continue;
        }

        allAccepted.push(accepted);
        open = nextOpen;

        if (open === undefined) {
            break;
        }
    }

    if (open !== undefined) {
        const unaccepted = open.getChanges().map(change => change.toString());
        throw new Error(`not all mutations have been accepted, no mutator found for: ${unaccepted.join(", ")}`);
    }

    return allAccepted;
}

function wireItemDependencies(items: readonly PlannedEntityChange[]): PlannedEntityChange[] {
    const itemsByEntity = new Map<Entity, PlannedEntityChange[]>();
    const dependsOnByKey = new Map<string, Set<string>>();

    for (const item of items) {
        const entityItems = itemsByEntity.get(item.getEntity()) ?? [];
        entityItems.push(item);
        itemsByEntity.set(item.getEntity(), entityItems);
        dependsOnByKey.set(item.getKey(), new Set());
    }

    for (const item of items) {
        const dependsOnKeys = dependsOnByKey.get(item.getKey())!;

        for (const dependency of item.getOutboundDependencies()) {
            for (const other of itemsByEntity.get(dependency.getEntity()) ?? []) {
                if (other.getKey() !== item.getKey()) {
                    dependsOnKeys.add(other.getKey());
                }
            }
        }

        for (const dependency of item.getInboundDependencies()) {
            for (const other of itemsByEntity.get(dependency.getEntity()) ?? []) {
                if (other.getKey() !== item.getKey()) {
                    dependsOnByKey.get(other.getKey())!.add(item.getKey());
                }
            }
        }
    }

    return items.map(item => item.withDependsOn([...dependsOnByKey.get(item.getKey())!]));
}

function toUniqueKey(keys: Map<string, number>, change: EntityChange): string {
    const key = toKey(change.getSchema(), change);
    const count = keys.get(key) ?? 0;
    keys.set(key, count + 1);

    return count ? `${key}#${count + 1}` : key;
}

function toKey(schema: EntitySchema, change: EntityChange): string {
    const ids = schema.getIdPaths().map(path => readPath(path, change.getEntity()));
    return `${schema.getName()}:${change.getType()}:${JSON.stringify(ids.length === 1 ? ids[0] : ids)}`;
}
