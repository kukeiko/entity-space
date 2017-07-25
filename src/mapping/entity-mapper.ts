import * as _ from "lodash";
import { Indexable } from "../util";
import { Expansion } from "../elements";
import {
    getEntityMetadata, EntityMetadata, IEntity, IEntityClass,
    Primitive, Children, Collection, NavigationType, ValueType, Reference
} from "../metadata";
import { MappingCompiler, CopyPrimitivesFunction } from "./mapping-compiler";

export class EntityMapper {
    private static _compiler = new MappingCompiler();
    private static _dtoToEntity = new Map<IEntityClass<any>, CopyPrimitivesFunction>();
    private static _entityToEntity = new Map<IEntityClass<any>, CopyPrimitivesFunction>();

    static dtosToEntities<T extends IEntity>(dtos: Indexable[], metadata: EntityMetadata<T>): T[] {
        let type = metadata.entityType;
        let fn = this._dtoToEntity.get(type);

        if (!fn) {
            fn = this._compiler.compileCopyPrimitives({
                fromDto: true,
                metadata: metadata,
                predicate: p => !p.computed
            });

            this._dtoToEntity.set(type, fn);
        }

        let to: T[] = dtos.map(() => new type());
        fn(dtos, to);

        return to;
    }

    // todo: maybe rename, since it doesn't really require the items in the input array to be entities
    static entitiesToEntities<T extends IEntity>(entities: T[], metadata: EntityMetadata<T>): T[] {
        let type = metadata.entityType;
        let fn = this._entityToEntity.get(type);

        if (!fn) {
            fn = this._compiler.compileCopyPrimitives({
                metadata: metadata,
                predicate: p => !p.computed
            });

            this._entityToEntity.set(type, fn);
        }

        let to: T[] = entities.map(() => new type());
        fn(entities, to);

        return to;
    }

    createEntity<T extends IEntity>(args: {
        entityType: IEntityClass<T>;
        expansions?: Expansion[];
        from?: Indexable;
        fromDto?: boolean;
    }): T {
        let metadata = getEntityMetadata(args.entityType);
        let entity = new args.entityType();

        if (args.from) {
            this.copyPrimitives({
                to: entity,
                from: args.from,
                fromDto: args.fromDto,
                metadata: metadata
            });

            if (args.expansions instanceof Array) {
                this.copyNavigations({
                    expansions: args.expansions,
                    from: args.from,
                    fromDto: args.fromDto,
                    to: entity
                });
            }
        }

        return entity;
    }

    createObject(args: {
        expansions?: Expansion[];
        from: Indexable;
        fromDto?: boolean;
        metadata: EntityMetadata<any>;
        toDto?: boolean;
    }): Indexable {
        let obj = {};

        this.copyPrimitives({
            from: args.from,
            fromDto: args.fromDto,
            includeComputed: true,
            metadata: args.metadata,
            to: obj,
            toDto: args.toDto
        });

        if (args.expansions instanceof Array) {
            this.copyNavigations({
                expansions: args.expansions,
                from: args.from,
                fromDto: args.fromDto,
                to: obj,
                toDto: args.toDto
            });
        }

        return obj;
    }

    createSaveable(args: {
        from: Indexable;
        fromDto?: boolean;
        metadata: EntityMetadata<any>;
        toDto?: boolean;
    }): Indexable {
        let copy = this.createObject({
            from: args.from,
            fromDto: args.fromDto,
            metadata: args.metadata,
            toDto: args.toDto
        });

        return this.copyPrimitives({
            from: copy,
            fromDto: args.toDto,
            metadata: args.metadata,
            predicate: p => p.saveable,
            toDto: args.toDto
        });
    }

    /**
     * Copies all primitive properties of an entity type from one object to another.
     * An optional predicate can be supplied to filter copied primitives. Use fromDto & toDto to use aliases instead.
     *
     * * Objects, Arrays and Dates are cloned
     * * undefined values are ignored
     * * null values are included
     */
    copyPrimitives(args: {
        from: Indexable;
        fromDto?: boolean;
        includeComputed?: boolean;
        metadata: EntityMetadata<any>;
        predicate?: (p: Primitive) => boolean;
        to?: Indexable;
        toDto?: boolean;
    }): Indexable {
        let to = args.to || {};

        this._copyPrimitives(args);

        return to;
    }

    private _copyPrimitives(args: {
        from: Indexable;
        fromDto?: boolean;
        includeComputed?: boolean;
        metadata: EntityMetadata<any>;
        predicate?: (p: Primitive) => boolean;
        to?: Indexable;
        toDto?: boolean;
    }): Indexable {
        let to = args.to || {};

        let predicate = args.predicate
            ? args.includeComputed
                ? args.predicate
                : ((p: Primitive) => !p.computed && args.predicate(p))
            : args.includeComputed
                ? (() => true)
                : ((p: Primitive) => !p.computed);

        let fn = (p: Primitive) => {
            if (!predicate(p)) return;
            let fromName = p.getName(args.fromDto);
            let toName = p.getName(args.toDto);

            let value = args.from[fromName];
            if (value === undefined) return;

            if (value == null) {
                to[toName] = value;
            } else if ([ValueType.Array, ValueType.Object].includes(p.valueType)) {
                to[toName] = _.cloneDeep(value);
            } else if (p.valueType == ValueType.Date) {
                if (args.fromDto && args.toDto) {
                    to[toName] = value;
                } else if (args.fromDto && !args.toDto) {
                    if (value) {
                        to[toName] = new Date(value);
                    } else {
                        to[toName] = null;
                    }
                } else if (!args.fromDto && args.toDto) {
                    to[toName] = (value as Date).toISOString();
                } else {
                    to[toName] = new Date(value);
                }
            } else {
                to[toName] = value;
            }
        };

        args.metadata.primitives.forEach(fn);

        return to;
    }

