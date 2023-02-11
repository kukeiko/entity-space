import { readPath, writePath } from "@entity-space/utils";
import { Entity } from "../../common/entity.type";
import { ICriterion } from "../../criteria/vnext/criterion.interface";
import { EntityCriteriaFactory } from "../../criteria/vnext/entity-criteria-factory";
import { IInArrayCriterion } from "../../criteria/vnext/in-array/in-array-criterion.interface";
import { ComplexKeyMap } from "../data-structures/complex-key-map";

function createCriterionOnePath(entities: Entity[], path: string, writtenPath = path): ICriterion {
    const readValue = (entity: Entity): any => readPath(path, entity);
    const set = new Set<any>();

    for (const entity of entities) {
        const value = readValue(entity);

        if (value === void 0) {
            continue;
        }

        set.add(value);
    }

    const factory = new EntityCriteriaFactory();
    const bag: Record<string, any> = {};
    writePath(writtenPath, bag, factory.inArray(set));

    return factory.where(bag);
}

function createCriterionManyPaths(entities: Entity[], paths: string[], writtenPaths?: string[]): ICriterion {
    const leadingPaths = paths.slice(0, -1);
    const lastPath = paths[paths.length - 1];
    const writtenLastPath = writtenPaths ? writtenPaths[paths.length - 1] : lastPath;
    type Bag = Record<string, unknown>;
    const map = new ComplexKeyMap<Entity, Bag>(leadingPaths);
    const factory = new EntityCriteriaFactory();

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
            writePath(writtenPath, bag, factory.equals(value as any));
        }

        if (hasUndefinedValue) {
            continue;
        }

        // [todo] could squeeze out more performance if ComplexKeyMap accepts a method for value,
        // just like it does for update.
        writePath(writtenLastPath, bag, factory.inArray([readPath(lastPath, entity)!]));

        map.set(entity, bag, (previous, current) => {
            const previousSet = readPath(writtenLastPath, previous) as IInArrayCriterion;
            const currentSet = readPath(writtenLastPath, current) as IInArrayCriterion;
            writePath(
                writtenLastPath,
                previous,
                factory.inArray([...previousSet.getValues(), ...currentSet.getValues()])
            );

            return previous;
        });
    }

    // [todo] type assertion
    return factory.or(map.getAll().map(bag => factory.where(bag as any)));
}

export function createCriterionFromEntities(entities: Entity[], paths: string[], writtenPaths?: string[]): ICriterion {
    if (paths.length === 1) {
        return createCriterionOnePath(entities, paths[0], writtenPaths ? writtenPaths[0] : void 0);
    } else {
        return createCriterionManyPaths(entities, paths, writtenPaths);
    }
}
