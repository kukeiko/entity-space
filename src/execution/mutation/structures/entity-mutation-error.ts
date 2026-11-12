import type { EntityChangeset, EntityChangesetSummary } from "../entity-changeset";

/**
 * Thrown by the save(), sync() and delete() shortcuts if not all changes succeeded.
 * Use the attached changeset to inspect the outcome of each change and to retry.
 */
export class EntityMutationError extends Error {
    constructor(changeset: EntityChangeset, summary: EntityChangesetSummary) {
        const failed = summary.items.filter(item => item.status !== "succeeded").length;
        const firstError = summary.failed[0]?.error;

        super(`${failed} of ${summary.items.length} entity changes did not succeed (status: ${summary.status})`, {
            cause: firstError,
        });

        this.name = "EntityMutationError";
        this.changeset = changeset;
        this.summary = summary;
    }

    readonly changeset: EntityChangeset;
    readonly summary: EntityChangesetSummary;
}
