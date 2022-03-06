import { Criterion } from "@entity-space/criteria";
import { IEntitySchemaIndex } from "../schema/schema.interface";
import { Entity } from "./entity";

export type MapPathFn = (path: string) => string;

export interface IEntityIndex {
    // getSchema(): IEntitySchemaIndex; // [todo] alternatively, let IEntityIndex extend IEntitySchemaIndex
    createCriterion(entities: Entity[], mapPath?: MapPathFn): Criterion;
    joinEntities(args: {
        fromEntities: Entity[];
        property: string;
        toEntities: Entity[];
        isArray: boolean;
        mapPath?: MapPathFn;
    }): void;
    readValues(entities: Entity[], mapPath?: MapPathFn): (number | string | null)[][];
    getSchema(): IEntitySchemaIndex;
}
