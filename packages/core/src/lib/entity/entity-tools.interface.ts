import { Class } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { EntityBlueprintInstance } from "../schema/entity-blueprint-instance.type";
import { IEntitySchema } from "../schema/schema.interface";
import { NormalizedEntities } from "./normalized-entities";

export interface IEntityTools {
    toDestructurable(): IEntityTools;
    toEntityFromDto<T>(blueprint: Class<T>, dto: Record<string, unknown>): EntityBlueprintInstance<T>;
    toDtoFromEntity<T>(
        blueprint: Class<T>,
        entity: EntityBlueprintInstance<T>,
        options: { writableOnly?: boolean }
    ): Entity;
    joinEntities(
        fromEntities: Entity[],
        toEntities: Entity[],
        joinedProperty: string,
        fromPaths: string[],
        toPaths: string[],
        isArray?: boolean,
        isNullable?: boolean
    ): void;
    matchesSchema(entity: Entity, schema: IEntitySchema): boolean;
    dedupeMergeEntities(entities: Entity[], keyPaths: string[]): Entity[];
    mergeEntities(...entities: Entity[]): Entity;
    copyEntity(entity: Entity): Entity;
    normalizeEntities(schema: IEntitySchema, entities: Entity[], normalized?: NormalizedEntities): NormalizedEntities;
}
