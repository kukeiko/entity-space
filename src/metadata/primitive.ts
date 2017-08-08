import { NoArgsConstructable } from "../util";
import { Property } from "./property";
import { ValueType } from "./value-type";

export class Primitive extends Property {
    readonly index: boolean;
    readonly valueType: ValueType = ValueType.Unknown;
    readonly computed: boolean;
    readonly type: NoArgsConstructable = null;

    constructor(args: Primitive.CtorArgs) {
        super({
            dtoName: args.dtoName,
            name: args.name,
            saveable: args.saveable
        });

        this.index = !!args.index;
        this.computed = !!args.computed;
        this.type = args.type || null;

        if (ValueType[args.valueType] != null) {
            this.valueType = args.valueType;
        }
    }
}

export module Primitive {
    export interface CtorArgs {
        dtoName?: string;
        index?: boolean;
        computed?: boolean;
        name: string;
        saveable?: boolean;
        valueType?: ValueType;
        type?: NoArgsConstructable;
    }
}
