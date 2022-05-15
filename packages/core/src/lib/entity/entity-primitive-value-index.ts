import { IEntitySchemaIndex } from "../schema/schema.interface";
import { Entity } from "./entity";
import { IEntityIndex, MapPathFn } from "./entity-index.interface";

export class EntityPrimitiveValueIndex implements IEntityIndex {
    constructor(private readonly schema: IEntitySchemaIndex) {}

    getPath(): string {
        return this.schema.getPath()[0];
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

    private walkPath(path: string, object: Record<string, any>): any {
        for (const segment of path.split(".")) {
            object = object[segment];
        }

        return object;
    }
}
