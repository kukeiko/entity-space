import { Property } from "./property";
import { ValueType } from "./value-type";

export class Primitive extends Property {
    readonly index: boolean;
    readonly computed: boolean;
    readonly map?: (cached: any) => any;

    constructor(args: Primitive.ICtorArgs) {
        super({
            alias: args.alias,
            name: args.name,
            saveable: args.saveable,
            valueType: args.valueType
        });

        this.index = !!args.index;
        this.computed = !!args.computed;
        this.map = args.map || null;
    }
}

export module Primitive {
    export interface ICtorArgs {
        alias?: string;
        index?: boolean;
        computed?: boolean;
        map?: (cached: any) => any;
        name: string;
        saveable?: boolean;
        valueType?: ValueType;
    }
}
