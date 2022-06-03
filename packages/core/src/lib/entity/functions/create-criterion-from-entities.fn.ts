import { Criterion, fromDeepBag, inSet, InSetCriterion, isValue, or } from "@entity-space/criteria";
import { tramplePath, walkPath } from "@entity-space/utils";
import { ComplexKeyMap } from "../data-structures/complex-key-map";
import { Entity } from "../entity";

function createCriterionOnePath(entities: Entity[], path: string, writtenPath = path): Criterion {
    const readValue = (entity: Entity): any => walkPath(path, entity);
    const set = new Set<any>();

    for (const entity of entities) {
        set.add(readValue(entity));
    }

    const bag: Record<string, any> = {};
    tramplePath(writtenPath, bag, inSet(set));

    return fromDeepBag(bag);
}

function createCriterionManyPaths(entities: Entity[], paths: string[], writtenPaths?: string[]): Criterion {
    const leadingPaths = paths.slice(0, -1);
    const lastPath = paths[paths.length - 1];
    const writtenLastPath = writtenPaths ? writtenPaths[paths.length - 1] : lastPath;
    const map = new ComplexKeyMap(leadingPaths);

    for (const entity of entities) {
        const bag: Record<string, unknown> = {};

        for (let i = 0; i < leadingPaths.length; ++i) {
            const path = leadingPaths[i];
            const writtenPath = writtenPaths ? writtenPaths[i] : path;
            // [todo] unsafe assertion
            tramplePath(writtenPath, bag, isValue(walkPath(path, entity)!));
        }

        // [todo] could squeeze out more performance if ComplexKeyMap accepts a method for value,
        // just like it does for update.
        tramplePath(writtenLastPath, bag, inSet([walkPath(lastPath, entity)!]));

        map.set(entity, bag, (previous, current) => {
            const previousSet = walkPath(writtenLastPath, previous as any) as InSetCriterion;
            const currentSet = walkPath(writtenLastPath, current as any) as InSetCriterion;
            tramplePath(
                writtenLastPath,
                previous as any,
                inSet([...previousSet.getValues(), ...currentSet.getValues()])
            );
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
