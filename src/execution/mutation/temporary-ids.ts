import {
    Entity,
    entityHasId,
    EntityRelationProperty,
    EntityRelationSelection,
    EntitySchema,
    relationEntries,
} from "@entity-space/elements";
import { Path, readPath, writePath } from "@entity-space/utils";

/**
 * Hands out placeholder Ids for entities that have not been created yet, so they keep a stable identity across
 * retries and can be used as keys by consumers. Placeholders are negative numbers (or their string representation),
 * which the library already treats as "no Id", and are removed again before entities are dispatched to mutators.
 */
export class TemporaryIds {
    #nextId = -1;
    /** Temporary placeholder Ids (negative numbers or their strings) mapped to the value on the entity before assignment. */
    readonly #originals = new Map<number | string, unknown>();

    isTemporary(value: unknown): boolean {
        return (typeof value === "number" || typeof value === "string") && this.#originals.has(value);
    }

    assign(schema: EntitySchema, entities: readonly Entity[], selection: EntityRelationSelection): void {
        if (!entities.length) {
            return;
        }

        if (schema.hasId()) {
            const lastIdPath = schema.getLastIdPath();
            const isString = schema.getPrimitive(lastIdPath).isString();

            for (const entity of entities) {
                const currentId = readPath(lastIdPath, entity);

                if (entityHasId(schema, entity) || this.isTemporary(currentId)) {
                    continue;
                }

                const temporaryId = isString ? (--this.#nextId).toString() : --this.#nextId;
                this.#originals.set(temporaryId, currentId);
                writePath(lastIdPath, entity, temporaryId);
            }
        }

        for (const [relation, relatedSchema, selected] of relationEntries(schema, selection)) {
            this.assign(relatedSchema, relation.readValuesFlat(entities), selected);
        }
    }

    /**
     * Replaces placeholder Ids with the values the entities originally had, both on Id paths and on join paths.
     * Expects copies, as the entities are modified in place.
     */
    strip(schema: EntitySchema, entities: readonly Entity[], selection: EntityRelationSelection): void {
        if (!entities.length) {
            return;
        }

        const joinedRelations = schema.getRelations().filter(relation => relation.isJoined());

        for (const entity of entities) {
            for (const idPath of schema.getIdPaths()) {
                this.#stripPath(entity, idPath, false);
            }

            for (const relation of joinedRelations.filter(relation => relation.isOutbound())) {
                for (const joinFrom of relation.getJoinFrom()) {
                    this.#stripPath(entity, joinFrom, true);
                }
            }
        }

        for (const [relation, relatedSchema, selected] of relationEntries(schema, selection)) {
            const related = relation.readValuesFlat(entities);

            if (this.#isInboundJoin(relation)) {
                for (const entity of related) {
                    for (const joinTo of relation.getJoinTo()) {
                        this.#stripPath(entity, joinTo, true);
                    }
                }
            }

            this.strip(relatedSchema, related, selected);
        }
    }

    /**
     * Copies a value while leaving out placeholder Ids, so they never leak into caller-owned objects.
     */
    withoutTemporary(value: unknown, fallback: unknown): unknown {
        return this.isTemporary(value) ? fallback : value;
    }

    #isInboundJoin(relation: EntityRelationProperty): boolean {
        return relation.isJoined() && relation.isInbound();
    }

    #stripPath(entity: Entity, path: Path, isJoin: boolean): void {
        const value = readPath(path, entity);

        if (Array.isArray(value)) {
            if (value.some(item => this.isTemporary(item))) {
                writePath(
                    path,
                    entity,
                    value.map(item =>
                        this.isTemporary(item) ? this.#toOriginal(item as number | string, isJoin) : item,
                    ),
                );
            }
        } else if (this.isTemporary(value)) {
            writePath(path, entity, this.#toOriginal(value as number | string, isJoin));
        }
    }

    #toOriginal(value: number | string, isJoin: boolean): unknown {
        const original = this.#originals.get(value);
        // joins of not yet created entities have always been written as 0, see EntityRelationProperty.writeJoins()
        return isJoin ? (original ?? 0) : original;
    }
}
