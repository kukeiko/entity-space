import { LoDashStatic } from "lodash";
import { StringIndexable } from "../util";
import { AnyEntityMetadata, EntityMetadata, Local } from "../metadata";

export module CopyLocals {
    export interface Args {
        from: StringIndexable[];
        to: StringIndexable[];
        lodash: LoDashStatic;
        metadata: AnyEntityMetadata;
    }
}

export interface CopyLocals extends Function {
    (args: CopyLocals.Args): void;
}

export class MappingCompiler {
    compileCopyLocals(args: {
        fromDto?: boolean;
        metadata: EntityMetadata<any>;
        predicate?: (p: Local) => boolean;
        toDto?: boolean;
    }): CopyLocals {
        let predicate = args.predicate || (() => true);

        let buffer: string[] = [];
        let line = (str: string) => buffer.push(str);

        line(`let from = args.from, to = args.to;`);
        line(`let lodash = args.lodash`);
        line(`let metadata = args.metadata`);

        line(`let target, source;`);
        line(`for(let i = 0; i < from.length; ++i) {`);
        line(`\ttarget = to[i];`);
        line(`\tsource = from[i];`);
        line(``);

        args.metadata.locals.forEach(p => {
            if (!predicate(p)) return;

            let fromName = p.getName(args.fromDto);
            let toName = p.getName(args.toDto);
            let assignment: string = null;

            switch (p.type) {
                case "complex":
                    assignment = `JSON.parse(JSON.stringify(source.${fromName}));`;
                    break;

                case "date":
                    if (args.fromDto && args.toDto) {
                        assignment = `source.${fromName};`;
                    } else if (args.fromDto && !args.toDto) {
                        assignment = `source.${fromName} ? new Date(source.${fromName}) : null;`;
                    } else if (!args.fromDto && args.toDto) {
                        assignment = `source.${fromName}.toISOString();`;
                    } else {
                        assignment = `new Date(source.${fromName});`;
                    }
                    break;

                case "instance":
                    switch (p.cloneMethod) {
                        case "clone":
                            assignment = `lodash.cloneDeep(source.${fromName})`;
                            break;

                        case "copy-constructor":
                            assignment = `new metadata.entityType(source.${fromName})`;
                            break;
                    }
                    break;

                case "primitive":
                    assignment = `source.${fromName}`;
                    break;
            }

            line(`\ttarget.${toName} = source.${fromName} == null ? null : ${assignment}`);
        });

        line(`}`);

        return new Function("args", buffer.join("\n")) as CopyLocals;
    }
}
