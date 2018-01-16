import * as _ from "lodash";
import { EntityType, IEntity, AnyEntityType } from "./entity.type";
import { PropertyBase } from "./property-base";
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

/**
 * Contains information about properties and other metadata of an entity type.
 */
export class ClassMetadata<T extends IEntity> {
    readonly entityType: EntityType<T>;
    readonly primaryKey: Primitive;
    readonly sorter: EntitySorter;

    // all
    private _properties = new Map<string, PropertyBase>();
    readonly properties: ReadonlyArray<PropertyBase>;

    // locals
    private _locals = new Map<string, Local>();
    private _primitives = new Map<string, Primitive>();
    private _dates = new Map<string, DateTime>();
    private _complexes = new Map<string, Complex>();
    private _instances = new Map<string, Instance>();

    readonly locals: ReadonlyArray<Local>;
    readonly primitives: ReadonlyArray<Primitive>;
    readonly dates: ReadonlyArray<DateTime>;
    readonly complexes: ReadonlyArray<Complex>;
    readonly instances: ReadonlyArray<Instance>;

    // navigations
    private _navigations = new Map<string, Navigation>();
    private _references = new Map<string, Reference>();
    private _children = new Map<string, Children>();
    private _collections = new Map<string, Collection>();

    readonly navigations: ReadonlyArray<Navigation>;
    readonly references: ReadonlyArray<Reference>;
    readonly children: ReadonlyArray<Children>;
    readonly collections: ReadonlyArray<Collection>;

    constructor(entityType: EntityType<T>, args: ClassMetadata.CtorArgs) {
        if (!args.primaryKey) throw `${entityType.name} has no primary key`;

        this.entityType = entityType;
        this.sorter = args.sorter || null;

        let dtoNames = new Set<string>();

        let addProperty = (p: PropertyBase) => {
            let [name, dtoName] = [p.name, p.dtoName];

            if (this._properties.has(name) || dtoNames.has(dtoName)) {
                throw `identifiers must be unique across all properties (type: ${entityType.name}, name: ${name}, dtoName: ${dtoName})`;
            }

            dtoNames.add(dtoName);
            this._properties.set(name, p);
            this._properties.set(dtoName, p);
        };

        let addLocal = (p: Local) => {
            this._locals.set(p.name, p);
            this._locals.set(p.dtoName, p);
            addProperty(p);
        };

        let addPrimitive = (p: Primitive) => {
            this._primitives.set(p.name, p);
            this._primitives.set(p.dtoName, p);
            addLocal(p);
        };

        let addDate = (p: DateTime) => {
            this._dates.set(p.name, p);
            this._dates.set(p.dtoName, p);
            addLocal(p);
        };

        let addComplex = (p: Complex) => {
            this._complexes.set(p.name, p);
            this._complexes.set(p.dtoName, p);
            addLocal(p);
        };

        let addInstance = (p: Instance) => {
            this._instances.set(p.name, p);
            this._instances.set(p.dtoName, p);
            addLocal(p);
        };

        let addNavigation = (p: Navigation) => {
            this._navigations.set(p.name, p);
            this._navigations.set(p.dtoName, p);
            addProperty(p);
        };

        let addReference = (p: Reference) => {
            this._references.set(p.name, p);
            this._references.set(p.dtoName, p);
            addNavigation(p);
        };

        let addChildren = (p: Children) => {
            this._children.set(p.name, p);
            this._children.set(p.dtoName, p);
            addNavigation(p);
        };

        let addCollection = (p: Collection) => {
            this._collections.set(p.name, p);
            this._collections.set(p.dtoName, p);
            addNavigation(p);
        };

        this.primaryKey = new Primitive(args.primaryKey.name, args.primaryKey.args || {});
        addPrimitive(this.primaryKey);

        Object.keys(args.primitives || {}).forEach(k => addPrimitive(new Primitive(k, args.primitives[k] || {})));
        Object.keys(args.dates || {}).forEach(k => addDate(new DateTime(k, args.dates[k] || {})));
        Object.keys(args.complexes || {}).forEach(k => addComplex(new Complex(k, args.complexes[k] || {})));
        Object.keys(args.instances || {}).forEach(k => addInstance(new Instance(k, args.instances[k] || {})));
        Object.keys(args.references || {}).forEach(k => addReference(new Reference(k, args.references[k])));
        Object.keys(args.children || {}).forEach(k => addChildren(new Children(k, args.children[k])));
        Object.keys(args.collections || {}).forEach(k => addCollection(new Collection(k, args.collections[k])));

        this.properties = Object.freeze(_.uniq(Array.from(this._properties.values())).sort((a, b) => a.name < b.name ? -1 : 1));
        this.locals = Object.freeze(_.uniq(Array.from(this._locals.values())).sort((a, b) => a.name < b.name ? -1 : 1));
        this.primitives = Object.freeze(_.uniq(Array.from(this._primitives.values())).sort((a, b) => a.name < b.name ? -1 : 1));
        this.dates = Object.freeze(_.uniq(Array.from(this._dates.values())).sort((a, b) => a.name < b.name ? -1 : 1));
        this.complexes = Object.freeze(_.uniq(Array.from(this._complexes.values())).sort((a, b) => a.name < b.name ? -1 : 1));
        this.instances = Object.freeze(_.uniq(Array.from(this._instances.values())).sort((a, b) => a.name < b.name ? -1 : 1));
        this.navigations = Object.freeze(_.uniq(Array.from(this._navigations.values())).sort((a, b) => a.name < b.name ? -1 : 1));
        this.references = Object.freeze(_.uniq(Array.from(this._references.values())).sort((a, b) => a.name < b.name ? -1 : 1));
        this.children = Object.freeze(_.uniq(Array.from(this._children.values())).sort((a, b) => a.name < b.name ? -1 : 1));
        this.collections = Object.freeze(_.uniq(Array.from(this._collections.values())).sort((a, b) => a.name < b.name ? -1 : 1));
    }

