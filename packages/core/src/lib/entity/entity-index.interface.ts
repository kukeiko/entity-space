import { IEntitySchemaIndex } from "../schema/schema.interface";
import { Entity } from "./entity";

export type MapPathFn = (path: string) => string;

export interface IEntityIndex {
    joinEntities(args: {
        fromEntities: Entity[];
        property: string;
        toEntities: Entity[];
        isArray: boolean;
        mapPath?: MapPathFn;
    }): void;
}
