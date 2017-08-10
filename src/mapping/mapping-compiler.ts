import { LoDashStatic } from "lodash";
import { StringIndexable } from "../util";
import { EntityMetadata, Primitive, ValueType } from "../metadata";

export interface CopyPrimitivesFunction extends Function {
    (from: StringIndexable[], to: StringIndexable[], lodash: LoDashStatic): void;
}

export class MappingCompiler {
    compileCopyPrimitives(args: {
        fromDto?: boolean;
        metadata: EntityMetadata<any>;
        predicate?: (p: Primitive) => boolean;
        toDto?: boolean;
    }): CopyPrimitivesFunction {
        let predicate = args.predicate || (() => true);

        let buffer: string[] = [];
        let line = (str: string) => buffer.push(str);

        line(`let target, source;`);
        line(`for(let i = 0; i < from.length; ++i) {`);
        line(`\ttarget = to[i];`);
        line(`\tsource = from[i];`);
        line(``);

        args.metadata.primitives.forEach(p => {
            if (!predicate(p)) return;

            let fromName = p.getName(args.fromDto);
            let toName = p.getName(args.toDto);
            let assignment: string = null;

            if ([ValueType.Array, ValueType.Object].includes(p.valueType)) {
                assignment = `JSON.parse(JSON.stringify(source.${fromName}))`;
            } else if (p.valueType == ValueType.Instance) {
                assignment = `lodash.cloneDeep(source.${fromName})`;
            } else if (p.valueType == ValueType.Date) {
                if (args.fromDto && args.toDto) {
                    assignment = `source.${fromName}`;
                } else if (args.fromDto && !args.toDto) {
                    assignment = `new Date(source.${fromName})`;
                } else if (!args.fromDto && args.toDto) {
                    assignment = `source.${fromName}.toISOString()`;
                } else {
                    assignment = `new Date(source.${fromName})`;
                }
            } else {
                assignment = `source.${fromName}`;
            }

            line(`\ttarget.${toName} = source.${fromName} != null ? ${assignment} : null;`);
            // line(`\ttarget.${toName} = source.${fromName} == null ? null : ${assignment}`);
        });

        line(`}`);

        return new Function("from", "to", "lodash", buffer.join("\n")) as CopyPrimitivesFunction;
    }
}
