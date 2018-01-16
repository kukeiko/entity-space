import * as _ from "lodash";
import { EntityType, IEntity, AnyEntityType } from "./entity.type";
import { Local, Primitive, DateTime, Complex, Instance } from "./locals";
import { Navigation, Children, Collection, Reference } from "./navigations";

export type AnyClassMetadata = ClassMetadata<IEntity>;
export type EntitySorter = (a: IEntity, b: IEntity) => number;

/**
 * All supported types of properties.
 */
export type Property =
    Local
    | Navigation;

export module Property {
    export type Type = Property["type"];
    export type Family = Property["family"];
    export type TypeOrFamily = Type | Family;
}

export type ClassProperties = Readonly<{
    all: ReadonlyArray<Property>;
    children: ReadonlyArray<Children>;
    collections: ReadonlyArray<Collection>;
    complexes: ReadonlyArray<Complex>;
    dates: ReadonlyArray<DateTime>;
    instances: ReadonlyArray<Instance>;
    locals: ReadonlyArray<Local>;
    navigations: ReadonlyArray<Navigation>;
    primitives: ReadonlyArray<Primitive>;
    references: ReadonlyArray<Reference>;
}>;

/**
 * Contains information about properties and other metadata of an entity type.
 */
export class ClassMetadata<T extends IEntity> {
    readonly entityType: EntityType<T>;
    readonly primaryKey: Primitive;
    readonly sorter: EntitySorter;
    private _properties: Readonly<ClassProperties>;

    get properties(): Readonly<ClassProperties> {
        return this._properties;
    }

    private _byName = new Map<string, Property>();
    private _byDtoName = new Map<string, Property>();

    constructor(entityType: EntityType<T>, args: ClassMetadata.CtorArgs) {
        if (!args.primaryKey) throw `${entityType.name} has no primary key`;

        this.entityType = entityType;
        this.sorter = args.sorter || null;
        this.primaryKey = new Primitive(args.primaryKey.name, args.primaryKey.args || {});

        let properties: Property[] = [];
        Object.keys(args.primitives || {}).forEach(k => properties.push(new Primitive(k, args.primitives[k] || {})));
        Object.keys(args.dates || {}).forEach(k => properties.push(new DateTime(k, args.dates[k] || {})));
        Object.keys(args.complexes || {}).forEach(k => properties.push(new Complex(k, args.complexes[k] || {})));
        Object.keys(args.instances || {}).forEach(k => properties.push(new Instance(k, args.instances[k] || {})));
        Object.keys(args.references || {}).forEach(k => properties.push(new Reference(k, args.references[k])));
        Object.keys(args.children || {}).forEach(k => properties.push(new Children(k, args.children[k])));
        Object.keys(args.collections || {}).forEach(k => properties.push(new Collection(k, args.collections[k])));
        this.addProperties(properties);
    }

    private _addPropertyNoRebuild(p: Property, overwrite = false): void {
        let [name, dtoName] = [p.name, p.dtoName];

        if (!overwrite) {
            if (this._byName.has(name)) {
                throw new Error(`${this.entityType.name} already has a property named ${name}`);
            } else if (this._byDtoName.has(name)) {
                throw new Error(`${this.entityType.name} already has a property dto-named ${name}`);
            }
        }

        this._byName.set(name, p);
        this._byDtoName.set(dtoName, p);
    }

    private _rebuildPropertyIndex(): void {
        let properties = Array.from(this._byName.values())
            .concat([this.primaryKey])
            .sort((a, b) => a.name.localeCompare(b.name));

        let all: Property[] = [];
        let map = new Map<Property.TypeOrFamily, Property[]>([
            ["children", []],
            ["collection", []],
            ["complex", []],
            ["date", []],
            ["instance", []],
            ["local", []],
            ["navigation", []],
            ["primitive", []],
            ["reference", []]
        ]);

        for (let i = 0; i < properties.length; ++i) {
            let p = properties[i];
            all.push(p);
            map.get(p.family).push(p);
            map.get(p.type).push(p);
        }

        this._properties = Object.freeze({
            all: Object.freeze(all),
            children: Object.freeze(map.get("children")),
            collections: Object.freeze(map.get("collection")),
            complexes: Object.freeze(map.get("complex")),
            dates: Object.freeze(map.get("date")),
            instances: Object.freeze(map.get("instance")),
            locals: Object.freeze(map.get("local")),
            navigations: Object.freeze(map.get("navigation")),
            primitives: Object.freeze(map.get("primitive")),
            references: Object.freeze(map.get("reference"))
        } as ClassProperties);
    }

    addProperty(property: Property, overwrite = false): void {
        this._addPropertyNoRebuild(property, overwrite);
        this._rebuildPropertyIndex();
    }

    addProperties(properties: Property[], overwrite = false): void {
        for (let i = 0; i < properties.length; ++i) {
            this._addPropertyNoRebuild(properties[i], overwrite);
        }

        this._rebuildPropertyIndex();
    }

