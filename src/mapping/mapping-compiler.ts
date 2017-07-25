import { guid, Indexable } from "../util";
import { EntityMetadata, Primitive, ValueType } from "../metadata";

export interface CopyPrimitivesFunction extends Function {
    (from: Indexable[], to: Indexable[]): void;
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

        line(`let target;`);
        line(`for(let i = 0; i < from.length; ++i) {`);
        line(`\ttarget = to[i];`);

        args.metadata.primitives.forEach(p => {
            if (!predicate(p)) return;

            let fromName = p.getName(args.fromDto);
            let toName = p.getName(args.toDto);
            let valueName = toName;

            line(``);
            line(`\tvar ${valueName} = from[i].${fromName};`);

            let assignment: string = null;

            if ([ValueType.Array, ValueType.Object].includes(p.valueType)) {
                assignment = `JSON.parse(JSON.stringify(${valueName}));`;
            } else if (p.valueType == ValueType.Date) {
                if (args.fromDto && args.toDto) {
                    assignment = `${valueName};`;
                } else if (args.fromDto && !args.toDto) {
                    assignment = `${valueName} ? new Date(${valueName}) : null;`;
                } else if (!args.fromDto && args.toDto) {
                    assignment = `${valueName}.toISOString();`;
                } else {
                    assignment = `new Date(${valueName});`;
                }
            } else {
                assignment = `${valueName}`;
            }

            line(`\ttarget.${toName} = ${valueName} == null ? null : ${assignment}`);
        });

        line(`}`);

        return new Function("from", "to", buffer.join("\n")) as CopyPrimitivesFunction;
    }
}
