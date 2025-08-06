import { ComplexKeyMap, isPrimitive, Path, Primitive, readPath, writePath } from "@entity-space/utils";
import { Entity } from "../../entity/entity";
import { Criterion } from "../criterion";
import { EntityCriterion, PackedEntityCriterion } from "../entity-criterion";
import { OrCriterion } from "../or-criterion";

function singlePath(entities: readonly Entity[], path: Path, writtenPath?: Path): Criterion | undefined {
    const values = readPath(path, entities).filter(isPrimitive);

    if (!values.length) {
        return undefined;
    }

    return new EntityCriterion(writePath(writtenPath ?? path, {} as PackedEntityCriterion, values));
}

function multiPath(
    entities: readonly Entity[],
    paths: readonly Path[],
    writtenPaths: readonly Path[] = paths,
): Criterion {
    const lastPath = paths.at(-1);

    if (lastPath === undefined) {
        throw new Error("readPaths was empty");
    }

    const leadingPaths = paths.slice(0, -1);
    const map = new ComplexKeyMap<PackedEntityCriterion>(leadingPaths);

    function getTypedEntityCriterion(entity: Entity): PackedEntityCriterion {
        let typedEntityCriterion = map.get(entity);

        if (typedEntityCriterion === undefined) {
            typedEntityCriterion = {};

            for (let i = 0; i < writtenPaths.length - 1; i++) {
                writePath(writtenPaths[i], typedEntityCriterion, readPath<ReturnType<Primitive>>(paths[i], entity));
            }

            writePath(writtenPaths.at(-1)!, typedEntityCriterion, [] as ReturnType<Primitive>[]);
            map.set(entity, typedEntityCriterion);
        }

        return typedEntityCriterion;
    }

    for (const entity of entities) {
        const typedEntityCriterion = getTypedEntityCriterion(entity);
        const value = readPath(paths.at(-1)!, entity);

        readPath<ReturnType<Primitive>[]>(writtenPaths.at(-1)!, typedEntityCriterion)!.push(
            ...(Array.isArray(value) ? value : [value]),
        );
    }

    const typedEntityCriteria = map.getAll();

    return typedEntityCriteria.length === 1
        ? new EntityCriterion(typedEntityCriteria[0])
        : new OrCriterion(typedEntityCriteria.map(typedEntityCriterion => new EntityCriterion(typedEntityCriterion)));
}

export function entitiesToCriterion(
    entities: readonly Entity[],
    paths: readonly Path[],
    writtenPaths?: readonly Path[],
): Criterion | undefined {
    if (!entities.length) {
        return undefined;
    } else if (paths.length === 1) {
        return singlePath(entities, paths[0], writtenPaths?.[0]);
    }

    return multiPath(entities, paths, writtenPaths);
}
