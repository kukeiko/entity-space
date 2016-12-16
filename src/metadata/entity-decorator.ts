import { INoArgsCtor } from "../util";
import { EntityMetadata } from "./entity-metadata";

const METADATA_KEY = "entity-space:entity-metadata";

export interface IEntityType extends INoArgsCtor { }

export function Entity(metadata: EntityMetadata.ICtorArgs) {
    return (type: IEntityType) => {
        Reflect.defineMetadata(METADATA_KEY, new EntityMetadata(metadata), type);
    };
}

export function getEntityMetadata(type: IEntityType): EntityMetadata {
    return Reflect.getMetadata(METADATA_KEY, type) || null;
}
