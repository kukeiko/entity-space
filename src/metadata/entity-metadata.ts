import * as _ from "lodash";
import { IEntityType } from "./entity-type";
import { Collection } from "./collection";
import { Primitive } from "./primitive";
import { Property } from "./property";
import { Navigation } from "./navigation";
import { Reference } from "./reference";
import { ValueType } from "./value-type";

export class EntityMetadata {
    readonly createEntity: (item: { [key: string]: any }) => any;
    readonly entityType: IEntityType<any>;
    readonly name: string;
    readonly primaryKey: Primitive;
    readonly properties: ReadonlyArray<Property>;
    readonly primitives: ReadonlyArray<Primitive>;
    readonly navigations: ReadonlyArray<Navigation>;
    readonly references: ReadonlyArray<Reference>;
    readonly collections: ReadonlyArray<Collection>;

    private _propertiesMap: Map<string, Property>;
    private _primitivesMap: Map<string, Primitive>;
    private _navigationsMap: Map<string, Navigation>;
    private _referencesMap: Map<string, Reference>;
    private _collectionsMap: Map<string, Collection>;

    constructor(entityType: IEntityType<any>, args: EntityMetadata.ICtorArgs) {
        if (!args.primaryKey) throw `${entityType.name} has no primary key`;

        this.createEntity = args.createEntity || null;
        this.entityType = entityType;
        this.name = args.name;

        this._propertiesMap = new Map<string, Property>();
        this._primitivesMap = new Map<string, Primitive>();
        this._referencesMap = new Map<string, Reference>();
        this._collectionsMap = new Map<string, Collection>();
        this._navigationsMap = new Map<string, Navigation>();

        let aliases = new Set<string>();

        let addProperty = (p: Property) => {
            let [name, alias] = [p.name.toLowerCase(), p.alias.toLowerCase()];

            if (this._propertiesMap.has(name) || aliases.has(alias)) {
                throw `names and aliases across all properties must be unique`;
            }

            aliases.add(alias);
            this._propertiesMap.set(name, p);
        };

        let addPrimitive = (p: Primitive) => {
            this._primitivesMap.set(p.name.toLocaleLowerCase(), p);
            addProperty(p);
        };

        let addNavigation = (p: Navigation) => {
            this._navigationsMap.set(p.name.toLocaleLowerCase(), p);
            addProperty(p);
        };

        let addReference = (p: Reference) => {
            this._referencesMap.set(p.name.toLocaleLowerCase(), p);
            addNavigation(p);
        };

        let addCollection = (p: Collection) => {
            this._collectionsMap.set(p.name.toLocaleLowerCase(), p);
            addNavigation(p);
        };

        this.primaryKey = new Primitive(args.primaryKey);
        addPrimitive(this.primaryKey);

        (args.primitives || []).forEach(x => addPrimitive(new Primitive(x)));
        (args.references || []).forEach(x => addReference(new Reference(x)));
        (args.collections || []).forEach(x => addCollection(new Collection(x)));

        this.properties = Array.from(this._propertiesMap, v => v[1]).sort((a, b) => a.name < b.name ? -1 : 1);
        this.primitives = Array.from(this._primitivesMap, v => v[1]).sort((a, b) => a.name < b.name ? -1 : 1);
        this.navigations = Array.from(this._navigationsMap, v => v[1]).sort((a, b) => a.name < b.name ? -1 : 1);
        this.references = Array.from(this._referencesMap, v => v[1]).sort((a, b) => a.name < b.name ? -1 : 1);
        this.collections = Array.from(this._collectionsMap, v => v[1]).sort((a, b) => a.name < b.name ? -1 : 1);
    }

    getProperty(name: string): Property {
        return this._propertiesMap.get(name.toLocaleLowerCase()) || null;
    }

    getPrimitive(name: string): Primitive {
        return this._primitivesMap.get(name.toLocaleLowerCase()) || null;
    }

    getNavigation(name: string): Navigation {
        return this._navigationsMap.get(name.toLocaleLowerCase()) || null;
    }

    getReference(name: string): Reference {
        return this._referencesMap.get(name.toLocaleLowerCase()) || null;
    }

    getCollection(name: string): Collection {
        return this._collectionsMap.get(name.toLocaleLowerCase()) || null;
    }

    getVirtuals(): Navigation[] {
        return this.navigations.filter(nav => nav.virtual);
    }

    createCacheable(item: { [key: string]: any }): { [key: string]: any } {
        let copy: { [key: string]: any } = {};

        this._primitivesMap.forEach(p => copy[p.name] = item[p.name]);

        return copy;
    }

    fromCached(cached: { [key: string]: any }): { [key: string]: any } {
        let entity: any;

        if (this.createEntity) {
            entity = this.createEntity(cached);
        } else {
            entity = new this.entityType();

            this.primitives.forEach(p => {
                if (p.computed) return;

                if ([ValueType.Array, ValueType.Object].includes(p.valueType)) {
                    entity[p.name] = _.cloneDeep(cached[p.name]);
                } else {
                    entity[p.name] = cached[p.name];
                }
            });
        }

        return entity;
    }
}

export module EntityMetadata {
    export interface ICtorArgs {
        createEntity?: (item: { [key: string]: any }) => { [key: string]: any };
        name: string;
        primaryKey: Primitive.ICtorArgs;
        primitives?: Primitive.ICtorArgs[];
        references?: Reference.ICtorArgs[];
        collections?: Collection.ICtorArgs[];
    }
}
