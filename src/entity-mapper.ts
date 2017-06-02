import * as _ from "lodash";
import { IStringIndexable } from "./util";
import { Expansion } from "./elements";
import {
    getEntityMetadata, EntityMetadata, IEntity, IEntityClass,
    Primitive, Children, NavigationType, ValueType
} from "./metadata";

export class EntityMapper {
    createEntity<T extends IEntity>(args: {
        entityType: IEntityClass<T>;
        expansions?: Expansion[];
        from?: IStringIndexable;
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
        from: IStringIndexable;
        fromDto?: boolean;
        metadata: EntityMetadata<any>;
        toDto?: boolean;
    }): IStringIndexable {
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
        from: IStringIndexable;
        fromDto?: boolean;
        metadata: EntityMetadata<any>;
        toDto?: boolean;
    }): IStringIndexable {
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

    compileCopyPrimitives(args: {
        fromDto?: boolean;
        includeComputed?: boolean;
        metadata: EntityMetadata<any>;
        predicate?: (p: Primitive) => boolean;
        toDto?: boolean;
    }): string {
        let predicate = args.predicate
            ? args.includeComputed
                ? args.predicate
                : ((p: Primitive) => !p.computed && args.predicate(p))
            : args.includeComputed
                ? (() => true)
                : ((p: Primitive) => !p.computed);

        let buffer: string[] = [];
        let line = (str: string) => buffer.push(str);

        line("function compile_test(args) {");

        args.metadata.primitives.forEach(p => {
            if (!predicate(p)) return;

            let fromName = p.getName(args.fromDto);
            let toName = p.getName(args.toDto);
            let valueName = toName;

            line(`\tvar ${valueName} = args.from.${fromName};`);
            line(`\tif(${valueName} === undefined) { return; }`);
            line(`\tif(${valueName} == null) { args.to.${toName} = null; return; }`);

            if ([ValueType.Array, ValueType.Object].includes(p.valueType)) {
                line(`\targs.to.${toName} = JSON.parse(JSON.stringify(${valueName}));`);
            } else if (p.valueType == ValueType.Date) {
                if (args.fromDto && args.toDto) {
                    line(`\targs.to.${toName} = ${valueName};`);
                } else if (args.fromDto && !args.toDto) {
                    line(`\targs.to.${toName} = ${valueName} ? new Date(${valueName}) : null;`);
                } else if (!args.fromDto && args.toDto) {
                    line(`\targs.to.${toName} = ${valueName}.toISOString();`);
                } else {
                    line(`\targs.to.${toName} = new Date(${valueName});`);
                }
            } else {
                line(`\targs.to.${toName} = ${valueName};`);
                line(``);
            }
        });

        buffer.push("}");

        return buffer.join("\n");
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
        from: IStringIndexable;
        fromDto?: boolean;
        includeComputed?: boolean;
        metadata: EntityMetadata<any>;
        predicate?: (p: Primitive) => boolean;
        to?: IStringIndexable;
        toDto?: boolean;
    }): IStringIndexable {
        let to = args.to || {};
        (window as any)["compile_test"](args);
        // let predicate = args.predicate
        //     ? args.includeComputed
        //         ? args.predicate
        //         : ((p: Primitive) => !p.computed && args.predicate(p))
        //     : args.includeComputed
        //         ? (() => true)
        //         : ((p: Primitive) => !p.computed);

        // let fn = (p: Primitive) => {
        //     if (!predicate(p)) return;
        //     let fromName = p.getName(args.fromDto);
        //     let toName = p.getName(args.toDto);

        //     let value = args.from[fromName];
        //     if (value === undefined) return;

        //     if (value == null) {
        //         to[toName] = value;
        //     } else if ([ValueType.Array, ValueType.Object].includes(p.valueType)) {
        //         to[toName] = _.cloneDeep(value);
        //     } else if (p.valueType == ValueType.Date) {
        //         if (args.fromDto && args.toDto) {
        //             to[toName] = value;
        //         } else if (args.fromDto && !args.toDto) {
        //             if (value) {
        //                 to[toName] = new Date(value);
        //             } else {
        //                 to[toName] = null;
        //             }
        //         } else if (!args.fromDto && args.toDto) {
        //             to[toName] = (value as Date).toISOString();
        //         } else {
        //             to[toName] = new Date(value);
        //         }
        //     } else {
        //         to[toName] = value;
        //     }
        // };

        // args.metadata.primitives.forEach(fn);

        return to;
    }

    copyNavigations(args: {
        expansions: Expansion[];
        from: IStringIndexable;
        fromDto?: boolean;
        predicate?: (p: NavigationType) => boolean;
        to?: IStringIndexable;
        toDto?: boolean;
    }): IStringIndexable {
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

                    if (args.toDto) {
                        to[toName] = this.createObject({
                            expansions: exp.expansions.slice(),
                            from: value,
                            fromDto: args.fromDto,
                            metadata: getEntityMetadata(p.otherType),
                            toDto: args.toDto
                        });
                    } else {
                        to[toName] = this.createEntity({
                            entityType: p.otherType,
                            expansions: exp.expansions.slice(),
                            from: value,
                            fromDto: args.fromDto
                        });
                    }
                    break;

                case "array:ref":
                    if (!(value instanceof Array)) return;

                    if (args.toDto) {
                        let metadata = getEntityMetadata(p.otherType);

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
                        let metadata = getEntityMetadata(p.otherType);
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

    updateReferenceKeys(args: {
        isDto?: boolean;
        item: IStringIndexable;
        metadata: EntityMetadata<any>;
    }): void {
        args.metadata.references.forEach(refProp => {
            let ref = args.item[refProp.getName(args.isDto)];
            if (ref == null) return;

            let refMetadata = getEntityMetadata(refProp.otherType);
            let refKeyProp = args.metadata.getPrimitive(refProp.keyName);
            args.item[refKeyProp.getName(args.isDto)] = ref[refMetadata.primaryKey.getName(args.isDto)];
        });

        args.metadata.collections.forEach(colProp => {
            let refs = args.item[colProp.getName(args.isDto)] as any[];
            if (refs == null || refs.length == 0) return;

            let refKeysProp = args.metadata.getPrimitive(colProp.keysName);
            let refMetadata = getEntityMetadata(colProp.otherType);
            let refSelfKeyName = refMetadata.primaryKey.getName(args.isDto);

            args.item[refKeysProp.getName(args.isDto)] = _.uniq(refs.map(ref => ref[refSelfKeyName]).filter(id => id != null));
        });
    }
}
