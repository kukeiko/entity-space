import { ValueType } from "./value-type";

export abstract class Property {
    readonly name: string;
    readonly valueType: ValueType;
    readonly alias: string;

    constructor(args: Property.ICtorArgs) {
        this.alias = args.alias || args.name;
        this.name = args.name;
        this.valueType = args.valueType == null ? ValueType.Any : args.valueType;
    }
}

export module Property {
    export interface ICtorArgs {
        alias?: string;
        name: string;
        valueType: ValueType;
    }
}
