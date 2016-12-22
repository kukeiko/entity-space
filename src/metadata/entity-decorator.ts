import { Partial } from "../util";
import { IEntityType } from "./entity-type";
import { EntityMetadata } from "./entity-metadata";
import { Collection } from "./collection";
import { Primitive } from "./primitive";
import { Reference } from "./reference";

const METADATA_KEY = "entity-space:entity-metadata";
const METADATA_ARGS_KEY = "entity-space:entity-metadata:ctor-args";


type A = Partial<EntityMetadata.ICtorArgs>;

function getOrCreateMetadataArgs(type: any): Partial<EntityMetadata.ICtorArgs> {
    if (!Reflect.hasMetadata(METADATA_ARGS_KEY, type)) {
        let args: Partial<EntityMetadata.ICtorArgs> = {
            collections: [],
            primitives: [],
            references: []
        };

        Reflect.defineMetadata(METADATA_ARGS_KEY, args, type);
    }

    return Reflect.getMetadata(METADATA_ARGS_KEY, type);
}

export function Entity(args?: Partial<EntityMetadata.ICtorArgs>) {
    return (type: IEntityType) => {
        let existing = getOrCreateMetadataArgs(type);
        existing.name = type.name;

        if (!args) return;

        args = args || {} as Partial<EntityMetadata.ICtorArgs>;
        existing.primaryKey = args.primaryKey || existing.primaryKey;
        existing.primitives = [...existing.primitives, ...(args.primitives || [])];
        existing.references = [...existing.references, ...(args.references || [])];
        existing.collections = [...existing.collections, ...(args.collections || [])];
    };
}

export function getEntityMetadata(type: IEntityType): EntityMetadata {
    if (!Reflect.hasMetadata(METADATA_KEY, type)) {
        if (!Reflect.hasMetadata(METADATA_ARGS_KEY, type)) {
            return null;
        }

        let args = Reflect.getMetadata(METADATA_ARGS_KEY, type);
        Reflect.defineMetadata(METADATA_KEY, new EntityMetadata(type, args), type);
    }

    return Reflect.getMetadata(METADATA_KEY, type) || null;
}

export module Entity {
    export function PrimaryKey(args?: Partial<Primitive.ICtorArgs>) {
        return <T>(type: Object, key: string) => {
            args = args || {};
            let defaults = <Primitive.ICtorArgs>{ name: key };

            getOrCreateMetadataArgs(type.constructor).primaryKey = { ...defaults, ...args };
        };
    }

    export function Primitive(args?: Partial<Primitive.ICtorArgs>) {
        return <T>(type: Object, key: string) => {
            args = args || {};
            let defaults = <Primitive.ICtorArgs>{ name: key };

            getOrCreateMetadataArgs(type.constructor).primitives.push({ ...defaults, ...args });
        };
    }

    export function ReferenceKey(args?: Partial<Primitive.ICtorArgs>) {
        return <T>(type: Object, key: string) => {
            args = args || {};
            args.index = true;

            Primitive(args)(type, key);
        };
    }

    export function Reference(args: Partial<Reference.ICtorArgs>) {
        return <T>(type: Object, key: string) => {
            let defaults = <Reference.ICtorArgs>{ name: key };

            getOrCreateMetadataArgs(type.constructor).references.push({ ...defaults, ...args });
        };
    }

    export function Collection(args: Partial<Collection.ICtorArgs>) {
        return <T>(type: Object, key: string) => {
            let defaults = <Collection.ICtorArgs>{ name: key };

            getOrCreateMetadataArgs(type.constructor).collections.push({ ...defaults, ...args });
        };
    }
}
