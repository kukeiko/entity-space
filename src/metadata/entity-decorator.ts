import { IEntityType } from "./entity-type";
import { EntityMetadata } from "./entity-metadata";
import { Collection } from "./collection";
import { Primitive } from "./primitive";
import { Reference } from "./reference";

const METADATA_KEY = "entity-space:entity-metadata";
const METADATA_ARGS_KEY = "entity-space:entity-metadata:ctor-args";

let nameToTypeMap = new Map<string, IEntityType<any>>();

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
    return (type: IEntityType<any>) => {
        let existing = getOrCreateMetadataArgs(type);
        existing.name = (args || {}).name || type.name;
        nameToTypeMap.set(existing.name, type);

        if (!args) return;

        if (args.alias) {
            nameToTypeMap.set(args.alias, type);
        }

        existing.createEntity = args.createEntity || existing.createEntity;
        existing.primaryKey = args.primaryKey || existing.primaryKey;
        existing.primitives = [...existing.primitives, ...(args.primitives || [])];
        existing.references = [...existing.references, ...(args.references || [])];
        existing.collections = [...existing.collections, ...(args.collections || [])];
    };
}

export function getEntityMetadata(type: string | IEntityType<any>): EntityMetadata {
    if (typeof (type) == "string") {
        if (!nameToTypeMap.has(type)) {
            throw `no entity metadata found with name/alias '${type}'`;
        }

        type = nameToTypeMap.get(type);
    }

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
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};
            let defaults = <Primitive.ICtorArgs>{ name: key };

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            getOrCreateMetadataArgs(type.constructor).primaryKey = { ...defaults, ...args };
        };
    }

    export function Primitive(args?: Partial<Primitive.ICtorArgs>) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};
            let defaults = <Primitive.ICtorArgs>{ name: key };

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            getOrCreateMetadataArgs(type.constructor).primitives.push({ ...defaults, ...args });
        };
    }

    export function ReferenceKey(args?: Partial<Primitive.ICtorArgs>) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};
            args.index = true;

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            Primitive(args)(type, key);
        };
    }

    export function Reference(args: {
        alias?: string;
        key: string;
        name?: string;
        other: () => IEntityType<any>;
        saveable?: boolean;
        virtual?: boolean;
    }) {
        return <T>(type: Object, key: string) => {
            let defaults = <Reference.ICtorArgs>{ name: key };

            getOrCreateMetadataArgs(type.constructor).references.push({ ...defaults, ...args });
        };
    }

    export function Collection(args: {
        alias?: string;
        back: string;
        name?: string;
        other: () => IEntityType<any>;
        saveable?: boolean;
        virtual?: boolean;
    }) {
        return <T>(type: Object, key: string) => {
            let defaults = <Collection.ICtorArgs>{ name: key };

            getOrCreateMetadataArgs(type.constructor).collections.push({ ...defaults, ...args });
        };
    }
}
