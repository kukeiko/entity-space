import { ValueMetadata } from "./value-metadata";

export abstract class Property {
    readonly dtoName: string;
    readonly name: string;
    readonly valueMetadata: ValueMetadata;

    constructor(args: Property.ICtorArgs) {
        this.dtoName = args.dtoName || args.name;
        this.name = args.name;
        this.valueMetadata = args.valueMetadata;
    }
}

export module Property {
    export interface ICtorArgs {
        dtoName?: string;
        name: string;
        valueMetadata: ValueMetadata;
    }
}
