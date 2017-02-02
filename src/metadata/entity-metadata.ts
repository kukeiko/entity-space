import * as _ from "lodash";
import { IStringIndexable } from "../util";
import { IEntityType, IEntity } from "../entity-type";
import { getEntityMetadata } from "./entity-decorator";
import { Primitive } from "./primitive";
import { Property } from "./property";
import { Navigation, Children, Collection, Reference } from "./navigation";
import { ValueType } from "./value-type";

/**
 * Contains information about properties of an entity.
 */
export class EntityMetadata<T extends IEntity> {
    readonly createEntity: (item: IStringIndexable) => T;
    readonly entityType: IEntityType<T>;
    readonly name: string;
    readonly alias: string;
    readonly primaryKey: Primitive;
    readonly properties: ReadonlyArray<Property>;
    readonly primitives: ReadonlyArray<Primitive>;
    readonly navigations: ReadonlyArray<Navigation>;
    readonly references: ReadonlyArray<Reference>;
    readonly children: ReadonlyArray<Children>;
    readonly collections: ReadonlyArray<Collection>;

    private _propertiesMap = new Map<string, Property>();
    private _primitivesMap = new Map<string, Primitive>();
    private _navigationsMap = new Map<string, Navigation>();
    private _referencesMap = new Map<string, Reference>();
    private _childrenMap = new Map<string, Children>();
    private _collectionsMap = new Map<string, Collection>();
    private _refKeysMap = new Map<string, Primitive>();

    constructor(entityType: IEntityType<T>, args: EntityMetadata.ICtorArgs<T>) {
        if (!args.primaryKey) throw `${entityType.name} has no primary key`;

        this.createEntity = args.createEntity || null;
        this.entityType = entityType;
        this.name = args.name;
        this.alias = args.alias || this.name;

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

        let addNavigation = (p: Navigation) => {
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

    createCacheable(item: T): IStringIndexable {
        let copy: IStringIndexable = {};

        // todo: this doesn't seem like it is enough
        this._primitivesMap.forEach(p => copy[p.name] = item[p.name]);

        return copy;
    }

    createSaveable(entity: IEntity, useAlias?: boolean): IStringIndexable {
        let saveable: IStringIndexable = {};

        this.properties.filter(p => p.saveable).forEach(p => {
            let name = useAlias ? p.alias : p.name;

            if (entity[p.name] == undefined) return;

            if (p instanceof Children) {
                if (entity[p.name] instanceof Array) {
                    saveable[name] = (entity[p.name] as Object[]).map(x => this.createSaveable(x, useAlias));
                }
            } else if (p instanceof Reference) {
                if (entity[p.name] instanceof Object) {
                    saveable[name] = this.createSaveable(entity[p.name], useAlias);
                }
            } else {
                if (p.valueType == ValueType.Date) {
                    saveable[name] = (entity[p.name] as Date).toJSON();
                } else {
                    saveable[name] = entity[p.name];
                }
            }
        });

        this.references.forEach(ref => {
            if (!(entity[ref.name] instanceof Object)) return;
            let refKey = this._refKeysMap.get(ref.keyName.toLocaleLowerCase());
            if (!refKey || !refKey.saveable) return;
            let refKeyName = useAlias ? refKey.alias : refKey.name;
            let refKeyValue = entity[ref.name][getEntityMetadata(ref.otherType).primaryKey.name];
            saveable[refKeyName] = refKeyValue;
        });

        return saveable;
    }

    fromAliased(aliased: IStringIndexable): T {
        let entity = new this.entityType();

        this.properties.forEach(p => {
            if (p instanceof Children) {
                if (aliased[p.alias] instanceof Array) {
                    let otherMetadata = getEntityMetadata(p.otherType);
                    entity[p.name] = (aliased[p.alias] as Object[]).map(x => otherMetadata.fromAliased(x));
                }
            } else if (p instanceof Reference) {
                if (aliased[p.alias] instanceof Object) {
                    let otherMetadata = getEntityMetadata(p.otherType);
                    entity[p.name] = otherMetadata.fromAliased(aliased[p.alias]);
                }
            } else if (p instanceof Primitive && !p.computed) {
                if (p.valueType == ValueType.Date) {
                    entity[p.name] = aliased[p.alias] ? new Date(aliased[p.alias]) : null;
                } else if ([ValueType.Array, ValueType.Object].includes(p.valueType)) {
                    entity[p.name] = _.cloneDeep(aliased[p.alias]);
                } else {
                    entity[p.name] = aliased[p.alias];
                }
            }
        });

        return entity;
    }

    fromCached(cached: IStringIndexable): T {
        let entity: T;

        if (this.createEntity) {
            entity = this.createEntity(cached);
        } else {
            entity = new this.entityType();

            this.primitives.forEach(p => {
                if (p.computed) return;

                if (p.map) {
                    entity[p.name] = p.map(cached[p.name]);
                } else if ([ValueType.Array, ValueType.Object].includes(p.valueType)) {
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
    export interface ICtorArgs<T extends IEntity> {
        alias?: string;
        createEntity?: (item: { [key: string]: any }) => T;
        name: string;
        primaryKey: Primitive.ICtorArgs;
        primitives?: Primitive.ICtorArgs[];
        references?: Reference.ICtorArgs[];
        children?: Children.ICtorArgs[];
        collections?: Collection.ICtorArgs[];
    }
}
