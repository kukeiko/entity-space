import { ComplexKeyMap, isDefined, permutateEntries } from "@entity-space/utils";
import { Entity } from "./entity";
import { EntityRelationProperty } from "./entity-relation-property";

export function joinEntities(
    entities: readonly Entity[],
    joinedEntities: readonly Entity[],
    relation: EntityRelationProperty,
): void {
    if (relation.isArray()) {
        if (relation.joinFromIsContainer()) {
            const joinedEntitiesMap = new ComplexKeyMap<Entity, Entity>(relation.getJoinTo());

            for (const joinedEntity of joinedEntities) {
                joinedEntitiesMap.set(joinedEntity, joinedEntity);
            }

            for (const entity of entities) {
                entity[relation.getName()] = permutateEntries(entity)
                    .map(key => joinedEntitiesMap.get(key, relation.getJoinFrom()))
                    .filter(isDefined);
            }
        } else {
            const joinedEntitiesMap = new ComplexKeyMap<Entity, Entity[]>(relation.getJoinTo());

            for (const joinedEntity of joinedEntities) {
                if (relation.joinToIsContainer()) {
                    for (const flatKey of permutateEntries(joinedEntity)) {
                        joinedEntitiesMap.set(flatKey, [joinedEntity], (previous, current) => {
                            previous.push(current[0]);
                            return previous;
                        });
                    }
                } else {
                    joinedEntitiesMap.set(joinedEntity, [joinedEntity], (previous, current) => {
                        previous.push(current[0]);
                        return previous;
                    });
                }
            }

            for (const entity of entities) {
                entity[relation.getName()] = joinedEntitiesMap.get(entity, relation.getJoinFrom()) ?? [];
            }
        }
    } else {
        const joinedEntitiesMap = new ComplexKeyMap<Entity, Entity>(relation.getJoinTo());

        for (const joinedEntity of joinedEntities) {
            joinedEntitiesMap.set(joinedEntity, joinedEntity);
        }

        for (const entity of entities) {
            entity[relation.getName()] =
                joinedEntitiesMap.get(entity, relation.getJoinFrom()) ?? (relation.isNullable() ? null : undefined);
        }
    }
}
