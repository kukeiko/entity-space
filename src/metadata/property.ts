import { ValueType } from "./value-type";

export abstract class Property {
    readonly alias: string;
    readonly name: string;
    readonly saveable: boolean;
    readonly valueType: ValueType;

    constructor(args: Property.ICtorArgs) {
        this.alias = args.alias || args.name;
        this.name = args.name;
        this.saveable = args.saveable || false;
        this.valueType = args.valueType == null ? ValueType.Any : args.valueType;
    }
}

export module Property {
    export interface ICtorArgs {
        alias?: string;
        name: string;
        saveable?: boolean;
        valueType: ValueType;
    }
}
