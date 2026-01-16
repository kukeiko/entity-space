import { dtoToEntity, Entity, EntityBlueprint, EntitySchema, entityToDto } from "@entity-space/elements";

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

    toEntity(dto: Entity): EntityBlueprint.Type<B> {
        return dtoToEntity(this.#schema, dto) as EntityBlueprint.Type<B>;
    }

    toEntities(dtos: Entity[]): EntityBlueprint.Type<B>[] {
        return dtos.map(dto => this.toEntity(dto));
    }
}
