import { Entity } from "../entity/entity";
import { IEntitySchemaIndex } from "../schema/schema.interface";
import { IEntityIndex, MapPathFn } from "./entity-index.interface";

export class EntityCompositeValueIndex implements IEntityIndex {
    constructor(private readonly schema: IEntitySchemaIndex) {}

    getPaths(): string[] {
        return this.schema.getPath();
    }

    joinEntities(args: {
        fromEntities: Entity[];
        property: string;
        toEntities: Entity[];
        isArray: boolean;
        mapPath?: MapPathFn;
    }): void {
        const { fromEntities: onto, property: joinedProperty, toEntities: what, isArray } = args;
        let mapPath = args.mapPath ?? ((path: string) => path);

        const readMappedPathValues = (entity: Entity): any[] =>
            this.getPaths().map(path => this.walkPath(mapPath(path), entity));
        const ontoMap = new Map();

        for (const entity of onto) {
            const values = readMappedPathValues(entity);
            let map = ontoMap;

            for (let i = 0; i < values.length - 1; ++i) {
                const value = values[i];
                map = map.get(value) ?? map.set(value, new Map()).get(value);
            }

            const lastValue = values[values.length - 1];
            const array = map.get(lastValue) ?? map.set(lastValue, []).get(lastValue)!;
            array.push(entity);
        }

        const readValues = (entity: Entity): any[] => this.getPaths().map(path => this.walkPath(path, entity));

        for (const entity of what) {
            const values = readValues(entity);
            let map = ontoMap;

            for (const value of values) {
                map = map.get(value);

                if (map === void 0) {
                    break;
                }
            }

            if (map === void 0) {
                continue;
            }

            const ontoEntities: Entity[] = map as any;

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

    private walkPath<T>(path: string, object: Record<string, any>): T {
        if (path === "") return object as T;

        for (const segment of path.split(".")) {
            object = object[segment];
        }

        return object as T;
    }
}
