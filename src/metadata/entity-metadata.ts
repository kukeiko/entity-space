import * as _ from "lodash";
import { EntityType, IEntity } from "./entity.type";
import { PropertyBase } from "./property-base";
import { Local, Primitive, DateTime, Complex, Instance } from "./locals";
import { Navigation, Children, Collection, Reference } from "./navigations";

export type AnyEntityMetadata = EntityMetadata<IEntity>;

/**
 * Contains information about properties and other metadata of an entity type.
 */
export class EntityMetadata<T extends IEntity> {
    readonly entityType: EntityType<T>;
    readonly name: string;
    readonly primaryKey: Primitive;

    // root
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

    constructor(entityType: EntityType<T>, args: EntityMetadata.CtorArgs) {
        if (!args.primaryKey) throw `${entityType.name} has no primary key`;

        this.entityType = entityType;
        this.name = args.name;

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

export module EntityMetadata {
    export interface CtorArgs {
        name: string;
        primaryKey: { name: string, args?: Primitive.CtorArgs };
        primitives?: { [name: string]: Primitive.CtorArgs };
        dates?: { [name: string]: DateTime.CtorArgs };
        complexes?: { [name: string]: Complex.CtorArgs };
        instances?: { [name: string]: Instance.CtorArgs };
        references?: { [name: string]: Reference.CtorArgs };
        children?: { [name: string]: Children.CtorArgs };
        collections?: { [name: string]: Collection.CtorArgs };
    }
}
