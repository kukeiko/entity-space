import { Collection } from "./collection";
import { Primitive } from "./primitive";
import { Property } from "./property";
import { Navigation } from "./navigation";
import { Reference } from "./reference";
import { ValueType } from "./value-type";

export class EntityMetadata {
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

    constructor(args: EntityMetadata.ICtorArgs) {
        this.name = args.name;
        this.primaryKey = new Primitive(args.primaryKey);

        this._propertiesMap = new Map<string, Property>();
        this._primitivesMap = new Map<string, Primitive>();
        this._referencesMap = new Map<string, Reference>();
        this._collectionsMap = new Map<string, Collection>();
        this._navigationsMap = new Map<string, Navigation>();

        let addProperty = (p: Property) => {
            this._propertiesMap.set(p.name.toLocaleLowerCase(), p);
        }

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

        (args.primitives || []).forEach(x => addPrimitive(new Primitive(x)));
        (args.references || []).forEach(x => addReference(new Reference(x)));
        (args.collections || []).forEach(x => addCollection(new Collection(x)));

        this.properties = this._propertiesMap._toArray().sort((a, b) => a.name < b.name ? -1 : 1);
        this.primitives = this._primitivesMap._toArray().sort((a, b) => a.name < b.name ? -1 : 1);
        this.navigations = this._navigationsMap._toArray().sort((a, b) => a.name < b.name ? -1 : 1);
        this.references = this._referencesMap._toArray().sort((a, b) => a.name < b.name ? -1 : 1);
        this.collections = this._collectionsMap._toArray().sort((a, b) => a.name < b.name ? -1 : 1);
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

    createCacheable(args: {
        item: { [key: string]: any };
        isDtoFormat?: boolean;
    }): { [key: string]: any } {
        let copy: { [key: string]: any } = {};
        let item = args.item;

        copy[this.primaryKey.name] = item[args.isDtoFormat ? this.primaryKey.dtoName : this.primaryKey.name];
        this._primitivesMap.forEach(p => copy[p.name] = item[args.isDtoFormat ? p.dtoName : p.name]);

        return copy;
    }
}

export module EntityMetadata {
    export interface ICtorArgs {
        name: string;
        primaryKey: Primitive.ICtorArgs;
        primitives?: Primitive.ICtorArgs[];
        references?: Reference.ICtorArgs[];
        collections?: Collection.ICtorArgs[];
    }
}
