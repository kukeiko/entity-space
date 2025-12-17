import { ComplexKeyMap } from "@entity-space/utils";
import { isPlainObject } from "lodash";
import { Entity } from "./entity";
import { entityHasId } from "./entity-has-id.fn";
import { EntitySchema } from "./entity-schema";
import { getEntityDifference } from "./get-entity-difference.fn";

function countProperties(entity: Entity): number {
    let count = 0;

    for (const value of Object.values(entity)) {
        count++;

        if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === "object") {
                    count += countProperties(item);
                }
            }
        } else if (isPlainObject(value)) {
            count += countProperties(value);
        }
    }

    return count;
}

function spliceMatchingEntityBySmallestDifference(
    schema: EntitySchema,
    entityA: Entity,
    entitiesB: Entity[],
): Entity | undefined {
    let best: { index: number; difference: number } | undefined;

    for (let index = 0; index < entitiesB.length; index++) {
        const diff = getEntityDifference(schema, entityA, entitiesB[index]);
        const difference = countProperties(diff);

        if (best === undefined || difference < best.difference) {
            best = { index, difference };
        }
    }

    if (best !== undefined) {
        const bestEntity = entitiesB[best.index];
        entitiesB.splice(best.index, 1);
        return bestEntity;
    }

    return undefined;
}

function toEntityPairsBySmallestDifference(
    schema: EntitySchema,
    a: readonly Entity[],
    b: readonly Entity[],
): [Entity, Entity | undefined][] {
    const entitiesB = b.slice();
    const pairs: [Entity, Entity | undefined][] = [];

    for (const entityA of a) {
        pairs.push([entityA, spliceMatchingEntityBySmallestDifference(schema, entityA, entitiesB)]);
    }

    return pairs;
}

// [todo] ❌ is faulty if same entity occurs twice - there is no test yet that checks for that
export function toEntityPairs(
    schema: EntitySchema,
    a: readonly Entity[],
    b: readonly Entity[],
): [Entity, Entity | undefined][] {
    if (!schema.hasId()) {
        return toEntityPairsBySmallestDifference(schema, a, b);
    }

    const mapOfB = new ComplexKeyMap(schema.getIdPaths());

    for (const entityB of b.filter(entity => entityHasId(schema, entity))) {
        mapOfB.set(entityB, entityB);
    }

    const entitiesB = b.slice();

    return a.map(entityA => {
        if (entityHasId(schema, entityA)) {
            let entityB = mapOfB.get(entityA);

            if (entityB !== undefined) {
                mapOfB.delete(entityA);
            } else {
                entityB = spliceMatchingEntityBySmallestDifference(
                    schema,
                    entityA,
                    entitiesB.filter(entity => !entityHasId(schema, entity)),
                );
            }

            return [entityA, entityB];
        } else {
            const entityB = spliceMatchingEntityBySmallestDifference(schema, entityA, entitiesB);

            if (entityB !== undefined) {
                mapOfB.delete(entityB);
            }

            return [entityA, entityB];
        }
    });
}
