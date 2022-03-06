import { Criterion, fromDeepBag, inSet } from "@entity-space/criteria";
import { IEntitySchemaIndex } from "../schema/schema.interface";
import { Entity } from "./entity";
import { IEntityIndex, MapPathFn } from "./entity-index.interface";

export class EntityPrimitiveValueIndex implements IEntityIndex {
    constructor(private readonly schema: IEntitySchemaIndex) {}

    getSchema(): IEntitySchemaIndex {
        return this.schema;
    }

    getPath() : string {
        return this.schema.getPath()[0];
    }

    createCriterion(entities: Entity[], mapPath: MapPathFn = path => path): Criterion {
        const readValue = (entity: Entity): any => this.walkPath(mapPath(this.getPath()), entity);
        const set = new Set<any>();

        for (const entity of entities) {
            set.add(readValue(entity));
        }

        const bag: Record<string, any> = {};
        this.writePath(this.getPath(), bag, inSet(set));

        return fromDeepBag(bag);
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
        const readMappedPathValue = (entity: Entity): any => this.walkPath(mapPath(this.getPath()), entity);
        const ontoMap = new Map<any, Entity[]>();

        for (const entity of onto) {
            const value = readMappedPathValue(entity);
            const array = ontoMap.get(value) ?? ontoMap.set(value, []).get(value)!;
            array.push(entity);
        }

        const readValue = (entity: Entity): any => this.walkPath(this.getPath(), entity);

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

    readValues(entities: Entity[], mapPath: MapPathFn = path => path): (number | string | null)[][] {
        const values: (number | string | null)[][] = [];

        for (const entity of entities) {
            values.push([this.walkPath(mapPath(this.getPath()), entity)]);
        }

        return values;
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
}