    /**
     * Returns a property identified by its name or dtoName or null if not found.
     */
    getProperty(name: string): PropertyBase {
        return this._properties.get(name) || null;
    }

    /**
     * Returns a primitive identified by its name or dtoName or null if not found.
     */
    getLocal(name: string): Local {
        return this._locals.get(name) || null;
    }

    /**
     * Returns a primitive identified by its name or dtoName or null if not found.
     */
    getPrimitive(name: string): Primitive {
        return this._primitives.get(name) || null;
    }

    /**
     * Returns a primitive identified by its name or dtoName or null if not found.
     */
    getDate(name: string): DateTime {
        return this._dates.get(name) || null;
    }

    /**
     * Returns a primitive identified by its name or dtoName or null if not found.
     */
    getComplex(name: string): Complex {
        return this._complexes.get(name) || null;
    }

    /**
     * Returns a primitive identified by its name or dtoName or null if not found.
     */
    getInstance(name: string): Instance {
        return this._instances.get(name) || null;
    }

    /**
     * Returns a navigation identified by its name or dtoName or null if not found.
     */
    // todo: maybe return NavigationType instead
    getNavigation(name: string): Navigation {
        return this._navigations.get(name) || null;
    }

    /**
     * Returns a reference identified by its name or dtoName or null if not found.
     */
    getReference(name: string): Reference {
        return this._references.get(name) || null;
    }

    /**
     * Returns a child collection identified by its name or dtoName or null if not found.
     */
    getChildren(name: string): Children {
        return this._children.get(name) || null;
    }

    getBackReference(children: Children): Reference {
        return this.getReference(children.backReferenceName);
    }

    /**
     * Returns a reference collection identified by its name or dtoName or null if not found.
     */
    getCollection(name: string): Collection {
        return this._collections.get(name) || null;
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
