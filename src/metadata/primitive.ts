import { Property } from "./property";
import { ValueMetadata } from "./value-metadata";
import { ValueType } from "./value-type";

export class Primitive extends Property {
    readonly index: boolean;

    constructor(args: Primitive.ICtorArgs) {
        super({
            dtoName: args.dtoName,
            name: args.name,
            valueMetadata: args.valueMetadata || { type: ValueType.Any }
        });

        this.index = !!args.index;
    }
}

export module Primitive {
    export interface ICtorArgs {
        index?: boolean;
        dtoName?: string;
        name: string;
        valueMetadata?: ValueMetadata;
    }
}
