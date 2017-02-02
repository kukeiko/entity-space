import { Property } from "./property";
import { ValueType } from "./value-type";

export class Primitive extends Property {
    readonly index: boolean;
    readonly valueType: ValueType = ValueType.Unknown;
    readonly computed: boolean;
    readonly clone: boolean;
    readonly map?: (cached: any) => any;

    constructor(args: Primitive.ICtorArgs) {
        super({
            alias: args.alias,
            name: args.name,
            saveable: args.saveable
        });

        this.index = !!args.index;
        this.computed = !!args.computed;
        this.clone = !!args.clone;
        this.map = args.map || null;

        if (ValueType[args.valueType] != null) {
            this.valueType = args.valueType;
        }
    }
}

export module Primitive {
    export interface ICtorArgs {
        alias?: string;
        index?: boolean;
        clone?: boolean;
        computed?: boolean;
        map?: (cached: any) => any;
        name: string;
        saveable?: boolean;
        valueType?: ValueType;
    }
}
