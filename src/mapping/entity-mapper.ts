import * as _ from "lodash";
import { AnyType, StringIndexable } from "../util";
import { AnyEntityMetadata, AnyEntityType, EntityType, IEntity, Primitive, NavigationBase, NavigationType, ValueType } from "../metadata";
import { MappingCompiler, CopyPrimitivesFunction } from "./mapping-compiler";

export class EntityMapper {
    private static _compiler = new MappingCompiler();

    // todo: meh
    private static _copyPrimitives_dtoToEntity = new Map<AnyEntityType, CopyPrimitivesFunction>();
    private static _copyPrimitives_dtoToDto = new Map<AnyEntityType, CopyPrimitivesFunction>();
    private static _copyPrimitives_entityToEntity = new Map<AnyEntityType, CopyPrimitivesFunction>();
    private static _copyPrimitives_entityToDto = new Map<AnyEntityType, CopyPrimitivesFunction>();

    // todo: meh
    private static _copySaveables_dtoToEntity = new Map<AnyEntityType, CopyPrimitivesFunction>();
    private static _copySaveables_dtoToDto = new Map<AnyEntityType, CopyPrimitivesFunction>();
    private static _copySaveables_entityToEntity = new Map<AnyEntityType, CopyPrimitivesFunction>();
    private static _copySaveables_entityToDto = new Map<AnyEntityType, CopyPrimitivesFunction>();

    static copyPrimitives(args: {
        from: StringIndexable[];
        fromDto?: boolean;
        to?: StringIndexable[];
        toDto?: boolean;
        metadata: AnyEntityMetadata;
        type?: AnyType;
    }): StringIndexable[] {
        let to = args.to;
        let entityType = args.metadata.entityType;

        if (!to) {
            let instantiatedType = args.type
                ? args.type
                : args.toDto ? Object : entityType;

            to = args.from.map(() => new instantiatedType());
        }

        let map: Map<AnyEntityType, CopyPrimitivesFunction> = null;

        if (args.fromDto && args.toDto) {
            map = this._copyPrimitives_dtoToDto;
        } else if (args.fromDto && !args.toDto) {
            map = this._copyPrimitives_dtoToEntity;
        } else if (!args.fromDto && args.toDto) {
            map = this._copyPrimitives_entityToDto;
        } else {
            map = this._copyPrimitives_entityToEntity;
        }

        let fn = map.get(args.metadata.entityType);

        if (!fn) {
            fn = this._compiler.compileCopyPrimitives({
                fromDto: args.fromDto,
                toDto: args.toDto,
                metadata: args.metadata,
                predicate: p => !p.computed
            });

            map.set(entityType, fn);
        }

        fn(args.from, to, _);

        return to;
    }

    static copySaveables(args: {
        from: StringIndexable[];
        fromDto?: boolean;
        to?: StringIndexable[];
        toDto?: boolean;
        metadata: AnyEntityMetadata;
        type?: AnyType;
    }): StringIndexable[] {
        let to = args.to;
        let entityType = args.metadata.entityType;

        if (!to) {
            let instantiatedType = args.type
                ? args.type
                : args.toDto ? Object : entityType;

            to = args.from.map(() => new instantiatedType());
        }

        let map: Map<EntityType<any>, CopyPrimitivesFunction> = null;

        if (args.fromDto && args.toDto) {
            map = this._copySaveables_dtoToDto;
        } else if (args.fromDto && !args.toDto) {
            map = this._copySaveables_dtoToEntity;
        } else if (!args.fromDto && args.toDto) {
            map = this._copySaveables_entityToDto;
        } else {
            map = this._copySaveables_entityToEntity;
        }

        let fn = map.get(args.metadata.entityType);

        if (!fn) {
            fn = this._compiler.compileCopyPrimitives({
                fromDto: args.fromDto,
                toDto: args.toDto,
                metadata: args.metadata,
                predicate: p => p.saveable
            });

            map.set(entityType, fn);
        }

        fn(args.from, to, _);

        return to;
    }

    static updateReferenceKeys(args: {
        from: IEntity[];
        to?: IEntity[];
        metadata: AnyEntityMetadata;
    }): void {
        let to = args.to || args.from;

        args.metadata.references.forEach(refProp => {
            args.from.forEach((from, i) => {
                let to_i = to[i];
                let ref = from[refProp.name];
                let refKeyProp = args.metadata.getPrimitive(refProp.keyName);
                if (!refKeyProp.saveable) return;

                if (ref == null) {
                    to_i[refProp.keyName] = null;
                } else {
                    let refMetadata = refProp.otherTypeMetadata;
                    let refKeyProp = args.metadata.getPrimitive(refProp.keyName);

                    to_i[refKeyProp.name] = ref[refMetadata.primaryKey.name];
                }
            });
        });

        args.metadata.collections.forEach(colProp => {
            args.from.forEach((from, i) => {
                let to_i = to[i];
                let refs = from[colProp.name] as any[];
                let refKeysProp = args.metadata.getPrimitive(colProp.keysName);
                if (!refKeysProp.saveable) return;

                if (refs == null || refs.length == 0) {
                    to_i[colProp.keysName] = [];
                } else {
                    let refMetadata = colProp.otherTypeMetadata;
                    let refSelfKeyName = refMetadata.primaryKey.name;
                    to_i[colProp.keysName] = _.uniq(refs.map(ref => ref[refSelfKeyName]).filter(id => id != null));
                }
            });
        });
    }

    static collect(items: ArrayLike<StringIndexable>, prop: Primitive | NavigationBase, isDto?: boolean): any[] {
        let collected: any[] = [];
        let name = prop.getName(isDto);

        if (prop instanceof NavigationBase) {
            let nav = prop as NavigationType;

            switch (nav.type) {
                case "ref":
                    let item: any;

                    for (let i = 0; i < items.length; ++i) {
                        item = items[i][name];
                        if (!item) continue;

                        collected.push(item);
                    }
                    break;

                case "array:ref":
                case "array:child":
                    for (let i = 0; i < items.length; ++i) {
                        let array = items[i][name] as any[];

                        for (let e = 0; e < array.length; ++e) {
                            collected.push(array[e]);
                        }
                    }
                    break;
            }

        } else {
            switch (prop.valueType) {
                case ValueType.Array:
                    for (let i = 0; i < items.length; ++i) {
                        let array = items[i][name] as any[];

                        for (let e = 0; e < array.length; ++e) {
                            collected.push(array[e]);
                        }
                    }
                    break;

                default:
                    let value: any;

                    for (let i = 0; i < items.length; ++i) {
                        value = items[i][name];
                        if (value == null) continue;

                        collected.push(value);
                    }
                    break;
            }
        }

        return collected;
    }
}
