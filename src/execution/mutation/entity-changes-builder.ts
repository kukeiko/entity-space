import { Entity, EntityMap, EntityRelationProperty, EntitySchema, getEntityDifference } from "@entity-space/elements";
import { ComplexKeyMap, toPath } from "@entity-space/utils";
import { isEmpty } from "lodash";
import { EntityMutationType } from "./entity-mutation";
import { EntityChangeDependency } from "./structures/entity-change-dependency";
import {
    CreateEntityChange,
    DeleteEntityChange,
    EntityChange,
    UpdateEntityChange,
} from "./structures/entity-change";

interface RelationStruct {
    relation: EntityRelationProperty;
    from: Entity;
    to: Entity;
}

export class EntityChangesBuilder {
    readonly #creates = new Map<EntitySchema, Entity[]>();
    readonly #updates = new Map<EntitySchema, ComplexKeyMap<Entity, Entity[]>>();
    readonly #deletes = new EntityMap();
    readonly #previous = new EntityMap();
    readonly #relations: RelationStruct[] = [];

    addCreate(schema: EntitySchema, entity: Entity): void {
        let entities = this.#creates.get(schema);

        if (entities === undefined) {
            entities = [];
            this.#creates.set(schema, entities);
        }

        entities.push(entity);
    }

    addUpdate(schema: EntitySchema, entity: Entity): void {
        let map = this.#updates.get(schema);

        if (map === undefined) {
            map = new ComplexKeyMap(schema.getIdPaths());
            this.#updates.set(schema, map);
        }

        let entities = map.get(entity);

        if (entities === undefined) {
            entities = [];
            map.set(entity, entities);
        }

        entities.push(entity);
    }

    addDelete(schema: EntitySchema, entity: Entity, removeFn?: (entity: Entity) => void): void {
        this.#deletes.addEntity(schema, entity);
    }

    addPrevious(schema: EntitySchema, entity: Entity): void {
        this.#previous.addEntity(schema, entity);
    }

    // [note] ✏️ reminder: embedded relations are added as well - keep those in mind when implementing dependency checks
    addRelation(relation: EntityRelationProperty, from: Entity, to: Entity): void {
        this.#relations.push({ relation, from, to });
    }

    buildChanges(): EntityChange[] {
        const changes: EntityChange[] = [];

        for (const [schema, entities] of this.#creates.entries()) {
            for (const entity of entities) {
                const dependencies = this.#getDependencies("create", schema, entity);
                changes.push(new CreateEntityChange(schema, entity, dependencies));
            }
        }

        for (const [schema, map] of this.#updates.entries()) {
            for (const entities of map.getAll()) {
                // [todo] ❓ just taking first entity for now, not sure what behavior we eventually want.
                const entity = entities[0];
                const previous = this.#previous.getEntity(schema, entity);

                if (previous !== undefined) {
                    // [todo] ❌ we probably need to pass "selection" argument, but we don't have one available
                    const difference = getEntityDifference(schema, entity, previous);

                    if (isEmpty(difference)) {
                        continue;
                    } else {
                        // [todo] ❌ implement & set patch in UpdateEntityChange. commented out code copied from previous implementation.
                        //     for (const idPath of schema.getIdPaths()) {
                        //         writePath(idPath, difference, readPath(idPath, current));
                        //     }
                        //     updated.push(new EntityChange("update", schema, current, difference));
                    }
                }

                const dependencies = entities.flatMap(entity => this.#getDependencies("update", schema, entity));
                const deleteDependencies =
                    previous !== undefined ? this.#getDependencies("delete", schema, previous) : [];

                changes.push(
                    new UpdateEntityChange(schema, entities[0], [...dependencies, ...deleteDependencies], entities),
                );
            }
        }

        for (const schema of this.#deletes.getSchemas()) {
            for (const entity of this.#deletes.getEntities(schema)) {
                const dependencies = this.#getDependencies("delete", schema, entity);
                changes.push(new DeleteEntityChange(schema, entity, dependencies));
            }
        }

        return changes;
    }

    #getDependencies(type: EntityMutationType, schema: EntitySchema, entity: Entity): EntityChangeDependency[] {
        const dependencies: EntityChangeDependency[] = [];

        for (const [relations, to] of this.#getJoinedRelations(entity)) {
            // [todo] ❌ toPath() should accept array of strings
            const path = toPath(relations.map(relation => relation.getName()).join("."));
            dependencies.push(new EntityChangeDependency(type, schema, path, to));
        }

        return dependencies;
    }

    #getRelations(entity: Entity): RelationStruct[] {
        return this.#relations.filter(candidate => candidate.from === entity);
    }

    #getJoinedRelations(entity: Entity): [path: EntityRelationProperty[], to: Entity][] {
        const relations: [path: EntityRelationProperty[], to: Entity][] = [];

        for (const { relation, to } of this.#getRelations(entity)) {
            let next: [path: EntityRelationProperty[], to: Entity];

            if (relation.isJoined()) {
                next = [[relation], to];
                relations.push(next);
            } else if (relation.isEmbedded()) {
                for (const [nestedRelations, nestedTo] of this.#getJoinedRelations(to)) {
                    relations.push([[relation, ...nestedRelations], nestedTo]);
                }
            }
        }

        return relations;
    }
}
