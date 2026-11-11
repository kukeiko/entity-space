import {
    copyEntities,
    Entity,
    entityHasId,
    EntityRelationSelection,
    EntitySchema,
    getSelection,
    writeRelationJoins,
} from "@entity-space/elements";
import { BehaviorSubject, Observable } from "rxjs";
import { deleteFromCache } from "../cache/delete-from-cache.fn";
import { upsertToCache } from "../cache/upsert-to-cache.fn";
import { EntityServiceContainer } from "../entity-service-container";
import { EntityMutationOptions } from "../execution-arguments.interface";
import { CommittedEntities } from "./committed-entities";
import { executeChangeset } from "./functions/execute-changeset.fn";
import { materializePrevious } from "./functions/materialize-previous.fn";
import { planChanges, PlannedChanges } from "./functions/plan-changes.fn";
import { writeBackEntities } from "./functions/write-back-entities.fn";
import { EntityChangeItem, EntityChangeStatus, PlannedEntityChange } from "./structures/entity-change";
import { EntityMutation, EntityMutationType } from "./structures/entity-mutation";
import { MutationCacheOperation, MutationCacheOperationType } from "./structures/mutation-dispatch";
import { TemporaryIds } from "./temporary-ids";

export const EntityChangesetResultStatus = {
    Succeeded: "succeeded",
    Partial: "partial",
    Failed: "failed",
    Cancelled: "cancelled",
} as const;

export type EntityChangesetResultStatus =
    (typeof EntityChangesetResultStatus)[keyof typeof EntityChangesetResultStatus];

export const EntityChangesetStatus = {
    Pending: "pending",
    Running: "running",
    ...EntityChangesetResultStatus,
} as const;

export type EntityChangesetStatus = (typeof EntityChangesetStatus)[keyof typeof EntityChangesetStatus];

export interface EntityChangesetSummary {
    readonly status: EntityChangesetResultStatus;
    readonly items: readonly EntityChangeItem[];
    readonly succeeded: readonly EntityChangeItem[];
    readonly failed: readonly EntityChangeItem[];
    readonly blocked: readonly EntityChangeItem[];
    readonly cancelled: readonly EntityChangeItem[];
}

export interface EntityChangesetArguments {
    services: EntityServiceContainer;
    type: EntityMutationType;
    schema: EntitySchema;
    selection: EntityRelationSelection;
    next: readonly Entity[];
    previous: readonly Entity[];
    options: EntityMutationOptions;
}

/**
 * The planned changes between next and previous entities. Changes can be inspected before executing them, observed
 * while they execute, and retried - optionally with edited next entities - if some of them did not succeed.
 * The entities passed in are never modified: use getNext() and getPrevious() to get the current state.
 */
export class EntityChangeset<T extends Entity = Entity> {
    constructor({ services, type, schema, selection, next, previous, options }: EntityChangesetArguments) {
        this.#services = services;
        this.#type = type;
        this.#schema = schema;
        this.#selection = selection;
        this.#options = options;
        this.#next = this.#prepareNext(next);
        this.#previous = structuredClone(previous.slice());
        this.#plan(new Map());
    }

    readonly #services: EntityServiceContainer;
    readonly #type: EntityMutationType;
    readonly #schema: EntitySchema;
    readonly #selection: EntityRelationSelection;
    readonly #options: EntityMutationOptions;
    readonly #temporaryIds = new TemporaryIds();
    readonly #committed = new CommittedEntities();
    readonly #items$ = new BehaviorSubject<readonly EntityChangeItem[]>([]);
    #next: Entity[];
    #previous: Entity[];
    #mutation!: EntityMutation;
    #planned!: PlannedChanges;
    #executed = false;
    #isStale = false;
    #controller?: AbortController;

    /** Emits a snapshot of all changes whenever the status of any of them changes. */
    readonly items$: Observable<readonly EntityChangeItem[]> = this.#items$.asObservable();

    getItems(): readonly EntityChangeItem[] {
        return this.#items$.getValue();
    }

    getStatus(): EntityChangesetStatus {
        if (this.isRunning()) {
            return EntityChangesetStatus.Running;
        } else if (!this.#executed || this.#planned.items.every(item => item.getStatus() === EntityChangeStatus.Pending)) {
            return EntityChangesetStatus.Pending;
        } else {
            return this.#getResultStatus();
        }
    }

    isRunning(): boolean {
        return this.#controller !== undefined;
    }

