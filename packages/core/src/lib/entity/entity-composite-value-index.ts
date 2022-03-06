import { Criterion, fromDeepBag, inSet, isValue, or } from "@entity-space/criteria";
import { Entity } from "../entity/entity";
import { IEntitySchemaIndex } from "../schema/schema.interface";
import { IEntityIndex, MapPathFn } from "./entity-index.interface";

export class EntityCompositeValueIndex implements IEntityIndex {
    constructor(private readonly schema: IEntitySchemaIndex) {}

    getSchema(): IEntitySchemaIndex {
        return this.schema;
    }

    getPaths(): string[] {
        return this.schema.getPath();
    }

    createCriterion(entities: Entity[], mapPath: (path: string) => string = path => path): Criterion {
        const readValues = (entity: Entity): any[] => this.getPaths().map(path => this.walkPath(mapPath(path), entity));
        const rootMap = new Map();
        const rootBags: Record<string, any>[] = [];
        const lastPath = this.getPaths()[this.getPaths().length - 1];

        for (const entity of entities) {
            const values = readValues(entity);
            let map = rootMap;

            for (let i = 0; i < values.length - 2; ++i) {
                const value = values[i];
                map = map.get(value) ?? map.set(value, new Map()).get(value);
            }

            const previousToLastValue = values[values.length - 2];
            const lastValue = values[values.length - 1];
            const mapAccessValue = previousToLastValue === void 0 ? lastValue : previousToLastValue;

            let bag = map.get(mapAccessValue);

            if (bag === void 0) {
                bag = map.set(mapAccessValue, {}).get(mapAccessValue);
                rootBags.push(bag);

                for (let i = 0; i < values.length - 1; ++i) {
                    this.writePath(this.getPaths()[i], bag, isValue(values[i]));
                }

                this.writePath(lastPath, bag, new Set());
            }

            const set = this.walkPath<Set<any>>(lastPath, bag);
            set.add(values[values.length - 1]);
        }

        const lastPathWithoutLastSegment = lastPath.split(".").slice(0, -1).join(".");
        const lastPathLastSegment = lastPath.split(".").slice(-1)[0];

        for (const rootBag of rootBags) {
            const lastValueBag = this.walkPath(lastPathWithoutLastSegment, rootBag) as Record<string, any>;
            lastValueBag[lastPathLastSegment] = inSet(lastValueBag[lastPathLastSegment]);
        }

        const criteria = rootBags.map(rootBag => fromDeepBag(rootBag));

        if (criteria.length === 1) {
            return criteria[0];
        } else {
            return or(criteria);
        }
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

    readValues(entities: Entity[], mapPath: MapPathFn = path => path): (number | string | null)[][] {
        const readValues = (entity: Entity): any[] => this.getPaths().map(path => this.walkPath(mapPath(path), entity));
        const values: (number | string | null)[][] = [];

        for (const entity of entities) {
            values.push(readValues(entity));
        }

        return values;
    }

    private walkPath<T>(path: string, object: Record<string, any>): T {
        if (path === "") return object as T;

        for (const segment of path.split(".")) {
            object = object[segment];
        }

        return object as T;
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
}
