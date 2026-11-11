import { Entity, EntitySchema } from "@entity-space/elements";
import { Path } from "@entity-space/utils";
import { EntityChange, EntityChangeType } from "./entity-change";

export const EntityChangeStatus = {
    Pending: "pending",
    Running: "running",
    Succeeded: "succeeded",
    Failed: "failed",
    Blocked: "blocked",
    Cancelled: "cancelled",
} as const;

export type EntityChangeStatus = (typeof EntityChangeStatus)[keyof typeof EntityChangeStatus];

/**
 * Snapshot of a single planned entity change, as exposed to consumers for rendering previews and live status.
 * The referenced entities are owned by the changeset and must not be modified.
 */
export interface EntityChangeItem<T extends Entity = Entity> {
    /** Stable across retries: built from schema, change type and (possibly temporary) Id. */
    readonly key: string;
    readonly schema: EntitySchema;
    readonly type: EntityChangeType;
    readonly entity: T;
    readonly previous?: T;
    readonly path?: Path;
    readonly dependsOn: readonly string[];
    readonly status: EntityChangeStatus;
    readonly error?: unknown;
    readonly errorPath?: string;
}

// [discussion] 🤖 can we merge ChangeItem and EntityChange together? I kind of understand the separation, but as a human - at first glance - it is confusing.
// let's talk about options.
export class ChangeItem {
    constructor(key: string, change: EntityChange, batchIndex: number) {
        this.key = key;
        this.change = change;
        this.batchIndex = batchIndex;
    }

    readonly key: string;
    readonly change: EntityChange;
    readonly batchIndex: number;
    readonly dependsOn = new Set<ChangeItem>();
    status: EntityChangeStatus = EntityChangeStatus.Pending;
    error?: unknown;
    errorPath?: string;

    getEntity(): Entity {
        return this.change.getEntity();
    }

    getSchema(): EntitySchema {
        return this.change.getSchema();
    }

    isSettled(): boolean {
        return this.status !== EntityChangeStatus.Pending && this.status !== EntityChangeStatus.Running;
    }

    succeed(): void {
        this.status = EntityChangeStatus.Succeeded;
        this.error = undefined;
        this.errorPath = undefined;
    }

    fail(error: unknown, path?: string): void {
        this.status = EntityChangeStatus.Failed;
        this.error = error;
        this.errorPath = path;
    }

    toSnapshot(): EntityChangeItem {
        return Object.freeze({
            key: this.key,
            schema: this.getSchema(),
            type: this.change.getType(),
            entity: this.getEntity(),
            previous: this.change.getType() === EntityChangeType.Delete ? this.getEntity() : this.change.getPrevious(),
            path: this.change.getPath(),
            dependsOn: Object.freeze([...this.dependsOn].map(item => item.key)),
            status: this.status,
            error: this.error,
            errorPath: this.errorPath,
        });
    }
}
