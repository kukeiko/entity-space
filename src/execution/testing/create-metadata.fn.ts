import { RecordMetadata, User } from "@entity-space/elements/testing";

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

const createdAt = "2026-01-25T14:59:25.625Z";

export function createMetadata_V2(createdBy: number | User): RecordMetadata {
    const createdById = typeof createdBy === "number" ? createdBy : createdBy.id;

    return {
        createdAt,
        createdById,
        createdBy: typeof createdBy === "object" ? createdBy : undefined,
        updatedAt: null,
        updatedById: null,
    };
}
