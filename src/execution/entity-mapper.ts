import {
    dtoToEntity,
    Entity,
    EntityBlueprint,
    EntitySchema,
    entityToCreatableDto,
    entityToDto,
    entityToSavableDto,
    entityToUpdatableDto,
    PackedEntitySelection,
    toRelationSelection,
    unpackSelection,
} from "@entity-space/elements";

export class EntityMapper<B = {}> {
    constructor(schema: EntitySchema) {
        this.#schema = schema;
    }

    readonly #schema: EntitySchema;

    toDto(entity: EntityBlueprint.Type<B>): Entity {
        return entityToDto(this.#schema, entity);
    }

    toDtos(entities: readonly EntityBlueprint.Type<B>[]): Entity[] {
        return entities.map(entity => this.toDto(entity));
    }

    toCreatableDto(
        entity: EntityBlueprint.Type<B>,
        selection?: PackedEntitySelection<EntityBlueprint.Type<B>>,
    ): Entity {
        const relationSelection = selection
            ? toRelationSelection(this.#schema, unpackSelection(this.#schema, selection))
            : undefined;

        return entityToCreatableDto(this.#schema, entity, relationSelection);
    }

    toCreatableDtos(
        entities: EntityBlueprint.Type<B>[],
        selection?: PackedEntitySelection<EntityBlueprint.Type<B>>,
    ): Entity[] {
        const relationSelection = selection
            ? toRelationSelection(this.#schema, unpackSelection(this.#schema, selection))
            : undefined;

        return entities.map(entity => entityToCreatableDto(this.#schema, entity, relationSelection));
    }

    toUpdatableDto(
        entity: EntityBlueprint.Type<B>,
        selection?: PackedEntitySelection<EntityBlueprint.Type<B>>,
        options?: { includeId?: boolean },
    ): Entity {
        const relationSelection = selection
            ? toRelationSelection(this.#schema, unpackSelection(this.#schema, selection))
            : undefined;

        return entityToUpdatableDto(this.#schema, entity, relationSelection, options?.includeId);
    }

    toUpdatableDtos(
        entities: EntityBlueprint.Type<B>[],
        selection?: PackedEntitySelection<EntityBlueprint.Type<B>>,
        options?: { includeId?: boolean },
    ): Entity[] {
        const relationSelection = selection
            ? toRelationSelection(this.#schema, unpackSelection(this.#schema, selection))
            : undefined;

        return entities.map(entity =>
            entityToUpdatableDto(this.#schema, entity, relationSelection, options?.includeId),
        );
    }

    toSavableDto(
        entity: EntityBlueprint.Type<B>,
        selection?: PackedEntitySelection<EntityBlueprint.Type<B>>,
        options?: { includeId?: boolean },
    ): Entity {
        const relationSelection = selection
            ? toRelationSelection(this.#schema, unpackSelection(this.#schema, selection))
            : undefined;

        return entityToSavableDto(this.#schema, entity, relationSelection, options?.includeId);
    }

    toSavableDtos(
        entities: EntityBlueprint.Type<B>[],
        selection?: PackedEntitySelection<EntityBlueprint.Type<B>>,
        options?: { includeId?: boolean },
    ): Entity {
        const relationSelection = selection
            ? toRelationSelection(this.#schema, unpackSelection(this.#schema, selection))
            : undefined;

        return entities.map(entity => entityToSavableDto(this.#schema, entity, relationSelection, options?.includeId));
    }

    toEntity(dto: Entity): EntityBlueprint.Type<B> {
        return dtoToEntity(this.#schema, dto) as EntityBlueprint.Type<B>;
    }

    toEntities(dtos: Entity[]): EntityBlueprint.Type<B>[] {
        return dtos.map(dto => this.toEntity(dto));
    }
}