    copyNavigations(args: {
        expansions: Expansion[];
        from: Indexable;
        fromDto?: boolean;
        predicate?: (p: NavigationType) => boolean;
        to?: Indexable;
        toDto?: boolean;
    }): Indexable {
        let to = args.to || {};
        let predicate = args.predicate || (() => true);

        args.expansions.forEach(exp => {
            let p = exp.property as NavigationType;
            if (!predicate(p)) return;

            let fromName = p.getName(args.fromDto);
            let toName = p.getName(args.toDto);

            let value = args.from[fromName];
            if (value === undefined) return;

            switch (p.type) {
                case "ref":
                    if (!(value instanceof Object)) return;

                    // if (args.toDto) {
                    //     to[toName] = this.createObject({
                    //         expansions: exp.expansions.slice(),
                    //         from: value,
                    //         fromDto: args.fromDto,
                    //         metadata: getEntityMetadata(p.otherType),
                    //         toDto: args.toDto
                    //     });
                    // } else {
                    //     to[toName] = this.createEntity({
                    //         entityType: p.otherType,
                    //         expansions: exp.expansions.slice(),
                    //         from: value,
                    //         fromDto: args.fromDto
                    //     });
                    // }
                    this._copyReference({
                        expansion: exp,
                        fromDto: args.fromDto,
                        property: p,
                        to: to,
                        toDto: args.toDto,
                        toName: toName,
                        value: value
                    });
                    break;

                case "array:ref":
                    if (!(value instanceof Array)) return;

                    if (args.toDto) {
                        let metadata = p.otherTypeMetadata;

                        to[toName] = value
                            .filter(ref => ref instanceof Object)
                            .map(ref => this.createObject({
                                expansions: exp.expansions.slice(),
                                from: ref,
                                fromDto: args.fromDto,
                                metadata: metadata,
                                toDto: args.toDto
                            }));
                    } else {
                        to[toName] = value
                            .filter(ref => ref instanceof Object)
                            .map(ref => this.createEntity({
                                entityType: p.otherType,
                                expansions: exp.expansions.slice(),
                                from: ref,
                                fromDto: args.fromDto
                            }));
                    }
                    break;

                case "array:child":
                    if (!(value instanceof Array)) return;

                    if (args.toDto) {
                        let metadata = p.otherTypeMetadata;
                        to[toName] = value
                            .filter(ref => ref instanceof Object)
                            .map(ref => this.createObject({
                                expansions: exp.expansions.slice(),
                                from: ref,
                                fromDto: args.fromDto,
                                metadata: metadata,
                                toDto: args.toDto
                            }));
                    } else {
                        let children = value
                            .filter(child => child instanceof Object)
                            .map(child => this.createEntity({
                                entityType: p.otherType,
                                expansions: exp.expansions.slice(),
                                from: child,
                                fromDto: args.fromDto
                            }));

                        to[toName] = children;
                        children.forEach(child => child[(p as Children).backReferenceName] = args.to);
                    }
                    break;
            }
        });

        return to;
    }

    private _copyReference(args: {
        expansion: Expansion;
        property: Reference;
        fromDto?: boolean;
        to: Indexable;
        toName: string;
        toDto?: boolean;
        value: Object;
    }): void {
        if (args.toDto) {
            args.to[args.toName] = this.createObject({
                expansions: args.expansion.expansions.slice(),
                from: args.value,
                fromDto: args.fromDto,
                metadata: args.property.otherTypeMetadata,
                toDto: args.toDto
            });
        } else {
            args.to[args.toName] = this.createEntity({
                entityType: args.property.otherType,
                expansions: args.expansion.expansions.slice(),
                from: args.value,
                fromDto: args.fromDto
            });
        }
    }

    updateReferenceKeys(args: {
        isDto?: boolean;
        item: Indexable;
        metadata: EntityMetadata<any>;
    }): void {
        args.metadata.references.forEach(refProp => {
            let ref = args.item[refProp.getName(args.isDto)];
            if (ref == null) return;

            let refMetadata = refProp.otherTypeMetadata;
            let refKeyProp = args.metadata.getPrimitive(refProp.keyName);
            args.item[refKeyProp.getName(args.isDto)] = ref[refMetadata.primaryKey.getName(args.isDto)];
        });

        args.metadata.collections.forEach(colProp => {
            let refs = args.item[colProp.getName(args.isDto)] as any[];
            if (refs == null || refs.length == 0) return;

            let refKeysProp = args.metadata.getPrimitive(colProp.keysName);
            let refMetadata = colProp.otherTypeMetadata;
            let refSelfKeyName = refMetadata.primaryKey.getName(args.isDto);

            args.item[refKeysProp.getName(args.isDto)] = _.uniq(refs.map(ref => ref[refSelfKeyName]).filter(id => id != null));
        });
    }
}
