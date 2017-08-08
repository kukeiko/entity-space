export abstract class Property {
    readonly dtoName: string;
    readonly name: string;
    readonly saveable: boolean;

    constructor(args: Property.CtorArgs) {
        this.dtoName = args.dtoName || args.name;
        this.name = args.name;
        this.saveable = args.saveable || false;
    }

    getName(dto?: boolean): string {
        return dto ? this.dtoName : this.name;
    }
}

export module Property {
    export interface CtorArgs {
        dtoName?: string;
        name: string;
        saveable?: boolean;
    }
}
