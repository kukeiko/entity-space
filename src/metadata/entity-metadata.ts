import * as _ from "lodash";
import { EntityType, IEntity } from "./entity.type";
import { Primitive } from "./primitive";
import { Property } from "./property";
import { NavigationType, Navigation, Children, Collection, Reference } from "./navigation";

export type AnyEntityMetadata = EntityMetadata<IEntity>;

/**
 * Contains information about properties and other metadata of an entity type.
 */
export class EntityMetadata<T extends IEntity> {
    readonly entityType: EntityType<T>;
    readonly name: string;
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

    constructor(entityType: EntityType<T>, args: EntityMetadata.CtorArgs) {
        if (!args.primaryKey) throw `${entityType.name} has no primary key`;

        this.entityType = entityType;
        this.name = args.name;

        let aliases = new Set<string>();

        let addProperty = (p: Property) => {
            let [name, alias] = [p.name.toLowerCase(), p.dtoName.toLowerCase()];

            if (this._propertiesMap.has(name) || aliases.has(alias)) {
                throw `names and aliases across all properties must be unique (type: ${entityType.name}, property: ${name}, alias: ${alias})`;
            }

            aliases.add(alias);
            this._propertiesMap.set(name, p);
            this._propertiesMap.set(alias, p);
        };

        let addPrimitive = (p: Primitive) => {
            this._primitivesMap.set(p.name.toLocaleLowerCase(), p);
            this._primitivesMap.set(p.dtoName.toLocaleLowerCase(), p);
            addProperty(p);
        };

        let addNavigation = (p: NavigationType) => {
            this._navigationsMap.set(p.name.toLocaleLowerCase(), p);
            this._navigationsMap.set(p.dtoName.toLocaleLowerCase(), p);
            addProperty(p);
        };

        let addReference = (p: Reference) => {
            this._referencesMap.set(p.name.toLocaleLowerCase(), p);
            this._referencesMap.set(p.dtoName.toLocaleLowerCase(), p);
            addNavigation(p);
        };

        let addChildren = (p: Children) => {
            this._childrenMap.set(p.name.toLocaleLowerCase(), p);
            this._childrenMap.set(p.dtoName.toLocaleLowerCase(), p);
            addNavigation(p);
        };

        let addCollection = (p: Collection) => {
            this._collectionsMap.set(p.name.toLocaleLowerCase(), p);
            this._collectionsMap.set(p.dtoName.toLocaleLowerCase(), p);
            addNavigation(p);
        };

        this.primaryKey = new Primitive(args.primaryKey);
        addPrimitive(this.primaryKey);

        (args.primitives || []).forEach(x => addPrimitive(new Primitive(x)));
        (args.references || []).forEach(x => addReference(new Reference(x)));
        (args.children || []).forEach(x => addChildren(new Children(x)));
        (args.collections || []).forEach(x => addCollection(new Collection(x)));

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

    getBackReference(children: Children): Reference {
        return this.getReference(children.backReferenceName);
    }

    /**
     * Returns a reference collection identified by its name or alias (case insensitive) or null if not found.
     */
    getCollection(nameOrAlias: string): Collection {
        return this._collectionsMap.get(nameOrAlias.toLocaleLowerCase()) || null;
    }
}

export module EntityMetadata {
    export interface CtorArgs {
        name: string;
        primaryKey: Primitive.CtorArgs;
        primitives?: Primitive.CtorArgs[];
        references?: Reference.CtorArgs[];
        children?: Children.CtorArgs[];
        collections?: Collection.CtorArgs[];
    }
}
