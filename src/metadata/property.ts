import { ValueMetadata } from "./value-metadata";

export abstract class Property {
    readonly name: string;
    readonly valueMetadata: ValueMetadata;

    constructor(args: Property.ICtorArgs) {
        this.name = args.name;
        this.valueMetadata = args.valueMetadata;
    }
}

export module Property {
    export interface ICtorArgs {
        name: string;
        valueMetadata: ValueMetadata;
    }
}
