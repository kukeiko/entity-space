import {
    Entity,
    EntityMap,
    EntityRelationProperty,
    EntityRelationSelection,
    EntitySchema,
} from "@entity-space/elements";
import { ComplexKeyMap, joinPaths, Path } from "@entity-space/utils";
import { EntityMutationType } from "./entity-mutation";
import { isEntityUpdateEqual } from "./functions/is-entity-update-equal.fn";
import { CreateEntityChange, DeleteEntityChange, EntityChange, UpdateEntityChange } from "./structures/entity-change";
import { EntityChangeDependency } from "./structures/entity-change-dependency";

interface RelationStruct {
    relation: EntityRelationProperty;
    from: Entity;
    to: Entity;
}

interface SelectedEntityStruct {
    entity: Entity;
    selection: EntityRelationSelection;
    path?: Path;
}

export class EntityChangesBuilder {
    readonly #creates = new Map<EntitySchema, Entity[]>();
    readonly #updates = new Map<EntitySchema, ComplexKeyMap<Entity, SelectedEntityStruct[]>>();
    readonly #deletes = new EntityMap();
    readonly #previous = new Map<EntitySchema, ComplexKeyMap<Entity, SelectedEntityStruct[]>>();
    readonly #relations: RelationStruct[] = [];

    addCreate(schema: EntitySchema, entity: Entity): void {
        let entities = this.#creates.get(schema);

        if (entities === undefined) {
            entities = [];
            this.#creates.set(schema, entities);
        }

        entities.push(entity);
    }

    addUpdate(schema: EntitySchema, path: Path | undefined, selection: EntityRelationSelection, entity: Entity): void {
        this.#addUpdateOrPrevious(this.#updates, schema, path, selection, entity);
    }

    addPrevious(
        schema: EntitySchema,
        path: Path | undefined,
        selection: EntityRelationSelection,
        entity: Entity,
    ): void {
        this.#addUpdateOrPrevious(this.#previous, schema, path, selection, entity);
    }

    // [todo] ❓ what about this removeFn?
    addDelete(schema: EntitySchema, entity: Entity, removeFn?: (entity: Entity) => void): void {
        this.#deletes.addEntity(schema, entity);
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
            for (const { entity, path, selection } of map.getAll().flat()) {
                const previous = this.#getPrevious(schema, entity, path);

                if (previous !== undefined && isEntityUpdateEqual(schema, entity, previous.entity, selection)) {
                    continue;
                }

                const dependencies = this.#getDependencies("update", schema, entity);
                const deleteDependencies =
                    previous !== undefined ? this.#getDependencies("delete", schema, previous.entity) : [];

                changes.push(new UpdateEntityChange(schema, entity, [...dependencies, ...deleteDependencies]));
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

    #addUpdateOrPrevious(
        updateOrPreviousMap: Map<EntitySchema, ComplexKeyMap<Entity, SelectedEntityStruct[]>>,
        schema: EntitySchema,
        path: Path | undefined,
        selection: EntityRelationSelection,
        entity: Entity,
    ): void {
        let map = updateOrPreviousMap.get(schema);

        if (map === undefined) {
            map = new ComplexKeyMap(schema.getIdPaths());
            updateOrPreviousMap.set(schema, map);
        }

        let entities = map.get(entity);

        if (entities === undefined) {
            entities = [];
            map.set(entity, entities);
        }

        entities.push({ entity, selection, path });
    }

    #getPrevious(schema: EntitySchema, entity: Entity, path?: Path): SelectedEntityStruct | undefined {
        return this.#previous
            .get(schema)
            ?.get(entity)
            ?.find(candidate => candidate.path?.toString() === path?.toString());
    }

    #getDependencies(type: EntityMutationType, schema: EntitySchema, entity: Entity): EntityChangeDependency[] {
        const dependencies: EntityChangeDependency[] = [];

        for (const [relations, to] of this.#getJoinedRelations(entity)) {
            const path = joinPaths(relations.map(relation => relation.getName()));
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
