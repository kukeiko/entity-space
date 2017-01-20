import { Property } from "./property";
import { ValueType } from "./value-type";

export class Primitive extends Property {
    readonly index: boolean;
    readonly computed: boolean;

    constructor(args: Primitive.ICtorArgs) {
        super({
            alias: args.alias,
            name: args.name,
            saveable: args.saveable,
            valueType: args.valueType
        });

        this.index = !!args.index;
        this.computed = !!args.computed;
    }
}

export module Primitive {
    export interface ICtorArgs {
        alias?: string;
        index?: boolean;
        computed?: boolean;
        name: string;
        saveable?: boolean;
        valueType?: ValueType;
    }
}
