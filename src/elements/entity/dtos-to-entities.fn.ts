import { Class } from "@entity-space/utils";
import { dtoToEntity } from "./dto-to-entity.fn";
import { Entity } from "./entity";
import { EntityBlueprint } from "./entity-blueprint";

export function dtosToEntities<T>(blueprint: Class<T>, dtos: readonly Entity[]): EntityBlueprint.Instance<T>[] {
    return dtos.map(dto => dtoToEntity(blueprint, dto));
}
