import { Entity, entityHasId, EntitySchema } from "@entity-space/elements";
import { ComplexKeyMap } from "@entity-space/utils";

/**
 * Normalized record of entity states known to be persisted by a changeset, keyed by schema and Id.
 * Serves as a fallback baseline for entities that are not reachable from the previous roots,
 * e.g. a related entity that was created while the root entity failed to be created.
 */
export class CommittedEntities {
    readonly #committed = new Map<EntitySchema, ComplexKeyMap<Entity, Entity>>();
    readonly #deleted = new Map<EntitySchema, ComplexKeyMap<Entity, true>>();

    get(schema: EntitySchema, entity: Entity): Entity | undefined {
        if (!entityHasId(schema, entity)) {
            return undefined;
        }

        return this.#committed.get(schema)?.get(entity);
    }

    isDeleted(schema: EntitySchema, entity: Entity): boolean {
        if (!entityHasId(schema, entity)) {
            return false;
        }

        return this.#deleted.get(schema)?.get(entity) === true;
    }

    commit(schema: EntitySchema, entity: Entity): void {
        if (!entityHasId(schema, entity)) {
            return;
        }

        this.#getMap(this.#committed, schema).set(entity, toCommittedSnapshot(schema, entity));
        this.#deleted.get(schema)?.delete(entity);
    }

    delete(schema: EntitySchema, entity: Entity): void {
        if (!entityHasId(schema, entity)) {
            return;
        }

        this.#committed.get(schema)?.delete(entity);
        this.#getMap(this.#deleted, schema).set(entity, true);
    }

    #getMap<V>(maps: Map<EntitySchema, ComplexKeyMap<Entity, V>>, schema: EntitySchema): ComplexKeyMap<Entity, V> {
        let map = maps.get(schema);

        if (map === undefined) {
            map = new ComplexKeyMap(schema.getIdPaths());
            maps.set(schema, map);
        }

        return map;
    }
}

function toCommittedSnapshot(schema: EntitySchema, entity: Entity): Entity {
    const snapshot: Entity = {};

    for (const [key, value] of Object.entries(entity)) {
        if (schema.isRelation(key) && schema.getRelation(key).isJoined()) {
            continue;
        }

        snapshot[key] = structuredClone(value);
    }

    return snapshot;
}
