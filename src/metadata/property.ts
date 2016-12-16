export class Property {
    readonly name: string;

    constructor(args: Property.ICtorArgs) {
        this.name = args.name;
    }
}

export module Property {
    export interface ICtorArgs {
        name: string;
    }
}
