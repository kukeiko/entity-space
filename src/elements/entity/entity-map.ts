import { ComplexKeyMap } from "@entity-space/utils";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export class EntityMap {
    readonly #map = new Map<EntitySchema, ComplexKeyMap<Entity, Entity>>();

    addEntity(schema: EntitySchema, entity: Entity): void {
        this.#getOrCreateSchemaMap(schema).set(entity, entity);
    }

    getEntity(schema: EntitySchema, entity: Entity): Entity | undefined {
        return this.#getOrCreateSchemaMap(schema).get(entity);
    }

    getEntities(schema: EntitySchema): Entity[] {
        return this.#getOrCreateSchemaMap(schema).getAll();
    }

    hasEntity(schema: EntitySchema, entity: Entity): boolean {
        return this.#getOrCreateSchemaMap(schema).has(entity);
    }

    getSchemas(): EntitySchema[] {
        return Array.from(this.#map.keys());
    }

    #getOrCreateSchemaMap(schema: EntitySchema): ComplexKeyMap<Entity, Entity> {
        let map = this.#map.get(schema);

        if (!map) {
            map = new ComplexKeyMap(schema.getIdPaths());
            this.#map.set(schema, map);
        }

        return map;
    }
}
