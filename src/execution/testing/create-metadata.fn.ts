import { RecordMetadata } from "@entity-space/elements/testing";

export function createMetadata(
    createdById: number,
    updatedById?: number,
    createdAt?: string,
    updatedAt?: string,
): RecordMetadata {
    return {
        createdAt: createdAt ?? new Date().toISOString(),
        createdById,
        updatedById: updatedById ?? null,
        updatedAt: updatedAt ?? (updatedById ? new Date(Date.now() + 360 * 1000).toISOString() : null),
    };
}
