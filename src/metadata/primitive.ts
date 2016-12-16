import { Property } from "./property";

export class Primitive extends Property {
    readonly index: boolean;

    constructor(args: Primitive.ICtorArgs) {
        super({ name: args.name });

        this.index = !!args.index;
    }
}

export module Primitive {
    export interface ICtorArgs {
        name: string;
        index?: boolean;
    }
}
