import { Property } from "./property";
import { ValueMetadata } from "./value-metadata";
import { ValueType } from "./value-type";

export class Primitive extends Property {
    readonly index: boolean;
    readonly computed: boolean;

    constructor(args: Primitive.ICtorArgs) {
        super({
            name: args.name,
            valueMetadata: args.valueMetadata || { type: ValueType.Any }
        });

        this.index = !!args.index;
        this.computed = !!args.computed;
    }
}

export module Primitive {
    export interface ICtorArgs {
        index?: boolean;
        computed?: boolean;
        name: string;
        valueMetadata?: ValueMetadata;
    }
}
