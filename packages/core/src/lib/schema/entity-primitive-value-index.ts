import { Criterion, fromDeepBag, inSet } from "@entity-space/criteria";
import { Entity } from "../entity/entity";

export class EntityPrimitiveValueIndex {
    paths: string[] = [];
    path: string = "";

    getCriterion(entities: Entity[], mapPath: (path: string) => string = path => path): Criterion {
        const readValue = (entity: Entity): any => this.walkPath(mapPath(this.path), entity);
        const set = new Set<any>();

        for (const entity of entities) {
            set.add(readValue(entity));
        }

        const bag: Record<string, any> = {};
        this.writePath(this.path, bag, inSet(set));

        return fromDeepBag(bag);
    }

    joinEntities(
        what: Entity[],
        onto: Entity[],
        isArray = false,
        mapPath: (path: string) => string = path => path,
        joinedProperty: string
    ): void {
        const readValue = (entity: Entity): any => this.walkPath(this.path, entity);
        const readMappedPathValue = (entity: Entity): any => this.walkPath(mapPath(this.path), entity);
        const ontoMap = new Map<any, Entity[]>();

        for (const entity of onto) {
            const value = readMappedPathValue(entity);
            const array = ontoMap.get(value) ?? ontoMap.set(value, []).get(value)!;
            array.push(entity);
        }

        for (const entity of what) {
            const value = readValue(entity);
            const ontoEntities = ontoMap.get(value) ?? [];

            for (const ontoEntity of ontoEntities) {
                if (isArray) {
                    const array = (ontoEntity[joinedProperty] ??= []) as Entity[];
                    array.push(entity);
                } else {
                    ontoEntity[joinedProperty] = entity;
                }
            }
        }
    }

    private walkPath(path: string, object: Record<string, any>): any {
        for (const segment of path.split(".")) {
            object = object[segment];
        }

        return object;
    }

    private writePath<T>(path: string, object: Record<string, any>, value: T): T {
        const segments = path.split(".");

        for (let i = 0; i < segments.length - 1; ++i) {
            const segment = segments[i];
            object = object[segment] = {};
        }

        object[segments[segments.length - 1]] = value;

        return value;
    }

    private treadPath<T>(path: string, object: Record<string, any>, value: T): T {
        const segments = path.split(".");

        for (let i = 0; i < segments.length - 1; ++i) {
            const segment = segments[i];
            object = object[segment] ?? (object[segment] = {});
        }

        object[segments[segments.length - 1]] = value;

        return value;
    }
}