    /** Copies of the next entities, including created Ids, and temporary Ids for entities not yet created. */
    getNext(): T[] {
        return structuredClone(this.#next) as T[];
    }

    /** Copies of the entities known to be persisted. */
    getPrevious(): T[] {
        return structuredClone(this.#previous) as T[];
    }

    /**
     * Executes all outstanding changes. Changes that did not succeed in a previous execution are retried.
     * Resolves with a summary once nothing more can be executed; changes that did not succeed are not thrown.
     */
    async execute(): Promise<EntityChangesetSummary> {
        if (this.isRunning()) {
            throw new Error("the changeset is already executing");
        }

        if (this.#isStale) {
            this.#plan(this.#getItemsByKey());
        }

        const controller = new AbortController();
        const cacheOperations: MutationCacheOperation[] = [];
        this.#controller = controller;
        this.#executed = true;
        this.#emit();

        try {
            await executeChangeset({
                planned: this.#planned,
                entityMutation: this.#mutation,
                options: this.#options,
                signal: controller.signal,
                services: this.#services,
                temporaryIds: this.#temporaryIds,
                committed: this.#committed,
                cacheOperations,
                onChange: () => this.#emit(),
            });
        } finally {
            this.#previous = materializePrevious(
                this.#schema,
                this.#selection,
                this.#type === EntityMutationType.Delete ? [] : this.#next,
                this.#previous,
                this.#planned.items,
                this.#committed,
            );

            this.#isStale = true;
            this.#controller = undefined;
            this.#applyCacheOperations(cacheOperations);
            this.#emit();
        }

        return this.#toSummary();
    }

    /**
     * Replaces the next entities, e.g. after a user edited them in a form, and plans the changes again.
     * Base the entities on getNext(), so that already created entities keep their Ids and are not created again.
     * Errors of changes that failed before are kept until they are executed again.
     */
    update(next: readonly T[]): void {
        if (this.isRunning()) {
            throw new Error("can not update a changeset while it is executing");
        }

        const items = this.#getItemsByKey();
        this.#next = this.#prepareNext(next);
        this.#plan(items);
    }

    /**
     * Stops dispatching further changes and aborts the signal passed to running mutators.
     * Changes not yet dispatched are marked as cancelled.
     */
    cancel(): void {
        this.#controller?.abort();
    }

    /** @internal used by the save(), sync() and delete() shortcuts, which modify the entities passed to them */
    writeBack(targets: readonly T[]): void {
        writeBackEntities(
            this.#schema,
            getSelection(this.#schema, this.#selection),
            targets,
            this.#next,
            this.#temporaryIds,
        );
    }

    #prepareNext(next: readonly Entity[]): Entity[] {
        const prepared = structuredClone(next.slice());
        this.#temporaryIds.assign(this.#schema, prepared, this.#selection);

        return prepared;
    }

    #plan(previousItems: ReadonlyMap<string, PlannedEntityChange>): void {
        writeRelationJoins(this.#schema, this.#next, this.#selection);

        const mutation = new EntityMutation(this.#type, this.#schema, this.#next, this.#selection, this.#previous);
        const planned = planChanges(this.#services, mutation, this.#committed);

        for (const item of planned.items) {
            const previousItem = previousItems.get(item.getKey());

            if (previousItem?.getError() !== undefined) {
                planned.replaceItem(
                    item.withStatus(EntityChangeStatus.Pending, {
                        error: previousItem.getError(),
                        errorPath: previousItem.getErrorPath(),
                    }),
                );
            }
        }

        this.#mutation = mutation;
        this.#planned = planned;
        this.#isStale = false;
        this.#emit();
    }

    #getItemsByKey(): Map<string, PlannedEntityChange> {
        return new Map(this.#planned.items.map(item => [item.getKey(), item]));
    }

    #emit(): void {
        this.#items$.next(Object.freeze(this.#planned.items.map(item => item.toSnapshot())));
    }

    #getResultStatus(): EntityChangesetResultStatus {
        const items = this.#planned.items;

        if (items.some(item => item.getStatus() === EntityChangeStatus.Cancelled)) {
            return EntityChangesetResultStatus.Cancelled;
        } else if (items.every(item => item.getStatus() === EntityChangeStatus.Succeeded)) {
            return EntityChangesetResultStatus.Succeeded;
        } else if (items.some(item => item.getStatus() === EntityChangeStatus.Succeeded)) {
            return EntityChangesetResultStatus.Partial;
        } else {
            return EntityChangesetResultStatus.Failed;
        }
    }

    #toSummary(): EntityChangesetSummary {
        const items = this.getItems();
        const withStatus = (status: EntityChangeStatus) => items.filter(item => item.status === status);

        return Object.freeze({
            status: this.#getResultStatus(),
            items,
            succeeded: withStatus(EntityChangeStatus.Succeeded),
            failed: withStatus(EntityChangeStatus.Failed),
            blocked: withStatus(EntityChangeStatus.Blocked),
            cancelled: withStatus(EntityChangeStatus.Cancelled),
        });
    }

    #applyCacheOperations(operations: readonly MutationCacheOperation[]): void {
        if (!this.#options.cache || !operations.length) {
            return;
        }

        const cache = this.#services.getOrCreateCache(this.#options.cache.key);

        for (const operation of operations) {
            if (operation.type === MutationCacheOperationType.Upsert) {
                const persisted = copyEntities(
                    operation.schema,
                    [operation.entity],
                    getSelection(operation.schema, operation.selection),
                    (relation, entity) => {
                        const relatedSchema = relation.getRelatedSchema();
                        return relation.isEmbedded() || !relatedSchema.hasId() || entityHasId(relatedSchema, entity);
                    },
                )[0];

                upsertToCache(cache, operation.schema, persisted, operation.selection);
            } else {
                deleteFromCache(cache, operation.schema, operation.entities, operation.selection);
            }
        }
    }
}