    /**
     * Returns a property identified by its name or dtoName or null if not found.
     */
    getProperty(name: string, expected?: Property.Type): Property {
        let p = this._byName.get(name);

        if (!p) {
            throw new Error(`${this.entityType.name} does not have a property named ${name}`);
        } else if (expected && p.type !== expected) {
            throw new Error(`${this.entityType.name}.${name} is not of the expected type ${expected}`);
        }

        return p;
    }

    /**
     * Returns a primitive identified by its name or dtoName or null if not found.
     */
    getLocal(name: string, expected?: Local.Type): Local {
        let p = this.getProperty(name, expected);

        if (p.family != "local") {
            throw new Error(`${this.entityType.name}.${name} is not a local property`);
        }

        return p;
    }

    /**
     * Returns a navigation identified by its name or dtoName or null if not found.
     */
    getNavigation(name: string, expected?: Navigation.Type): Navigation {
        let p = this.getProperty(name, expected);

        if (p.family != "navigation") {
            throw new Error(`${this.entityType.name}.${name} is not a navigation property`);
        }

        return p;
    }

    /**
     * Returns a primitive identified by its name or dtoName or null if not found.
     */
    getPrimitive(name: string): Primitive {
        return this.getProperty(name, "primitive") as Primitive;
    }

    /**
     * Returns a primitive identified by its name or dtoName or null if not found.
     */
    getDate(name: string): DateTime {
        return this.getProperty(name, "date") as DateTime;
    }

    /**
     * Returns a primitive identified by its name or dtoName or null if not found.
     */
    getComplex(name: string): Complex {
        return this.getProperty(name, "complex") as Complex;
    }

    /**
     * Returns a primitive identified by its name or dtoName or null if not found.
     */
    getInstance(name: string): Instance {
        return this.getProperty(name, "instance") as Instance;
    }

    /**
     * Returns a reference identified by its name or dtoName or null if not found.
     */
    getReference(name: string): Reference {
        return this.getProperty(name, "reference") as Reference;
    }

    /**
     * Returns a child collection identified by its name or dtoName or null if not found.
     */
    getChildren(name: string): Children {
        return this.getProperty(name, "children") as Children;
    }

    /**
     * Returns a reference collection identified by its name or dtoName or null if not found.
     */
    getCollection(name: string): Collection {
        return this.getProperty(name, "collection") as Collection;
    }

    getBackReference(children: Children): Reference {
        return this.getReference(children.backReferenceName);
    }
}

export module ClassMetadata {
    export interface CtorArgs {
        primaryKey: { name: string, args?: Primitive.CtorArgs };
        primitives?: { [name: string]: Primitive.CtorArgs };
        dates?: { [name: string]: DateTime.CtorArgs };
        complexes?: { [name: string]: Complex.CtorArgs };
        instances?: { [name: string]: Instance.CtorArgs };
        references?: { [name: string]: Reference.CtorArgs };
        children?: { [name: string]: Children.CtorArgs };
        collections?: { [name: string]: Collection.CtorArgs };
        sorter?: (a: IEntity, b: IEntity) => number;
    }
}

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

export module Property {
    export function Id(args?: Primitive.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            getOrCreateMetadataArgs(type.constructor).primaryKey = { name: key, args: args };
        };
    }

    export function Primitive(args?: Primitive.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            getOrCreateMetadataArgs(type.constructor).primitives[key] = args;
        };
    }

    export function Key(args?: Primitive.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};
            args.index = true;

            Property.Primitive(args)(type, key, descriptor);
        };
    }

    export function Date(args?: DateTime.CtorArgs) {
        return (type: Object, key: string, descriptor?: TypedPropertyDescriptor<Date>) => {
            getOrCreateMetadataArgs(type.constructor).dates[key] = args;
        };
    }

    export function Complex(args?: Complex.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            getOrCreateMetadataArgs(type.constructor).complexes[key] = args;
        };
    }

    export function Instance(args?: Instance.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            args = args || {};

            if (descriptor && !descriptor.set) {
                args.computed = true;
            }

            getOrCreateMetadataArgs(type.constructor).instances[key] = args;
        };
    }

    export function Reference(args: Reference.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            if (descriptor && !descriptor.set) {
                throw new Error(`a reference can not be readonly (${key} @ ${type.constructor.name})`);
            }

            getOrCreateMetadataArgs(type.constructor).references[key] = args;
        };
    }

    export function Children(args: Children.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            if (descriptor && !descriptor.set) {
                throw new Error(`a child array can not be readonly (${key} @ ${type.constructor.name})`);
            }

            getOrCreateMetadataArgs(type.constructor).children[key] = args;
        };
    }

    export function Collection(args: Collection.CtorArgs) {
        return <T>(type: Object, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
            if (descriptor && !descriptor.set) {
                throw new Error(`a reference array can not be readonly (${key} @ ${type.constructor.name})`);
            }

            getOrCreateMetadataArgs(type.constructor).collections[key] = args;
        };
    }
}
