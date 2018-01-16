import * as _ from "lodash";
import { AnyType, StringIndexable } from "../util";
import { Path } from "../elements";
import { AnyClassMetadata, AnyEntityType, IEntity, Local, Navigation } from "../metadata";
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
        metadata: AnyClassMetadata;
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
        metadata: AnyClassMetadata;
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
        metadata: AnyClassMetadata;
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

    static collectPath(items: IEntity[], path: Path, isDto = false): IEntity[] {
        let next = path;
        let collected = items;

        do {
            collected = this.collectNavigation(collected, next.property, isDto);
        } while ((next = next.next));

        return collected;
    }

    static collectPathedLocal(items: IEntity[], path: Path, local: Local, isDto = false): any[] {
        items = this.collectPath(items, path, isDto);

        return this.collectLocal(items, local, isDto);
    }

    static collectNavigation(items: IEntity[], nav: Navigation, isDto = false): IEntity[] {
        let l = items.length;
        let collected: IEntity[] = [];
        let navName = nav.getName(isDto);

        if (nav.type == "reference") {
            for (let i = 0; i < l; ++i) {
                collected.push(items[i][navName]);
            }
        } else {
            for (let i = 0; i < l; ++i) {
                collected = collected.concat(items[i][navName]);
            }
        }

        return collected;
    }

    static collectLocal(items: IEntity[], local: Local, isDto = false): any[] {
        let l = items.length;
        let collected: IEntity[] = [];
        let localName = local.getName(isDto);

        for (let i = 0; i < l; ++i) {
            collected.push(items[i][localName]);
        }

        return collected;
    }
}
