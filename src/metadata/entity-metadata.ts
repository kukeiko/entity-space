import * as _ from "lodash";
import { IStringIndexable } from "../util";
import { IEntityType, IEntity } from "./entity-type";
import { Primitive } from "./primitive";
import { Property } from "./property";
import { NavigationType, Navigation, Children, Collection, Reference } from "./navigation";

/**
 * Contains information about properties and other metadata of an entity.
 */
export class EntityMetadata<T extends IEntity> {
    readonly factory: (item: IStringIndexable) => T;
    readonly entityType: IEntityType<T>;
    readonly name: string;
    readonly alias: string;
    readonly abstract: boolean;
    readonly primaryKey: Primitive;
    readonly properties: ReadonlyArray<Property>;
    readonly primitives: ReadonlyArray<Primitive>;
    readonly navigations: ReadonlyArray<NavigationType>;
    readonly references: ReadonlyArray<Reference>;
    readonly children: ReadonlyArray<Children>;
    readonly collections: ReadonlyArray<Collection>;

    private _propertiesMap = new Map<string, Property>();
    private _primitivesMap = new Map<string, Primitive>();
    private _navigationsMap = new Map<string, NavigationType>();
    private _referencesMap = new Map<string, Reference>();
    private _childrenMap = new Map<string, Children>();
    private _collectionsMap = new Map<string, Collection>();
    private _refKeysMap = new Map<string, Primitive>();

    constructor(entityType: IEntityType<T>, args: EntityMetadata.ICtorArgs<T>) {
        if (!args.primaryKey) throw `${entityType.name} has no primary key`;

        this.factory = args.factory || null;
        this.entityType = entityType;
        this.name = args.name;
        this.alias = args.alias || this.name;
        this.abstract = !!args.abstract;

        let aliases = new Set<string>();

        let addProperty = (p: Property) => {
            let [name, alias] = [p.name.toLowerCase(), p.alias.toLowerCase()];

            if (this._propertiesMap.has(name) || aliases.has(alias)) {
                throw `names and aliases across all properties must be unique (type: ${entityType.name}, property: ${name}, alias: ${alias})`;
            }

            aliases.add(alias);
            this._propertiesMap.set(name, p);
            this._propertiesMap.set(alias, p);
        };

        let addPrimitive = (p: Primitive) => {
            this._primitivesMap.set(p.name.toLocaleLowerCase(), p);
            this._primitivesMap.set(p.alias.toLocaleLowerCase(), p);
            addProperty(p);
        };

        let addNavigation = (p: NavigationType) => {
            this._navigationsMap.set(p.name.toLocaleLowerCase(), p);
            this._navigationsMap.set(p.alias.toLocaleLowerCase(), p);
            addProperty(p);
        };

        let addReference = (p: Reference) => {
            this._referencesMap.set(p.name.toLocaleLowerCase(), p);
            this._referencesMap.set(p.alias.toLocaleLowerCase(), p);
            addNavigation(p);
        };

        let addChildren = (p: Children) => {
            this._childrenMap.set(p.name.toLocaleLowerCase(), p);
            this._childrenMap.set(p.alias.toLocaleLowerCase(), p);
            addNavigation(p);
        };

        let addCollection = (p: Collection) => {
            this._collectionsMap.set(p.name.toLocaleLowerCase(), p);
            this._collectionsMap.set(p.alias.toLocaleLowerCase(), p);
            addNavigation(p);
        };

        this.primaryKey = new Primitive(args.primaryKey);
        addPrimitive(this.primaryKey);

        (args.primitives || []).forEach(x => addPrimitive(new Primitive(x)));
        (args.references || []).forEach(x => addReference(new Reference(x)));
        (args.children || []).forEach(x => addChildren(new Children(x)));
        (args.collections || []).forEach(x => addCollection(new Collection(x)));

        this._referencesMap.forEach(ref => {
            let refKeyProperty = this._primitivesMap.get(ref.keyName.toLocaleLowerCase());
            if (refKeyProperty) {
                this._refKeysMap.set(refKeyProperty.name.toLocaleLowerCase(), refKeyProperty);
            }
        });

        this.properties = _.uniq(Array.from(this._propertiesMap.values())).sort((a, b) => a.name < b.name ? -1 : 1);
        this.primitives = _.uniq(Array.from(this._primitivesMap.values())).sort((a, b) => a.name < b.name ? -1 : 1);
        this.navigations = _.uniq(Array.from(this._navigationsMap.values())).sort((a, b) => a.name < b.name ? -1 : 1);
        this.references = _.uniq(Array.from(this._referencesMap.values())).sort((a, b) => a.name < b.name ? -1 : 1);
        this.children = _.uniq(Array.from(this._childrenMap.values())).sort((a, b) => a.name < b.name ? -1 : 1);
        this.collections = _.uniq(Array.from(this._collectionsMap.values())).sort((a, b) => a.name < b.name ? -1 : 1);
    }

    /**
     * Returns a property identified by its name or alias (case insensitive) or null if not found.
     */
    getProperty(nameOrAlias: string): Property {
        return this._propertiesMap.get(nameOrAlias.toLocaleLowerCase()) || null;
    }

    /**
     * Returns a primitive identified by its name or alias (case insensitive) or null if not found.
     */
    getPrimitive(nameOrAlias: string): Primitive {
        return this._primitivesMap.get(nameOrAlias.toLocaleLowerCase()) || null;
    }

    /**
     * Returns a navigation identified by its name or alias (case insensitive) or null if not found.
     */
    getNavigation(nameOrAlias: string): Navigation {
        return this._navigationsMap.get(nameOrAlias.toLocaleLowerCase()) || null;
    }

    /**
     * Returns a reference identified by its name or alias (case insensitive) or null if not found.
     */
    getReference(nameOrAlias: string): Reference {
        return this._referencesMap.get(nameOrAlias.toLocaleLowerCase()) || null;
    }

    /**
     * Returns a child collection identified by its name or alias (case insensitive) or null if not found.
     */
    getChildren(nameOrAlias: string): Children {
        return this._childrenMap.get(nameOrAlias.toLocaleLowerCase()) || null;
    }

    /**
     * Returns a reference collection identified by its name or alias (case insensitive) or null if not found.
     */
    getCollection(nameOrAlias: string): Collection {
        return this._collectionsMap.get(nameOrAlias.toLocaleLowerCase()) || null;
    }

    /**
     * Returns all navigations marked as being virtual.
     */
    getVirtuals(): Navigation[] {
        return this.navigations.filter(nav => nav.virtual);
    }
}

export module EntityMetadata {
    export interface ICtorArgs<T extends IEntity> {
        alias?: string;
        factory?: (item: { [key: string]: any }) => T;
        name: string;
        primaryKey: Primitive.ICtorArgs;
        primitives?: Primitive.ICtorArgs[];
        references?: Reference.ICtorArgs[];
        children?: Children.ICtorArgs[];
        collections?: Collection.ICtorArgs[];
        abstract?: boolean;
    }
}
