import * as _ from "lodash";
import { AnyType, StringIndexable } from "../util";
import { AnyEntityMetadata, AnyEntityType, EntityType, IEntity, Primitive, Navigation } from "../metadata";
import { MappingCompiler, CopyLocals } from "./mapping-compiler";


type CopyEntityLocals = Map<AnyEntityType, CopyLocals>;

// todo: refactor common bodies of copyPrimitives() & copySaveables()
export class EntityMapper {
    private static _compiler = new MappingCompiler();

    // [fromDto => [toDto => [EntityType => CopyLocals]]]
    private static _copyPrimitives = new Map([
        [true, new Map([
            [true, new Map<AnyEntityType, CopyLocals>()],
            [false, new Map<AnyEntityType, CopyLocals>()]
        ])],
        [false, new Map([
            [true, new Map<AnyEntityType, CopyLocals>()],
            [false, new Map<AnyEntityType, CopyLocals>()]
        ])],
    ]);

    // [fromDto => [toDto => [EntityType => CopyLocals]]]
    private static _copySaveables = new Map([
        [true, new Map([
            [true, new Map<AnyEntityType, CopyLocals>()],
            [false, new Map<AnyEntityType, CopyLocals>()]
        ])],
        [false, new Map([
            [true, new Map<AnyEntityType, CopyLocals>()],
            [false, new Map<AnyEntityType, CopyLocals>()]
        ])],
    ]);

    static copyPrimitives(args: {
        from: StringIndexable[];
        fromDto?: boolean;
        to?: StringIndexable[];
        toDto?: boolean;
        metadata: AnyEntityMetadata;
        type?: AnyType;
    }): StringIndexable[] {
        let fromDto = !!args.fromDto;
        let toDto = !!args.toDto;

        let to = args.to;
        let entityType = args.metadata.entityType;

        if (!to) {
            let instantiatedType = args.type
                ? args.type
                : toDto ? Object : entityType;

            to = args.from.map(() => new instantiatedType());
        }

        let map = this._copyPrimitives.get(fromDto).get(toDto);
        let fn = map.get(args.metadata.entityType);

        if (!fn) {
            fn = this._compiler.compileCopyLocals({
                fromDto: fromDto,
                toDto: toDto,
                metadata: args.metadata,
                predicate: p => !p.computed
            });

            map.set(entityType, fn);
        }

        fn({
            from: args.from,
            lodash: _,
            metadata: args.metadata,
            to: to
        });

        return to;
    }

    // todo: uncoverable case: can't copy computed saveables if target is an entity
    // maybe even throw an error
    static copySaveables(args: {
        from: StringIndexable[];
        fromDto?: boolean;
        to?: StringIndexable[];
        toDto?: boolean;
        metadata: AnyEntityMetadata;
        type?: AnyType;
    }): StringIndexable[] {
        let fromDto = !!args.fromDto;
        let toDto = !!args.toDto;
        let to = args.to;
        let entityType = args.metadata.entityType;

        if (!to) {
            let instantiatedType = args.type
                ? args.type
                : toDto ? Object : entityType;

            to = args.from.map(() => new instantiatedType());
        }

        let map = this._copySaveables.get(fromDto).get(toDto);
        let fn = map.get(args.metadata.entityType);

        if (!fn) {
            fn = this._compiler.compileCopyLocals({
                fromDto: fromDto,
                toDto: toDto,
                metadata: args.metadata,
                predicate: p => p.saveable
            });

            map.set(entityType, fn);
        }

        fn({
            from: args.from,
            lodash: _,
            metadata: args.metadata,
            to: to
        });

        return to;
    }

    static updateReferenceKeys(args: {
        from: IEntity[];
        to?: IEntity[];
        metadata: AnyEntityMetadata;
    }): void {
        let to = args.to || args.from;

        args.metadata.references.forEach(refProp => {
            let refKey = args.metadata.getPrimitive(refProp.keyName);
            if (!refKey.saveable) return;

            let refPkName = refProp.otherTypeMetadata.primaryKey.name;

            args.from.forEach((from, i) => {
                let to_i = to[i];
                let ref = from[refProp.name];

                if (ref == null) {
                    to_i[refProp.keyName] = from[refKey.name];
                } else {
                    to_i[refProp.keyName] = ref[refPkName];
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
                    to_i[colProp.keysName] = (from[colProp.keysName] as Array<any>).slice();
                } else {
                    let refMetadata = colProp.otherTypeMetadata;
                    let refSelfKeyName = refMetadata.primaryKey.name;
                    to_i[colProp.keysName] = _.uniq(refs.map(ref => ref[refSelfKeyName]).filter(id => id != null));
                }
            });
        });
    }

    // todo: maybe Path could find a use as an argument?
    // todo: why is ist just Primitive | Navigation, and not any property?
    // todo: it flattens array properties
    static collect(items: ArrayLike<StringIndexable>, prop: Primitive | Navigation, isDto?: boolean): any[] {
        let collected: any[] = [];
        let name = prop.getName(isDto);

        switch (prop.base) {
            case "navigation":
                switch (prop.type) {
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
                break;

            case "local":
                let value: any;

                for (let i = 0; i < items.length; ++i) {
                    value = items[i][name];
                    if (value == null) continue;

                    collected.push(value);
                }
                break;
        }

        return collected;
    }
}
