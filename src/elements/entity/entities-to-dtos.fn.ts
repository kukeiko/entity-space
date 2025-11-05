import { Class } from "@entity-space/utils";
import { Entity } from "./entity";
import { entityToDto } from "./entity-to-dto.fn";

export function entitiesToDtos(
    blueprint: Class,
    entities: readonly Entity[],
    options?: { writableOnly?: boolean },
): Entity[] {
    return entities.map(entity => entityToDto(blueprint, entity, options));
}
