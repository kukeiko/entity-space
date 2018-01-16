import { AnyEntityType, EntityType, IEntity } from "./entity.type";
import { AnyClassMetadata, ClassMetadata } from "./class-metadata";
import { Children, Collection, Reference } from "./navigations";
import { Primitive, DateTime, Complex, Instance } from "./locals";

let typeToMetadata = new Map<AnyEntityType, AnyClassMetadata>();
let typeToMetadataArgs = new Map<AnyEntityType, Partial<ClassMetadata.CtorArgs>>();

function getOrCreateMetadataArgs(type: any): Partial<ClassMetadata.CtorArgs> {
    if (!typeToMetadataArgs.has(type)) {
        let args: Partial<ClassMetadata.CtorArgs> = {
            primitives: {},
            dates: {},
            complexes: {},
            instances: {},
            references: {},
            children: {},
            collections: {}
        };

        typeToMetadataArgs.set(type, args as ClassMetadata.CtorArgs);
    }

    return typeToMetadataArgs.get(type);
}

/**
 * Define a class as a type of entity, describing all its cacheable, loadable and saveable properties.
 *
 * Property metadata can be defined by:
 * * using property decorators (e.g. @Property.PrimaryKey(), @Property.Reference())
 * * passing constructor arguments via this decorator
 *
 * Each entity type must have a primary key defined, and names/aliases must be unique across all properties.
 */
export function EntityClass(args?: Partial<ClassMetadata.CtorArgs>) {
    return (type: EntityType<any>) => {
        let existing = getOrCreateMetadataArgs(type);
        existing.sorter = (args || {}).sorter || null;

        if (!args) return;

        existing.primaryKey = args.primaryKey || existing.primaryKey;
        existing.primitives = { ...existing.primitives, ...(args.primitives || {}) };
        existing.dates = { ...existing.dates, ...(args.dates || {}) };
        existing.complexes = { ...existing.complexes, ...(args.complexes || {}) };
        existing.instances = { ...existing.instances, ...(args.instances || {}) };
        existing.references = { ...existing.references, ...(args.references || {}) };
        existing.children = { ...existing.children, ...(args.children || {}) };
        existing.collections = { ...existing.collections, ...(args.collections || {}) };
    };
}

export function getMetadata<T extends IEntity>(type: EntityType<T>): ClassMetadata<T> {
    if (!typeToMetadata.has(type)) {
        if (!typeToMetadataArgs.has(type)) {
            throw new Error(`no entity class metadata found for type ${type.name}`);
        }

        typeToMetadata.set(type, new ClassMetadata(type as EntityType<T>, (typeToMetadataArgs.get(type) as ClassMetadata.CtorArgs)));
    }

    return typeToMetadata.get(type) as ClassMetadata<T>;
}

export function isEntityClass(type: any): boolean {
    return typeToMetadata.has(type);
}

export class Property {
    static Id(args?: Primitive.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            getOrCreateMetadataArgs(type.constructor).primaryKey = { name: key, args: args };
        };
    }

    static Primitive(args?: Primitive.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            getOrCreateMetadataArgs(type.constructor).primitives[key] = args;
        };
    }

    static Key(args?: Primitive.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};
            args.index = true;

            Property.Primitive(args)(type, key, descriptor);
        };
    }

    static Date(args?: DateTime.CtorArgs) {
        return (type: Object, key: string, descriptor?: TypedPropertyDescriptor<Date>) => {
            getOrCreateMetadataArgs(type.constructor).dates[key] = args;
        };
    }

    static Complex(args?: Complex.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            getOrCreateMetadataArgs(type.constructor).complexes[key] = args;
        };
    }

    static Instance(args?: Instance.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            getOrCreateMetadataArgs(type.constructor).instances[key] = args;
        };
    }

    static Reference(args: Reference.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            if (descriptor && !descriptor.set) {
                throw new Error(`a reference can not be readonly (${key} @ ${type.constructor.name})`);
            }

            getOrCreateMetadataArgs(type.constructor).references[key] = args;
        };
    }

    static Children(args: Children.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            if (descriptor && !descriptor.set) {
                throw new Error(`a child array can not be readonly (${key} @ ${type.constructor.name})`);
            }

            getOrCreateMetadataArgs(type.constructor).children[key] = args;
        };
    }

    static Collection(args: Collection.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            if (descriptor && !descriptor.set) {
                throw new Error(`a reference array can not be readonly (${key} @ ${type.constructor.name})`);
            }

            getOrCreateMetadataArgs(type.constructor).collections[key] = args;
        };
    }
}
