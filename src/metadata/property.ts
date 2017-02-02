export abstract class Property {
    readonly alias: string;
    readonly name: string;
    readonly saveable: boolean;

    constructor(args: Property.ICtorArgs) {
        this.alias = args.alias || args.name;
        this.name = args.name;
        this.saveable = args.saveable || false;
    }
}

export module Property {
    export interface ICtorArgs {
        alias?: string;
        name: string;
        saveable?: boolean;
    }
}
