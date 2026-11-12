import {
    copyEntities,
    entitiesToQuery,
    Entity,
    entityHasId,
    EntityRelationSelection,
    EntitySchema,
    getSelection,
    writeRelationJoins,
} from "@entity-space/elements";
import { BehaviorSubject, Observable } from "rxjs";
import { deleteFromCache } from "../cache/delete-from-cache.fn";
import { EntityCache } from "../cache/entity-cache";
import { upsertToCache } from "../cache/upsert-to-cache.fn";
import { EntityQueryTracing } from "../entity-query-tracing";
import { EntityServiceContainer } from "../entity-service-container";
import { EntityMutationOptions } from "../execution-arguments.interface";
import { executeChangeset } from "./functions/execute-changeset.fn";
import { materializePrevious } from "./functions/materialize-previous.fn";
import { planChanges, PlannedChanges } from "./functions/plan-changes.fn";
import { writeBackEntities } from "./functions/write-back-entities.fn";
import { EntityChange, EntityChangeItem, EntityChangeStatus } from "./structures/entity-change";
import { EntityMutation, EntityMutationType } from "./structures/entity-mutation";
import { MutationCacheOperation, MutationCacheOperationType } from "./structures/mutation-dispatch";

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
        this.#options = options;
        const silentTracing = new EntityQueryTracing();
        this.#cache = new EntityCache(silentTracing);
        const preparedNext = this.#prepareEntities(next);
        this.#mutation = new EntityMutation(type, schema, preparedNext, selection, structuredClone(previous.slice()));
        this.#plan(new Map());

        if (previous.length) {
            const previousQuery = entitiesToQuery(schema, previous, selection);
            this.#cache.upsertQuery(previousQuery, previous);
        }
    }

    readonly #services: EntityServiceContainer;
    readonly #mutation: EntityMutation;
    readonly #options: EntityMutationOptions;
    readonly #items$ = new BehaviorSubject<readonly EntityChangeItem[]>([]);
    readonly #cache: EntityCache;
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
        } else if (
            !this.#executed ||
            this.#planned.items.every(item => item.getStatus() === EntityChangeStatus.Pending)
        ) {
            return EntityChangesetStatus.Pending;
        } else {
            return this.#getResultStatus();
        }
    }

    isRunning(): boolean {
        return this.#controller !== undefined;
    }

    /** Copies of the next entities, including created Ids and caller-supplied temporary Ids for uncreated entities. */
    getNext(): T[] {
        return structuredClone(this.#mutation.getEntities()) as T[];
    }

    /** Copies of the entities known to be persisted. */
    getPrevious(): T[] {
        return structuredClone(this.#mutation.getPrevious()) as T[];
    }

    /**
     * Executes all outstanding changes. Changes that did not succeed in a previous execution are retried.
     * Resolves with a summary once nothing more can be dispatched; changes that did not succeed are not thrown.
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
                mutation: this.#mutation,
                options: this.#options,
                signal: controller.signal,
                services: this.#services,
                cacheOperations,
                onChange: () => this.#emit(),
                previousCache: this.#cache,
            });
        } finally {
            this.#mutation.setPrevious(
                materializePrevious(
                    this.#mutation.getSchema(),
                    this.#mutation.getSelection() ?? {},
                    this.#mutation.getType() === EntityMutationType.Delete ? [] : this.#mutation.getEntities(),
                    this.#mutation.getPrevious(),
                    this.#planned.items,
                    this.#cache,
                ),
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

        const prepared = this.#prepareEntities(next);
        this.#mutation.setEntities(prepared);
        this.#plan(this.#getItemsByKey());
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
        const schema = this.#mutation.getSchema();
        writeBackEntities(
            schema,
            getSelection(schema, this.#mutation.getSelection() ?? {}),
            targets,
            this.#mutation.getEntities(),
        );
    }

    #prepareEntities(next: readonly Entity[]): Entity[] {
        return structuredClone(next.slice());
    }

    #plan(previousItems: ReadonlyMap<string, EntityChange>): void {
        const schema = this.#mutation.getSchema();
        const selection = this.#mutation.getSelection() ?? {};

        writeRelationJoins(schema, this.#mutation.getEntities(), selection);

        const planned = planChanges(this.#services, this.#mutation, this.#cache);

        for (const item of planned.items) {
            const previousItem = previousItems.get(item.getKey());

            if (previousItem?.getError() !== undefined) {
                item.setStatus(EntityChangeStatus.Pending, {
                    error: previousItem.getError(),
                    errorPath: previousItem.getErrorPath(),
                });
            }
        }

        this.#planned = planned;
        this.#isStale = false;
        this.#emit();
    }

    #getItemsByKey(): Map<string, EntityChange> {
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
