import { readPath, writePath } from "@entity-space/utils";
import { Entity } from "../../common/entity.type";
import { Criterion } from "../../criteria/criterion/criterion";
import { fromDeepBag } from "../../criteria/criterion/named/from-deep-bag.fn";
import { or } from "../../criteria/criterion/or/or.fn";
import { InSetCriterion } from "../../criteria/criterion/set/in-set-criterion";
import { inSet } from "../../criteria/criterion/set/in-set.fn";
import { isValue } from "../../criteria/criterion/value/is-value.fn";
import { ComplexKeyMap } from "../data-structures/complex-key-map";

function createCriterionOnePath(entities: Entity[], path: string, writtenPath = path): Criterion {
    const readValue = (entity: Entity): any => readPath(path, entity);
    const set = new Set<any>();

    for (const entity of entities) {
        const value = readValue(entity);

        if (value === void 0) {
            continue;
        }

        set.add(value);
    }

    const bag: Record<string, any> = {};
    writePath(writtenPath, bag, inSet(set));

    return fromDeepBag(bag);
}

function createCriterionManyPaths(entities: Entity[], paths: string[], writtenPaths?: string[]): Criterion {
    const leadingPaths = paths.slice(0, -1);
    const lastPath = paths[paths.length - 1];
    const writtenLastPath = writtenPaths ? writtenPaths[paths.length - 1] : lastPath;
    type Bag = Record<string, unknown>;
    const map = new ComplexKeyMap<Entity, Bag>(leadingPaths);

    for (const entity of entities) {
        const bag: Bag = {};
        let hasUndefinedValue = false;

        for (let i = 0; i < leadingPaths.length; ++i) {
            const path = leadingPaths[i];
            const writtenPath = writtenPaths ? writtenPaths[i] : path;
            const value = readPath(path, entity);

            if (value === void 0) {
                hasUndefinedValue = true;
                break;
            }

            // [todo] unsafe assertion
            writePath(writtenPath, bag, isValue(value as any));
        }

        if (hasUndefinedValue) {
            continue;
        }

        // [todo] could squeeze out more performance if ComplexKeyMap accepts a method for value,
        // just like it does for update.
        writePath(writtenLastPath, bag, inSet([readPath(lastPath, entity)!]));

        map.set(entity, bag, (previous, current) => {
            const previousSet = readPath(writtenLastPath, previous) as InSetCriterion;
            const currentSet = readPath(writtenLastPath, current) as InSetCriterion;
            writePath(writtenLastPath, previous, inSet([...previousSet.getValues(), ...currentSet.getValues()]));

            return previous;
        });
    }

    return or(map.getAll().map(bag => fromDeepBag(bag)));
}

export function createCriterionFromEntities(entities: Entity[], paths: string[], writtenPaths?: string[]): Criterion {
    if (paths.length === 1) {
        return createCriterionOnePath(entities, paths[0], writtenPaths ? writtenPaths[0] : void 0);
    } else {
        return createCriterionManyPaths(entities, paths, writtenPaths);
    }
}
